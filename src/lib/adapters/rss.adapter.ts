import Parser from 'rss-parser';
import { decodeHtmlEntities } from '../utils/decode';
import { FeedAdapter } from './types';
import { FeedItem, FeedSource } from '../types';

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
        ],
      },
    });
  }

  private parseDurationSeconds(value: unknown): number | undefined {
    if (value === null || value === undefined) return undefined;

    const str = String(value).trim();
    if (!str) return undefined;

    const asSeconds = Number(str);
    if (Number.isFinite(asSeconds)) {
      return Math.max(0, Math.round(asSeconds));
    }

    const parts = str.split(':').map((segment) => Number(segment));
    if (!parts.length || parts.some((part) => !Number.isFinite(part))) {
      return undefined;
    }

    let totalSeconds = 0;
    for (let i = 0; i < parts.length; i += 1) {
      totalSeconds += parts[parts.length - 1 - i] * 60 ** i;
    }

    return Math.max(0, totalSeconds);
  }

  async fetchFeed(source: FeedSource): Promise<FeedItem[]> {
    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OmniFeed/1.0; +https://omnifeed.dev)',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
        },
        next: { revalidate: 300 }, // 5 min cache
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      const parsed = await this.parser.parseString(xmlText);

      return (parsed.items || []).slice(0, 30).map((item, index) => {
        const enclosure = (item as any).enclosure as Record<string, any> | undefined;
        const enclosureUrl =
          (enclosure && typeof enclosure === 'object' && typeof enclosure.url === 'string' && enclosure.url.trim())
            ? enclosure.url
            : Array.isArray((item as any).enclosure)
              ? ((item as any).enclosure[0]?.url || '')
              : '';

        const itunesImageUrl =
          ((item as any).itunesImage && typeof (item as any).itunesImage === 'object')
            ? ((item as any).itunesImage.$?.href || (item as any).itunesImage.href || (item as any).itunesImage.url || '')
            : '';

        // Extract best image. Enclosure URLs are audio files, not artwork.
        let thumbnailUrl =
          itunesImageUrl ||
          parsed.image?.url ||
          (item as any).mediaThumbnail?.$?.url ||
          (item as any).mediaContent?.$?.url ||
          (item as any).mediaThumbnail?.url ||
          (item as any).mediaContent?.url ||
          (item as any).image?.url ||
          (item as any).image?.$.url ||
          '';

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
          thumbnailUrl = defaultThumbnails['Tech'];
        }

        // Clean summary text
        const rawSummary = item.contentSnippet || item.summary || (item as any).itunesSummary || item.content || '';
        const cleanSummary = rawSummary.replace(/<[^>]*>?/gm, '').slice(0, 240);

        // Estimate reading time for non-podcast items
        const wordCount = (item.content || (item as any).contentEncoded || cleanSummary).split(/\s+/).length;
        const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

        const podcastAudioUrl =
          enclosureUrl && /audio|mpeg|mp3|wav|ogg|aac/i.test(String((enclosure && enclosure.type) || ''))
            ? enclosureUrl
            : undefined;
        const durationSeconds = podcastAudioUrl ? this.parseDurationSeconds((item as any).itunesDuration) : undefined;

        return {
          id: `${source.id}-${item.guid || item.link || index}`,
          platform: source.platform,
          mediaType: podcastAudioUrl ? 'podcast' : 'article',
          title: decodeHtmlEntities(item.title?.trim() || 'Untitled Article'),
          url: item.link || source.url,
          author: {
            name: decodeHtmlEntities((item as any).creator || item.creator || item.author || parsed.title || source.name),
            avatarUrl: parsed.image?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(source.name)}&background=8b5cf6&color=fff`,
          },
          publishedAt: item.isoDate || (item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()),
          thumbnailUrl,
          summary: cleanSummary ? `${decodeHtmlEntities(cleanSummary)}...` : undefined,
          content: (item as any).contentEncoded || item.content || cleanSummary,
          metrics: podcastAudioUrl ? undefined : {
            readTime: `${readTimeMinutes} min read`,
          },
          tags: [ source.name],
          sourceName: source.name,
          sourceId: source.id,
          audioUrl: podcastAudioUrl,
          durationSeconds,
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
        title: parsed.title,
        description: parsed.description,
      };
    } catch {
      return { valid: false };
    }
  }
}
