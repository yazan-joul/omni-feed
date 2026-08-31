import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { FeedItem } from '@/lib/types';
import { DEFAULT_FEED_SOURCES } from '@/lib/config/default-sources';
import { FALLBACK_FEED_ITEMS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

// Global Cache State (persists perfectly in long-running Node processes like Railway)
let globalFeedCache: FeedItem[] | null = null;
let lastCacheTime = 0;
let isRefreshing = false;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const CACHE_SIZE = 300; // Hold the top 300 recent items in memory for instant filtering

async function refreshCache() {
  if (isRefreshing) return;
  isRefreshing = true;
  try {
    const snapshot = await db.collection('feed_items')
      .orderBy('publishedAt', 'desc')
      .limit(CACHE_SIZE)
      .get();

    const items: FeedItem[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as FeedItem);
    });

    globalFeedCache = items;
    lastCacheTime = Date.now();
    console.log(`[Cache] Background refresh complete. Loaded ${items.length} items.`);
  } catch (error) {
    console.error('[Cache] Failed to refresh:', error);
  } finally {
    isRefreshing = false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const mediaType = searchParams.get('mediaType');
  const search = searchParams.get('search')?.toLowerCase();
  
  // Custom sources and disabled defaults from the user
  const customSourcesJson = searchParams.get('customSources');
  const disabledDefaultsJson = searchParams.get('disabledDefaults');

  let activeSourceIds = new Set<string>();
  
  // 1. Gather all default sources
  let allSources = [...DEFAULT_FEED_SOURCES];
  
  // 2. Remove disabled defaults
  if (disabledDefaultsJson) {
    try {
      const disabledIds: string[] = JSON.parse(disabledDefaultsJson);
      allSources = allSources.filter(s => !disabledIds.includes(s.id));
    } catch {}
  }
  
  // 3. Add custom sources
  if (customSourcesJson) {
    try {
      const customSources = JSON.parse(customSourcesJson);
      allSources = [...allSources, ...customSources];
    } catch {}
  }
  
  // Filter by platform if needed
  if (platform && platform !== 'all' && platform !== 'All') {
    allSources = allSources.filter(s => s.platform.toLowerCase() === platform.toLowerCase());
  }
  
  // Only enabled sources
  allSources.filter(s => s.enabled).forEach(s => activeSourceIds.add(s.id));

  // If no sources enabled, return empty
  if (activeSourceIds.size === 0) {
    return NextResponse.json({
      success: true,
      count: 0,
      items: [],
      sourcesCount: 0,
    });
  }

  const cursor = searchParams.get('cursor');
  const forceRefresh = searchParams.get('forceRefresh') === 'true';

  try {
    const TARGET_ITEMS = 12; 
    
    // ==========================================
    // FAST PATH: Initial Load (No Cursor) -> Memory Cache
    // ==========================================
    if (!cursor) {
      if (!globalFeedCache || forceRefresh) {
        // Block and fetch if cache is totally empty or forced
        await refreshCache();
      } else if (Date.now() - lastCacheTime > CACHE_TTL) {
        // Stale-While-Revalidate: Trigger background refresh without blocking user
        refreshCache();
      }

      if (globalFeedCache) {
        const validItems: FeedItem[] = [];
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        let crossed24h = false;

        for (const item of globalFeedCache) {
          const pubTime = new Date(item.publishedAt).getTime();
          const isToday = isNaN(pubTime) || (now - pubTime) < dayMs;

          if (!isToday && validItems.length > 0) {
            crossed24h = true;
          }

          if (!activeSourceIds.has(item.sourceId)) continue;
          if (mediaType && mediaType !== 'all' && item.mediaType !== mediaType) continue;
          if (search) {
            const matches = 
              item.title.toLowerCase().includes(search) ||
              item.summary?.toLowerCase().includes(search) ||
              item.author.name.toLowerCase().includes(search) ||
              item.tags.some((tag) => tag.toLowerCase().includes(search));
            if (!matches) continue;
          }

          validItems.push(item);
          if (validItems.length >= TARGET_ITEMS) break; 
        }

        // The cursor for the next fetch is just the timestamp of the last item we pulled from cache
        const nextCursor = validItems.length > 0 ? validItems[validItems.length - 1].publishedAt : null;

        return NextResponse.json({
          success: true,
          count: validItems.length,
          items: validItems,
          nextCursor,
          sourcesCount: activeSourceIds.size,
          failedSources: [],
        });
      }
    }

    // ==========================================
    // DEEP PATH: Load More / Cursor -> Firestore DB
    // ==========================================
    const MAX_LOOPS = 5; 
    let validItems: FeedItem[] = [];
    let currentCursor = cursor;
    let loops = 0;
    let hasMoreInDb = true;

    while (validItems.length < TARGET_ITEMS && loops < MAX_LOOPS && hasMoreInDb) {
      let query = db.collection('feed_items')
        .orderBy('publishedAt', 'desc')
        .limit(50);
        
      if (currentCursor) {
        query = query.startAfter(currentCursor);
      }

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        hasMoreInDb = false;
        break;
      }

      const docs = snapshot.docs;
      currentCursor = docs[docs.length - 1].data().publishedAt;
      
      for (const doc of docs) {
        const item = doc.data() as FeedItem;
        
        if (!activeSourceIds.has(item.sourceId)) continue;
        if (mediaType && mediaType !== 'all' && item.mediaType !== mediaType) continue;
        if (search) {
          const s = search;
          const matches = 
            item.title.toLowerCase().includes(s) ||
            item.summary?.toLowerCase().includes(s) ||
            item.author.name.toLowerCase().includes(s) ||
            item.tags.some((tag) => tag.toLowerCase().includes(s));
          if (!matches) continue;
        }

        validItems.push({ ...item, id: doc.id });
        if (validItems.length >= TARGET_ITEMS) break; 
      }
      loops++;
    }

    const nextCursor = (hasMoreInDb && validItems.length > 0) ? currentCursor : null;

    return NextResponse.json({
      success: true,
      count: validItems.length,
      items: validItems,
      nextCursor,
      sourcesCount: activeSourceIds.size,
      failedSources: [],
    });
  } catch (error: any) {
    console.error('Error fetching from Firestore, falling back to cached items:', error?.message || error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch items',
      items: []
    });
  }
}
