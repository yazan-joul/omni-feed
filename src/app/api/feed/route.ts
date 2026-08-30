import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_FEED_SOURCES } from '@/lib/config/default-sources';
import { RSSAdapter } from '@/lib/adapters/rss.adapter';
import { YouTubeAdapter } from '@/lib/adapters/youtube.adapter';
import { BrightDataAdapter } from '@/lib/adapters/brightdata.adapter';
import { FALLBACK_FEED_ITEMS } from '@/lib/mock-data';
import { feedCache } from '@/lib/utils/cache';
import { FeedItem, FeedSource } from '@/lib/types';

const rssAdapter = new RSSAdapter();
const ytAdapter = new YouTubeAdapter();
const brightDataAdapter = new BrightDataAdapter();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const platform = searchParams.get('platform');
  const mediaType = searchParams.get('mediaType');
  const search = searchParams.get('search')?.toLowerCase();
  const customSourcesJson = searchParams.get('customSources');

  // Parse any client-provided custom sources
  let allSources: FeedSource[] = [...DEFAULT_FEED_SOURCES];
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

  if (category && category !== 'All' && category !== 'all') {
    targetSources = targetSources.filter((s) => s.category.toLowerCase() === category.toLowerCase());
  }

  if (platform && platform !== 'all') {
    targetSources = targetSources.filter((s) => s.platform.toLowerCase() === platform.toLowerCase());
  }

  // Check in-memory cache
  const cacheKey = `feed-${category || 'all'}-${platform || 'all'}-${targetSources.map((s) => s.id).join(',')}`;
  const cachedItems = feedCache.get<FeedItem[]>(cacheKey);

  let items: FeedItem[] = [];

  if (cachedItems && cachedItems.length > 0) {
    items = cachedItems;
  } else {
    // Ingest feeds concurrently across adapters
    const fetchPromises = targetSources.map(async (source) => {
      try {
        if (source.platform === 'youtube') {
          return await ytAdapter.fetchFeed(source);
        } else if (source.platform === 'brightdata') {
          return await brightDataAdapter.fetchFeed(source);
        } else {
          return await rssAdapter.fetchFeed(source);
        }
      } catch (err: any) {
        console.warn(`Error fetching source ${source.name}:`, err.message);
        return [];
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    const collected: FeedItem[] = [];

    results.forEach((res) => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        collected.push(...res.value);
      }
    });

    // If external network is completely blocked or returned nothing, serve enriched fallback items
    if (collected.length === 0) {
      console.log('[OmniFeed API] Serving fallback mock dataset for offline resilience.');
      items = [...FALLBACK_FEED_ITEMS];
    } else {
      items = collected;
    }

    // Sort descending by publish date
    items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Save to cache for 2 minutes
    feedCache.set(cacheKey, items, 1000 * 60 * 2);
  }

  // Apply filters on the collected items
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
  });
}
