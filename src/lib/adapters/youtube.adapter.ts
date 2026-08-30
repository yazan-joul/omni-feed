import { XMLParser } from 'fast-xml-parser';
import { FeedAdapter } from './types';
import { FeedItem, FeedSource } from '../types';
import { decodeHtmlEntities } from '../utils/decode';

// In-memory channel ID resolution cache to avoid redundant HTML scraping
const channelIdCache = new Map<string, string>();

export class YouTubeAdapter implements FeedAdapter {
  readonly platform = 'youtube';
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: true, // cleans yt: and media: prefixes
    });
  }

  /**
   * Universal YouTube Channel ID & Feed URL Resolver
   * Handles:
   * - Raw XML RSS URLs: https://www.youtube.com/feeds/videos.xml?channel_id=UC...
   * - Channel URLs: https://www.youtube.com/channel/UC...
   * - Handles: https://www.youtube.com/@Fireship or @Fireship
   * - Custom URLs: https://www.youtube.com/c/username or /user/username
   */
  async resolveChannelId(input: string): Promise<string | null> {
    if (!input) return null;
    const clean = input.trim();

    // Direct UC... ID check (24 chars starting with UC)
    if (/^UC[a-zA-Z0-9_-]{22}$/.test(clean)) {
      return clean;
    }

    // Check memory cache
    if (channelIdCache.has(clean)) {
      return channelIdCache.get(clean)!;
    }

    // Extract channel_id from feed URL query
    const feedMatch = clean.match(/channel_id=(UC[a-zA-Z0-9_-]{22})/i);
    if (feedMatch && feedMatch[1]) {
      channelIdCache.set(clean, feedMatch[1]);
      return feedMatch[1];
    }

    // Extract from /channel/UC... URL
    const channelUrlMatch = clean.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/i);
    if (channelUrlMatch && channelUrlMatch[1]) {
      channelIdCache.set(clean, channelUrlMatch[1]);
      return channelUrlMatch[1];
    }

    // Fetch page HTML to extract Channel ID
    let targetUrl = clean;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = targetUrl.startsWith('@')
        ? `https://www.youtube.com/${targetUrl}`
        : `https://www.youtube.com/@${targetUrl}`;
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (response.ok) {
        const html = await response.text();

        // 1. Check meta tags
        const metaMatch =
          html.match(/<meta itemprop="channelId" content="([^"]+)"/i) ||
          html.match(/<meta itemprop="identifier" content="([^"]+)"/i);
        if (metaMatch && metaMatch[1]) {
          channelIdCache.set(clean, metaMatch[1]);
          return metaMatch[1];
        }

        // 2. Check JSON data blocks
        const jsonMatch =
          html.match(/channelId":"(UC[a-zA-Z0-9_-]{22})"/i) ||
          html.match(/externalId":"(UC[a-zA-Z0-9_-]{22})"/i);
        if (jsonMatch && jsonMatch[1]) {
          channelIdCache.set(clean, jsonMatch[1]);
          return jsonMatch[1];
        }

        // 3. Check canonical or feed links in head
        const linkMatch =
          html.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/i) ||
          html.match(/\/feeds\/videos\.xml\?channel_id=(UC[a-zA-Z0-9_-]{22})/i);
        if (linkMatch && linkMatch[1]) {
          channelIdCache.set(clean, linkMatch[1]);
          return linkMatch[1];
        }
      }
    } catch (err: any) {
      console.warn(`[YouTubeAdapter] Error resolving channel ID for ${clean}:`, err.message);
    }

    return null;
  }

  async fetchFeed(source: FeedSource): Promise<FeedItem[]> {
    // 1. If an explicit YOUTUBE_API_KEY exists, try API v3 first
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey && source.channelId) {
      try {
        const apiItems = await this.fetchViaAPI(source, apiKey);
        if (apiItems.length > 0) return apiItems;
      } catch (err: any) {
        console.warn(`[YouTubeAdapter] API failed, falling back to XML RSS:`, err.message);
      }
    }

    // 2. High-speed, zero-quota YouTube XML RSS Ingestion
    return this.fetchViaXMLRSS(source);
  }

  private async fetchViaXMLRSS(source: FeedSource): Promise<FeedItem[]> {
    try {
      // Resolve channel ID if not directly provided
      let channelId = source.channelId;
      if (!channelId) {
        channelId = (await this.resolveChannelId(source.url)) || undefined;
      }

      // Construct feed URL
      let feedUrl = source.url;
      if (channelId) {
        feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      } else if (!feedUrl || !feedUrl.includes('/feeds/videos.xml')) {
        console.warn(`[YouTubeAdapter] Could not determine XML feed URL for ${source.name} (${source.url})`);
        return [];
      }

      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`YouTube RSS returned status: ${response.status}`);
      }

      const xmlText = await response.text();
      const result = this.xmlParser.parse(xmlText);
      const feed = result.feed;

      if (!feed || !feed.entry) {
        return [];
      }

      const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

      return entries.map((entry: any) => {
        const videoId = entry.videoId || entry.id?.replace('yt:video:', '') || '';
        const title = decodeHtmlEntities(entry.title || 'Untitled Video');
        const authorName = decodeHtmlEntities(entry.author?.name || feed.title || source.name);
        const publishedAt = entry.published || new Date().toISOString();

        // Media group elements
        const mediaGroup = entry.group || {};
        const description = mediaGroup.description || '';
        const thumbnail =
          mediaGroup.thumbnail?.['@_url'] ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        // Statistics
        const viewsCount = mediaGroup.community?.statistics?.['@_views'];
        const formattedViews = viewsCount
          ? Number(viewsCount) >= 1000000
            ? `${(Number(viewsCount) / 1000000).toFixed(1)}M`
            : Number(viewsCount) >= 1000
            ? `${(Number(viewsCount) / 1000).toFixed(1)}K`
            : `${viewsCount}`
          : undefined;

        return {
          id: `yt-${videoId}`,
          platform: 'youtube',
          mediaType: 'video',
          title,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          videoId,
          author: {
            name: authorName,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=ef4444&color=fff`,
            channelUrl: entry.author?.uri || `https://www.youtube.com/channel/${channelId || source.channelId}`,
          },
          publishedAt,
          thumbnailUrl: thumbnail,
          summary: description ? `${decodeHtmlEntities(description.slice(0, 200))}...` : undefined,
          content: description,
          metrics: {
            views: formattedViews,
          },
          tags: ['Video', source.category, source.name],
          sourceName: source.name || authorName,
          sourceId: source.id,
          isCustom: source.isCustom,
        };
      });
    } catch (err: any) {
      console.warn(`[YouTubeAdapter] Error fetching XML RSS for ${source.name}:`, err.message);
      return [];
    }
  }

  private async fetchViaAPI(source: FeedSource, apiKey: string): Promise<FeedItem[]> {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${source.channelId}&part=snippet,id&order=date&maxResults=15`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube API returned ${res.status}`);
    const data = await res.json();

    return (data.items || [])
      .filter((item: any) => item.id?.kind === 'youtube#video')
      .map((item: any) => {
        const videoId = item.id.videoId;
        const snippet = item.snippet;
        return {
          id: `yt-${videoId}`,
          platform: 'youtube',
          mediaType: 'video',
          title: decodeHtmlEntities(snippet.title),
          url: `https://www.youtube.com/watch?v=${videoId}`,
          videoId,
          author: {
            name: decodeHtmlEntities(snippet.channelTitle),
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(snippet.channelTitle)}&background=ef4444&color=fff`,
          },
          publishedAt: snippet.publishedAt,
          thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
          summary: decodeHtmlEntities(snippet.description),
          tags: ['Video', source.category],
          sourceName: source.name,
          sourceId: source.id,
          isCustom: source.isCustom,
        };
      });
  }

  async validate(url: string): Promise<{ valid: boolean; title?: string; description?: string; channelId?: string; feedUrl?: string }> {
    try {
      const channelId = await this.resolveChannelId(url);
      if (!channelId) return { valid: false };

      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const res = await fetch(feedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*',
        },
      });

      if (!res.ok) return { valid: false };

      const xml = await res.text();
      const parsed = this.xmlParser.parse(xml);

      if (parsed.feed?.title) {
        const title = decodeHtmlEntities(parsed.feed.title);
        return {
          valid: true,
          title,
          description: `YouTube Channel: ${title}`,
          channelId,
          feedUrl,
        };
      }
      return { valid: false };
    } catch {
      return { valid: false };
    }
  }
}
