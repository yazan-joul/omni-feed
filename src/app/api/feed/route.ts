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
    const activeSourcesArray = Array.from(activeSourceIds);
    // Firestore limits `in` queries to 30 values
    const chunkSize = 30;
    const batches = [];
    for (let i = 0; i < activeSourcesArray.length; i += chunkSize) {
      batches.push(activeSourcesArray.slice(i, i + chunkSize));
    }

    const LIMIT = 50;
    
    // Fetch from all batches in parallel
    const snapshotPromises = batches.map(batch => {
      let query = db.collection('feed_items')
        .where('sourceId', 'in', batch)
        .orderBy('publishedAt', 'desc')
        .limit(LIMIT);
      
      if (cursor) {
        query = query.startAfter(cursor);
      }
      
      return query.get();
    });

    const snapshots = await Promise.all(snapshotPromises);
    
    let items: FeedItem[] = [];
    snapshots.forEach(snapshot => {
      snapshot.forEach(doc => {
        items.push(doc.data() as FeedItem);
      });
    });

    // Merge and sort
    items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    // Take top LIMIT items
    items = items.slice(0, LIMIT);

    let nextCursor = items.length === LIMIT ? items[items.length - 1].publishedAt : null;

    // Apply late-stage filters (search, mediaType)
    if (mediaType && mediaType !== 'all') {
      items = items.filter((item) => item.mediaType === mediaType);
    }

    if (search) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(search) ||
          item.summary?.toLowerCase().includes(search) ||
          item.author.name.toLowerCase().includes(search) ||
          item.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      count: items.length,
      items: items,
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
