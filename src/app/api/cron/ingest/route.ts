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

export const dynamic = 'force-dynamic';

const rssAdapter = new RSSAdapter();
const ytAdapter = new YouTubeAdapter();
const instagramAdapter = new InstagramAdapter();
const facebookAdapter = new FacebookAdapter();
const twitterAdapter = new TwitterAdapter();
const redditAdapter = new RedditAdapter();

const fetchWithRetry = async <T>(
  promiseFn: () => Promise<T>,
  ms: number,
  sourceName: string,
  retries = 2,
  delay = 1000
): Promise<T> => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`[Timeout] Source "${sourceName}" exceeded ${ms}ms limit.`));
        }, ms);
        promiseFn()
          .then((value) => { clearTimeout(timer); resolve(value); })
          .catch((err) => { clearTimeout(timer); reject(err); });
      });
    } catch (err: any) {
      if (i === retries) throw err;
      console.warn(`[Retry ${i + 1}/${retries}] Source "${sourceName}" failed: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
      delay *= 2; // Exponential backoff
    }
  }
  throw new Error('Unreachable');
};

export async function POST(request: NextRequest) {
  return handleIngest(request);
}

export async function GET(request: NextRequest) {
  return handleIngest(request);
}

async function handleIngest(request: NextRequest) {
  const url = new URL(request.url);
  const sourceId = url.searchParams.get('sourceId');
  const platform = url.searchParams.get('platform');
  
  let customSources: any[] = [];
  try {
    if (request.method === 'POST') {
      const body = await request.json();
      if (body.customSources) {
        customSources = body.customSources;
      }
    } else if (request.method === 'GET') {
      // Cron job: fetch all custom sources from all users
      const usersSnap = await db.collection('users').get();
      const uniqueSources = new Map<string, any>();
      usersSnap.forEach(doc => {
        const userData = doc.data();
        if (userData.sources && Array.isArray(userData.sources)) {
          userData.sources.forEach(source => {
            if (source.enabled && source.isCustom) {
              uniqueSources.set(source.url, source);
            }
          });
        }
      });
      customSources = Array.from(uniqueSources.values());
    }
  } catch (e) {
    // ignore json parse error or db errors
  }
  
  try {
    let targetSources = [...DEFAULT_FEED_SOURCES, ...customSources].filter(s => s.enabled);
    console.log("Target sources:", targetSources.map(s => s.id));
    
    // Allow triggering a specific source update
    if (sourceId) {
      targetSources = targetSources.filter(s => s.id === sourceId);
    }
    
    // Allow triggering a specific platform update
    if (platform && platform !== 'all' && platform !== 'All') {
      targetSources = targetSources.filter(s => s.platform === platform);
    }
    
    const results = await Promise.allSettled(
      targetSources.map(async (source) => {
        let items: FeedItem[] = [];
        
        const isSocial = ['instagram', 'facebook', 'twitter'].includes(source.platform);
        // Generous timeout for background ingestion (60 seconds for social)
        const timeoutMs = isSocial ? 60000 : 15000;
        
        if (source.platform === 'youtube') items = await fetchWithRetry(() => ytAdapter.fetchFeed(source), timeoutMs, source.name);
        else if (source.platform === 'instagram') items = await fetchWithRetry(() => instagramAdapter.fetchFeed(source), timeoutMs, source.name);
        else if (source.platform === 'facebook') items = await fetchWithRetry(() => facebookAdapter.fetchFeed(source), timeoutMs, source.name);
        else if (source.platform === 'twitter') items = await fetchWithRetry(() => twitterAdapter.fetchFeed(source), timeoutMs, source.name);
        else if (source.platform === 'reddit') items = await fetchWithRetry(() => redditAdapter.fetchFeed(source), timeoutMs, source.name);
        else items = await fetchWithRetry(() => rssAdapter.fetchFeed(source), timeoutMs, source.name);
        
        return { sourceName: source.name, items };
      })
    );
    
    let totalIngested = 0;
    const errors: string[] = [];
    
    const allItems: FeedItem[] = [];
    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        allItems.push(...res.value.items);
      } else {
        errors.push(res.reason?.message || 'Unknown error');
      }
    });

    const BATCH_LIMIT = 450;
    for (let i = 0; i < allItems.length; i += BATCH_LIMIT) {
      const chunk = allItems.slice(i, i + BATCH_LIMIT);
      const batch = db.batch();
      
      chunk.forEach(item => {
        // The adapter has already generated a deterministic unique ID for this item
        const uniqueString = item.id;
        const safeId = Buffer.from(uniqueString).toString('base64').replace(/[/+=]/g, '_');
        
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
