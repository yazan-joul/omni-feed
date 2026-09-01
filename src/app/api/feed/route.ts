import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { FeedItem } from '@/lib/types';
import { DEFAULT_FEED_SOURCES } from '@/lib/config/default-sources';
import { FALLBACK_FEED_ITEMS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

// Global Cache State (persists perfectly in long-running Node processes like Railway)
let globalFeedCache: FeedItem[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const CACHE_SIZE = parseInt(process.env.FEED_CACHE_SIZE || '500', 10); // Configurable cache size

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore request timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

let refreshPromise: Promise<void> | null = null;

async function refreshCache() {
  if (refreshPromise) return refreshPromise;
  
  refreshPromise = (async () => {
    try {
      const snapshot = await withTimeout(
        db.collection('feed_items')
          .orderBy('publishedAt', 'desc')
          .limit(CACHE_SIZE)
          .get(),
        15000
      );

      const items: FeedItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as FeedItem);
      });

      if (globalFeedCache) {
        const defaultSourceIds = new Set(DEFAULT_FEED_SOURCES.map(ds => ds.id));
        const customItems = globalFeedCache.filter(item => !defaultSourceIds.has(item.sourceId));
        const uniqueItems = new Map<string, FeedItem>();
        for (const item of items) uniqueItems.set(item.id, item);
        for (const item of customItems) uniqueItems.set(item.id, item);
        
        const newCache = Array.from(uniqueItems.values());
        newCache.sort((a, b) => {
          const tA = new Date(a.publishedAt).getTime();
          const tB = new Date(b.publishedAt).getTime();
          return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
        });
        globalFeedCache = newCache.slice(0, CACHE_SIZE);
      } else {
        globalFeedCache = items;
      }
      lastCacheTime = Date.now();
      console.log(`[Cache] Background refresh complete. Loaded ${items.length} items.`);
    } catch (error) {
      console.error('[Cache] Failed to refresh:', error);
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
    const TARGET_ITEMS = parseInt(process.env.FEED_TARGET_ITEMS || '24', 10); 
    
    let validItems: FeedItem[] = [];
    let currentCursor = cursor;

    // ==========================================
    // FAST PATH: Memory Cache
    // ==========================================
    if (!globalFeedCache || forceRefresh) {
      await refreshCache();
    } else if (Date.now() - lastCacheTime > CACHE_TTL) {
      refreshCache();
    }

    if (globalFeedCache) {
      // First check which custom source IDs actually have items in cache
      const cachedSourceIds = new Set(globalFeedCache.map(i => i.sourceId));
      const defaultSourceIds = new Set(DEFAULT_FEED_SOURCES.map(ds => ds.id));
      const missingCustomIds = [...activeSourceIds].filter(id => 
        !defaultSourceIds.has(id) && !cachedSourceIds.has(id)
      );
      
      // If any custom sources have no items in cache, fetch them directly from Firestore
      if (missingCustomIds.length > 0) {
        try {
          let addedNewItems = false;
          
          // Firebase 'in' queries support max 30 items
          const chunkSize = 30;
          const chunks = [];
          for (let i = 0; i < missingCustomIds.length; i += chunkSize) {
            chunks.push(missingCustomIds.slice(i, i + chunkSize));
          }

          const fetchPromises = chunks.map(chunk => 
            withTimeout<any>(
              db.collection('feed_items')
                .where('sourceId', 'in', chunk)
                .orderBy('publishedAt', 'desc')
                .limit(parseInt(process.env.FEED_CUSTOM_FETCH_LIMIT || '50', 10))
                .get(),
              15000
            )
          );

          const results = await Promise.allSettled(fetchPromises);
          
          const tempNewItems: FeedItem[] = [];
          results.forEach(result => {
            if (result.status === 'fulfilled' && !result.value.empty) {
              result.value.forEach((doc: any) => {
                tempNewItems.push({ id: doc.id, ...doc.data() } as FeedItem);
                addedNewItems = true;
              });
            }
          });

          if (addedNewItems) {
            const uniqueItems = new Map<string, FeedItem>();
            for (const item of globalFeedCache!) {
              uniqueItems.set(item.id, item);
            }
            for (const item of tempNewItems) {
              uniqueItems.set(item.id, item);
            }
            const newCache = Array.from(uniqueItems.values());
            newCache.sort((a, b) => {
              const tA = new Date(a.publishedAt).getTime();
              const tB = new Date(b.publishedAt).getTime();
              const validA = isNaN(tA) ? 0 : tA;
              const validB = isNaN(tB) ? 0 : tB;
              return validB - validA;
            });
            globalFeedCache = newCache.slice(0, CACHE_SIZE);
          }
        } catch (e) {
          console.warn('[Feed] Failed to fetch missing custom source items:', e);
        }
      }

      let startIndex = 0;
      if (currentCursor) {
        const idx = globalFeedCache.findIndex(i => i.publishedAt === currentCursor);
        startIndex = idx !== -1 ? idx + 1 : -1;
      }

      if (startIndex !== -1) {
        for (let i = startIndex; i < globalFeedCache.length; i++) {
          const item = globalFeedCache[i];
          if (!activeSourceIds.has(item.sourceId)) continue;
          if (mediaType && mediaType !== 'all' && item.mediaType !== mediaType) continue;
          if (search) {
            const authorName = typeof item.author === 'string' ? item.author : item.author?.name || '';
            const matches = 
              (item.title && item.title.toLowerCase().includes(search)) ||
              (item.summary && item.summary.toLowerCase().includes(search)) ||
              authorName.toLowerCase().includes(search) ||
              (Array.isArray(item.tags) && item.tags.some((tag) => typeof tag === 'string' && tag.toLowerCase().includes(search)));
            if (!matches) continue;
          }

          validItems.push(item);
          currentCursor = item.publishedAt;
          if (validItems.length >= TARGET_ITEMS) break; 
        }

        if (validItems.length >= TARGET_ITEMS) {
          return NextResponse.json({
            success: true,
            count: validItems.length,
            items: validItems,
            nextCursor: currentCursor,
            sourcesCount: activeSourceIds.size,
            failedSources: [],
          });
        }
        
        // If we exhausted cache without filling TARGET_ITEMS, 
        // set currentCursor to the LAST item in the cache so DEEP PATH can pick up perfectly.
        if (globalFeedCache.length > 0) {
          currentCursor = globalFeedCache[globalFeedCache.length - 1].publishedAt;
        }
      }
    }

    // ==========================================
    // DEEP PATH: Load More / Cursor -> Firestore DB
    // ==========================================
    const MAX_LOOPS = parseInt(process.env.FEED_MAX_DB_LOOPS || '5', 10); 
    let loops = 0;
    let hasMoreInDb = true;

    while (validItems.length < TARGET_ITEMS && loops < MAX_LOOPS && hasMoreInDb) {
      let query = db.collection('feed_items') as any;
      query = query.orderBy('publishedAt', 'desc').limit(200);
        
      if (currentCursor) {
        query = query.startAfter(currentCursor);
      }

      const snapshot = await withTimeout<any>(query.get(), 15000);
      
      if (snapshot.empty) {
        hasMoreInDb = false;
        break;
      }

      const docs = snapshot.docs;
      
      for (const doc of docs) {
        currentCursor = doc.data().publishedAt;
        const item = doc.data() as FeedItem;
        
        if (!activeSourceIds.has(item.sourceId)) continue;
        if (mediaType && mediaType !== 'all' && item.mediaType !== mediaType) continue;
        if (search) {
          const authorName = typeof item.author === 'string' ? item.author : item.author?.name || '';
          const matches = 
            (item.title && item.title.toLowerCase().includes(search)) ||
            (item.summary && item.summary.toLowerCase().includes(search)) ||
            authorName.toLowerCase().includes(search) ||
            (Array.isArray(item.tags) && item.tags.some((tag) => typeof tag === 'string' && tag.toLowerCase().includes(search)));
          if (!matches) continue;
        }

        validItems.push(item);
        if (validItems.length >= TARGET_ITEMS) break; 
      }
      loops++;
    }

    // We must return the cursor as long as hasMoreInDb is true, even if validItems is empty,
    // so the client can continue paginating past large gaps of unfiltered items.
    const nextCursor = hasMoreInDb ? currentCursor : null;

    return NextResponse.json({
      success: true,
      count: validItems.length,
      items: validItems,
      nextCursor,
      sourcesCount: activeSourceIds.size,
      failedSources: [],
    });
  } catch (error: any) {
    console.error('Error fetching from Firestore:', error?.message || error);
    
    // Graceful fallback for local development or transient Firestore connectivity issues
    const fallbackMatches = FALLBACK_FEED_ITEMS.filter((item) => {
      if (platform && platform !== 'all' && item.platform.toLowerCase() !== platform.toLowerCase()) return false;
      if (mediaType && mediaType !== 'all' && item.mediaType !== mediaType) return false;
      return true;
    });

    if (fallbackMatches.length > 0) {
      return NextResponse.json({
        success: true,
        count: fallbackMatches.length,
        items: fallbackMatches,
        nextCursor: null,
        sourcesCount: activeSourceIds.size,
        failedSources: [],
        isFallback: true,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch items from database.',
      count: 0,
      items: [],
      nextCursor: null,
      sourcesCount: activeSourceIds.size,
      failedSources: [],
    });
  }
}
