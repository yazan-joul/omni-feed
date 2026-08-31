import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { FeedItem } from '@/lib/types';
import { DEFAULT_FEED_SOURCES } from '@/lib/config/default-sources';
import { FALLBACK_FEED_ITEMS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

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

  try {
    const TARGET_ITEMS = 12; // Reduced from 25.
    const MAX_LOOPS = 5; // Safety limit: max 5 queries per request (max 250 reads)
    
    let validItems: FeedItem[] = [];
    let currentCursor = cursor;
    let loops = 0;
    let hasMoreInDb = true;

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let crossed24h = false;

    while (validItems.length < TARGET_ITEMS && loops < MAX_LOOPS && hasMoreInDb && !crossed24h) {
      // Query global feed ordered by date
      let query = db.collection('feed_items')
        .orderBy('publishedAt', 'desc')
        .limit(50); // Read 50 at a time
        
      if (currentCursor) {
        query = query.startAfter(currentCursor);
      }

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        hasMoreInDb = false;
        break;
      }

      const docs = snapshot.docs;
      currentCursor = docs[docs.length - 1].data().publishedAt; // Advance cursor
      
      for (const doc of docs) {
        const item = doc.data() as FeedItem;
        
        const pubTime = new Date(item.publishedAt).getTime();
        const isToday = isNaN(pubTime) || (now - pubTime) < dayMs;

        // If we cross into yesterday, and we already have some items, we can stop early
        // so we don't aggressively dig into the past just to fill the grid.
        if (!isToday && validItems.length > 0 && !cursor) {
           crossed24h = true;
           // We don't break immediately so we can finish processing this chunk
           // but the while loop will terminate after this batch.
        }

        // 1. Check if source is active
        if (!activeSourceIds.has(item.sourceId)) continue;
        
        // 2. Check mediaType filter
        if (mediaType && mediaType !== 'all' && item.mediaType !== mediaType) continue;
        
        // 3. Check search filter
        if (search) {
          const s = search;
          const matches = 
            item.title.toLowerCase().includes(s) ||
            item.summary?.toLowerCase().includes(s) ||
            item.author.name.toLowerCase().includes(s) ||
            item.tags.some((tag) => tag.toLowerCase().includes(s));
          if (!matches) continue;
        }

        validItems.push({
          ...item,
          id: doc.id,
        });
        
        if (validItems.length >= TARGET_ITEMS) break; // We have enough for this page
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
    
    let fallbackItems = [...FALLBACK_FEED_ITEMS];
    if (platform && platform !== 'all' && platform !== 'All') {
      fallbackItems = fallbackItems.filter((item) => item.platform.toLowerCase() === platform.toLowerCase());
    }
    if (mediaType && mediaType !== 'all') {
      fallbackItems = fallbackItems.filter((item) => item.mediaType === mediaType);
    }
    if (search) {
      fallbackItems = fallbackItems.filter(
        (item) =>
          item.title.toLowerCase().includes(search) ||
          item.summary?.toLowerCase().includes(search) ||
          item.author.name.toLowerCase().includes(search) ||
          item.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      count: fallbackItems.length,
      items: fallbackItems,
      nextCursor: null,
      sourcesCount: activeSourceIds.size,
      failedSources: [],
    });
  }
}
