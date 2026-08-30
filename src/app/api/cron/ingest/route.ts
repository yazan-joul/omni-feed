import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { DEFAULT_FEED_SOURCES } from '@/lib/config/default-sources';
import { FeedItem } from '@/lib/types';
import { RSSAdapter } from '@/lib/adapters/rss.adapter';
import { YouTubeAdapter } from '@/lib/adapters/youtube.adapter';
import { InstagramAdapter } from '@/lib/adapters/instagram.adapter';
import { FacebookAdapter } from '@/lib/adapters/facebook.adapter';
import { TwitterAdapter } from '@/lib/adapters/twitter.adapter';
import { RedditAdapter } from '@/lib/adapters/reddit.adapter';

// Optional: Security token to prevent unauthorized triggers
// export const maxDuration = 300; // Only works on Vercel Pro, ignored on hobby

const rssAdapter = new RSSAdapter();
const ytAdapter = new YouTubeAdapter();
const instagramAdapter = new InstagramAdapter();
const facebookAdapter = new FacebookAdapter();
const twitterAdapter = new TwitterAdapter();
const redditAdapter = new RedditAdapter();

const fetchWithTimeout = <T>(promise: Promise<T>, ms: number, sourceName: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[Timeout] Source "${sourceName}" exceeded ${ms}ms limit.`));
    }, ms);
    promise
      .then((value) => { clearTimeout(timer); resolve(value); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
};

export async function POST(request: NextRequest) {
  return handleIngest(request);
}

export async function GET(request: NextRequest) {
  // Allow GET for easy manual triggering during development
  return handleIngest(request);
}

async function handleIngest(request: NextRequest) {
  const url = new URL(request.url);
  const sourceId = url.searchParams.get('sourceId');
  
  try {
    let targetSources = DEFAULT_FEED_SOURCES.filter(s => s.enabled);
    
    // Allow triggering a specific source update
    if (sourceId) {
      targetSources = targetSources.filter(s => s.id === sourceId);
    }
    
    const results = await Promise.allSettled(
      targetSources.map(async (source) => {
        let items: FeedItem[] = [];
        
        const isSocial = ['instagram', 'facebook', 'twitter'].includes(source.platform);
        // Generous timeout for background ingestion (60 seconds for social)
        const timeoutMs = isSocial ? 60000 : 15000;
        
        if (source.platform === 'youtube') items = await fetchWithTimeout(ytAdapter.fetchFeed(source), timeoutMs, source.name);
        else if (source.platform === 'instagram') items = await fetchWithTimeout(instagramAdapter.fetchFeed(source), timeoutMs, source.name);
        else if (source.platform === 'facebook') items = await fetchWithTimeout(facebookAdapter.fetchFeed(source), timeoutMs, source.name);
        else if (source.platform === 'twitter') items = await fetchWithTimeout(twitterAdapter.fetchFeed(source), timeoutMs, source.name);
        else if (source.platform === 'reddit') items = await fetchWithTimeout(redditAdapter.fetchFeed(source), timeoutMs, source.name);
        else items = await fetchWithTimeout(rssAdapter.fetchFeed(source), timeoutMs, source.name);
        
        return { sourceName: source.name, items };
      })
    );
    
    let totalIngested = 0;
    const errors: string[] = [];
    
    // Firestore batch writes are limited to 500 ops.
    const allItems: FeedItem[] = [];
    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        allItems.push(...res.value.items);
      } else {
        errors.push(res.reason?.message || 'Unknown error');
      }
    });

    const BATCH_LIMIT = 450; // Keep safely below 500
    for (let i = 0; i < allItems.length; i += BATCH_LIMIT) {
      const chunk = allItems.slice(i, i + BATCH_LIMIT);
      const batch = db.batch();
      
      chunk.forEach(item => {
        const safeId = Buffer.from(item.id).toString('base64').replace(/[/+=]/g, '_');
        const docRef = db.collection('feed_items').doc(safeId);
        batch.set(docRef, item, { merge: true });
        totalIngested++;
      });
      
      await batch.commit();
    }
    
    return NextResponse.json({
      success: true,
      ingested: totalIngested,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (err: any) {
    console.error('Ingestion Failed:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
