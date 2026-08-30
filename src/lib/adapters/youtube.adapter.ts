import { XMLParser } from 'fast-xml-parser';
import { FeedAdapter } from './types';
import { FeedItem, FeedSource } from '../types';

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
      const feedUrl = source.url || `https://www.youtube.com/feeds/videos.xml?channel_id=${source.channelId}`;
      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*',
        },
        next: { revalidate: 300 },
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
        const title = entry.title || 'Untitled Video';
        const authorName = entry.author?.name || source.name;
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
            channelUrl: entry.author?.uri || `https://www.youtube.com/channel/${source.channelId}`,
          },
          publishedAt,
          thumbnailUrl: thumbnail,
          summary: description ? `${description.slice(0, 200)}...` : undefined,
          content: description,
          metrics: {
            views: formattedViews,
          },
          tags: ['Video', source.category, source.name],
          sourceName: source.name,
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
          title: snippet.title,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          videoId,
          author: {
            name: snippet.channelTitle,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(snippet.channelTitle)}&background=ef4444&color=fff`,
          },
          publishedAt: snippet.publishedAt,
          thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
          summary: snippet.description,
          tags: ['Video', source.category],
          sourceName: source.name,
          sourceId: source.id,
        };
      });
  }

  async validate(url: string): Promise<{ valid: boolean; title?: string; description?: string; channelId?: string }> {
    try {
      // Check if URL is a YouTube channel or feed
      let feedUrl = url;
      if (url.includes('youtube.com/channel/')) {
        const match = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
        if (match) {
          feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${match[1]}`;
        }
      }

      const res = await fetch(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) return { valid: false };

      const xml = await res.text();
      const parsed = this.xmlParser.parse(xml);

      if (parsed.feed?.title) {
        return {
          valid: true,
          title: parsed.feed.title,
          description: `YouTube Channel: ${parsed.feed.title}`,
          channelId: parsed.feed.channelId,
        };
      }
      return { valid: false };
    } catch {
      return { valid: false };
    }
  }
}
