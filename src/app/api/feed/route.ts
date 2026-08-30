import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { FeedItem } from '@/lib/types';
import { DEFAULT_FEED_SOURCES } from '@/lib/config/default-sources';

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

  try {
    // We fetch the latest 500 items across the board and filter in memory since
    // Firebase IN queries are limited to 30 elements, and we might have custom feeds.
    const snapshot = await db.collection('feed_items')
      .orderBy('publishedAt', 'desc')
      .limit(500)
      .get();
      
    let items: FeedItem[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data() as FeedItem;
      // Filter out items that are not from an active source
      if (activeSourceIds.has(data.sourceId)) {
        items.push(data);
      }
    });

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
      sourcesCount: activeSourceIds.size,
      failedSources: [],
    });
  } catch (error: any) {
    console.error('Error fetching from Firestore:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load feed',
      items: []
    }, { status: 500 });
  }
}
