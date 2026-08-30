import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_FEED_SOURCES } from '@/lib/config/default-sources';
import { RSSAdapter } from '@/lib/adapters/rss.adapter';
import { YouTubeAdapter } from '@/lib/adapters/youtube.adapter';
import { BrightDataAdapter } from '@/lib/adapters/brightdata.adapter';
import { InstagramAdapter } from '@/lib/adapters/instagram.adapter';
import { FacebookAdapter } from '@/lib/adapters/facebook.adapter';
import { TwitterAdapter } from '@/lib/adapters/twitter.adapter';
import { RedditAdapter } from '@/lib/adapters/reddit.adapter';
import { FALLBACK_FEED_ITEMS } from '@/lib/mock-data';
import { feedCache } from '@/lib/utils/cache';
import { FeedItem, FeedSource } from '@/lib/types';
import { after } from 'next/server';

const rssAdapter = new RSSAdapter();
const ytAdapter = new YouTubeAdapter();
const brightDataAdapter = new BrightDataAdapter();
const instagramAdapter = new InstagramAdapter();
const facebookAdapter = new FacebookAdapter();
const twitterAdapter = new TwitterAdapter();
const redditAdapter = new RedditAdapter();

// Limit social actor concurrency to max 2 concurrent runs to respect Apify plan limits
let socialRunning = 0;
const socialQueue: (() => void)[] = [];

const acquireSocialLock = async (): Promise<void> => {
  if (socialRunning < 2) {
    socialRunning++;
    return;
  }
  return new Promise((resolve) => {
    socialQueue.push(() => {
      socialRunning++;
      resolve();
    });
  });
};

const releaseSocialLock = () => {
  socialRunning = Math.max(0, socialRunning - 1);
  if (socialQueue.length > 0 && socialRunning < 2) {
    const next = socialQueue.shift();
    if (next) next();
  }
};

// Next.js Route Cache TTL config
export const revalidate = 300;

// --- Timeout Guard Wrapper ---
const fetchWithTimeout = <T>(promise: Promise<T>, ms: number, sourceName: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[Timeout Guard] Source "${sourceName}" exceeded ${ms}ms limit.`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const mediaType = searchParams.get('mediaType');
  const search = searchParams.get('search')?.toLowerCase();
  const customSourcesJson = searchParams.get('customSources');
  const disabledDefaultsJson = searchParams.get('disabledDefaults');
  const forceRefresh = searchParams.get('forceRefresh') === 'true';

  // Load default sources
  let allSources: FeedSource[] = [...DEFAULT_FEED_SOURCES];

  // Filter out any default sources the user explicitly disabled
  if (disabledDefaultsJson) {
    try {
      const disabledIds: string[] = JSON.parse(disabledDefaultsJson);
      allSources = allSources.filter((s) => !disabledIds.includes(s.id));
    } catch {
      // Ignore
    }
  }

  // Parse any client-provided custom sources
  if (customSourcesJson) {
    try {
      const customSources: FeedSource[] = JSON.parse(customSourcesJson);
      allSources = [...allSources, ...customSources];
    } catch {
      // Ignore parse errors on custom sources
    }
  }

  // Filter sources by enabled status
  let targetSources = allSources.filter((s) => s.enabled);

  const isSpecificPlatform = platform && platform !== 'all' && platform !== 'All';

  if (isSpecificPlatform) {
    targetSources = targetSources.filter((s) => s.platform.toLowerCase() === platform.toLowerCase());
  }

  // --- Per-Source Fetching with SWR & Timeouts ---
  const fetchPromises = targetSources.map(async (source) => {
    const cacheKey = `source-${source.id}`;
    
    // Check per-source cache
    const { data: cachedData, isStale } = feedCache.getWithStale<FeedItem[]>(cacheKey);

    // Background fetch function to re-ingest and update cache
    const revalidate = async (): Promise<FeedItem[]> => {
      const isInstagram = source.platform === 'instagram';
      const isFacebook = source.platform === 'facebook';
      const isTwitter = source.platform === 'twitter';
      const isReddit = source.platform === 'reddit';
      const isSocial = isInstagram || isFacebook || isTwitter || isReddit || ['brightdata', 'linkedin'].includes(source.platform);

      if (isSocial) {
        await acquireSocialLock();
      }

      try {
        let items: FeedItem[] = [];

        if (source.platform === 'youtube') {
          items = await ytAdapter.fetchFeed(source);
        } else if (isInstagram) {
          items = await instagramAdapter.fetchFeed(source);
        } else if (isFacebook) {
          items = await facebookAdapter.fetchFeed(source);
        } else if (isTwitter) {
          items = await twitterAdapter.fetchFeed(source);
        } else if (isReddit) {
          items = await redditAdapter.fetchFeed(source);
        } else if (isSocial) {
          items = await brightDataAdapter.fetchFeed(source);
        } else {
          items = await rssAdapter.fetchFeed(source);
        }
        
        if (items.length > 0) {
          // BMAD Strategy: 6 hours TTL for Apify/Social, 3 minutes for standard RSS/YouTube
          const ttlMs = isSocial ? 1000 * 60 * 60 * 6 : 1000 * 60 * 3;
          feedCache.set(cacheKey, items, ttlMs);
        }
        return items;
      } catch (err: any) {
        console.warn(`[Revalidate Error] Source ${source.name}:`, err.message);
        throw err; // Re-throw to be caught by fetchWithTimeout or outer try-catch
      } finally {
        if (isSocial) {
          releaseSocialLock();
        }
      }
    };

    const isInstagram = source.platform === 'instagram';
    const isFacebook = source.platform === 'facebook';
    const isTwitter = source.platform === 'twitter';
    const isReddit = source.platform === 'reddit';
    const isSocial = isInstagram || isFacebook || isTwitter || isReddit || ['brightdata', 'linkedin'].includes(source.platform);

    // If forceRefresh is requested, bypass cache entirely
    if (forceRefresh) {
      try {
        const timeoutMs = isSocial ? 35000 : 7500;
        const freshItems = await fetchWithTimeout(revalidate(), timeoutMs, source.name);
        return { items: freshItems || [], sourceName: source.name, failed: freshItems?.length === 0 };
      } catch (err: any) {
        console.warn(`[Force Refresh] ${source.name}:`, err.message);
        return { items: cachedData || [], sourceName: source.name, failed: true };
      }
    }

    // 1. FRESH HIT
    if (cachedData && !isStale) {
      return { items: cachedData, sourceName: source.name, failed: false };
    }

    // 2. STALE HIT
    if (cachedData && isStale) {
      if (!isSocial) {
        after(async () => {
          await revalidate().catch(console.error);
        });
      }
      return { items: cachedData, sourceName: source.name, failed: false };
    }

    // 3. CACHE MISS
    try {
      const timeoutMs = isSocial ? 35000 : 7500;
      const freshItems = await fetchWithTimeout(revalidate(), timeoutMs, source.name);
      return { items: freshItems || [], sourceName: source.name, failed: freshItems?.length === 0 };
    } catch (err: any) {
      console.warn(`[Live Fetch] ${source.name}:`, err.message);
      return { items: [], sourceName: source.name, failed: true };
    }
  });

  // Await all parallel source requests
  const results = await Promise.all(fetchPromises);
  const collected: FeedItem[] = results.map(r => r.items).flat();
  const failedSources = results.filter(r => r.failed).map(r => r.sourceName);

  // If user has NO active sources enabled or has removed all sources, return empty array immediately
  if (targetSources.length === 0) {
    return NextResponse.json({
      success: true,
      count: 0,
      items: [],
      sourcesCount: 0,
    });
  }

  // 100% Authentic Posts: Never inject simulation / mock datasets
  let items = collected;

  // Sort universally by date descending
  items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Apply late-stage filters (search, mediaType) on the flattened array
  let filteredItems = items;

  if (mediaType && mediaType !== 'all') {
    filteredItems = filteredItems.filter((item) => item.mediaType === mediaType);
  }

  if (search) {
    filteredItems = filteredItems.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        item.summary?.toLowerCase().includes(search) ||
        item.author.name.toLowerCase().includes(search) ||
        item.tags.some((tag) => tag.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({
    success: true,
    count: filteredItems.length,
    items: filteredItems,
    sourcesCount: targetSources.length,
    failedSources,
  });
}
