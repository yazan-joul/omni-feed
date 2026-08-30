import Parser from 'rss-parser';
import { FeedAdapter } from './types';
import { FeedItem, FeedSource, MediaType } from '../types';
import { decodeHtmlEntities } from '../utils/decode';

export class RSSAdapter implements FeedAdapter {
  readonly platform = 'rss';
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:thumbnail', 'mediaThumbnail'],
          ['media:content', 'mediaContent'],
          ['enclosure', 'enclosure'],
          ['dc:creator', 'creator'],
          ['content:encoded', 'contentEncoded'],
          ['itunes:image', 'itunesImage'],
          ['itunes:duration', 'itunesDuration'],
          ['itunes:summary', 'itunesSummary'],
          ['itunes:author', 'itunesAuthor'],
        ],
      },
    });
  }

  async fetchFeed(source: FeedSource): Promise<FeedItem[]> {
    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OmniFeed/1.0; +https://omnifeed.dev)',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      const parsed = await this.parser.parseString(xmlText);

      return (parsed.items || []).map((item, index) => {
        // --- Detect Podcast ---
        let isPodcast = false;
        let audioUrl: string | undefined = undefined;
        let duration: string | undefined = undefined;

        if (item.enclosure && item.enclosure.url && (item.enclosure.type?.includes('audio') || item.enclosure.url.endsWith('.mp3'))) {
          isPodcast = true;
          audioUrl = item.enclosure.url;
        }

        const itunesDuration = (item as any).itunesDuration;
        if (itunesDuration) {
          duration = itunesDuration;
        }
        
        // --- Extract Best Image ---
        const itunesImage = (item as any).itunesImage?.$?.href || (parsed as any).itunesImage?.$?.href;
        let thumbnailUrl =
          itunesImage ||
          (item as any).mediaThumbnail?.$?.url ||
          (item as any).mediaContent?.$?.url ||
          (!isPodcast ? item.enclosure?.url : undefined);

        // Try extracting first img src from content if no media tag
        if (!thumbnailUrl && (item.content || (item as any).contentEncoded)) {
          const imgMatch = (item.content || (item as any).contentEncoded).match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch && imgMatch[1]) {
            thumbnailUrl = imgMatch[1];
          }
        }

        // Default aesthetic fallback thumbnail based on category if none exists
        if (!thumbnailUrl) {
          const defaultThumbnails: Record<string, string> = {
            'Tech': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
            'AI & Science': 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
            'Startups & Business': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80',
            'Design & Dev': 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
          };
          thumbnailUrl = defaultThumbnails[source.category] || defaultThumbnails['Tech'];
        }

        // --- Clean Summary Text ---
        const rawSummary = (item as any).itunesSummary || item.contentSnippet || item.summary || item.content || '';
        const cleanSummary = rawSummary.replace(/<[^>]*>?/gm, '').slice(0, 240);

        // --- Estimate Reading Time ---
        const wordCount = (item.content || (item as any).contentEncoded || cleanSummary).split(/\s+/).length;
        const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
        
        let mediaType: MediaType = 'article';
        if (isPodcast) mediaType = 'podcast';

        return {
          id: `${source.id}-${item.guid || item.link || index}`,
          platform: source.platform,
          mediaType,
          title: decodeHtmlEntities(item.title?.trim() || 'Untitled Content'),
          url: item.link || source.url,
          audioUrl,
          duration,
          author: {
            name: decodeHtmlEntities((item as any).itunesAuthor || (item as any).creator || item.creator || item.author || parsed.title || source.name),
            avatarUrl: parsed.image?.url || itunesImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(source.name)}&background=8b5cf6&color=fff`,
          },
          publishedAt: item.isoDate || (item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()),
          thumbnailUrl,
          summary: cleanSummary ? `${decodeHtmlEntities(cleanSummary)}...` : undefined,
          content: (item as any).contentEncoded || item.content || cleanSummary,
          metrics: {
            readTime: duration ? undefined : `${readTimeMinutes} min read`,
          },
          tags: [isPodcast ? 'Podcast' : source.category, source.name],
          sourceName: source.name,
          sourceId: source.id,
          isCustom: source.isCustom,
        };
      });
    } catch (err: any) {
      console.warn(`[RSSAdapter] Error fetching ${source.name} (${source.url}):`, err.message);
      return [];
    }
  }

  async validate(url: string): Promise<{ valid: boolean; title?: string; description?: string }> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'OmniFeed-Validator/1.0' },
      });
      if (!response.ok) return { valid: false };

      const xml = await response.text();
      const parsed = await this.parser.parseString(xml);

      return {
        valid: Boolean(parsed.title),
        title: decodeHtmlEntities(parsed.title || ''),
        description: decodeHtmlEntities(parsed.description || ''),
      };
    } catch {
      return { valid: false };
    }
  }
}
