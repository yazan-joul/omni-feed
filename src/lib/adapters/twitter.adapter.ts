import { FeedAdapter } from './types';
import { FeedItem, FeedSource } from '../types';
import { decodeHtmlEntities } from '../utils/decode';

export class TwitterAdapter implements FeedAdapter {
  readonly platform = 'twitter';

  /**
   * Normalize an Twitter URL or handle into a search query or direct URL
   */
  private normalizeTwitterUrl(rawUrl: string): string {
    const trimmed = rawUrl.trim().replace(/^@/, '');
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    // Assume it's a username handle
    return `https://twitter.com/${trimmed}`;
  }

  async fetchFeed(source: FeedSource): Promise<FeedItem[]> {
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      console.warn('[TwitterAdapter] Missing APIFY_API_TOKEN in environment.');
      return [];
    }

    const targetUrl = this.normalizeTwitterUrl(source.url);

    try {
      // Call Apify Twitter Scraper Lite actor synchronously
      const response = await fetch(
        `https://api.apify.com/v2/acts/apidojo~twitter-scraper-lite/run-sync-get-dataset-items?token=${apiToken}&timeout=45`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            searchTerms: [`from:${targetUrl.replace('https://twitter.com/', '').replace('https://x.com/', '')}`],
            maxItems: 6,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify request failed (${response.status}): ${errorText.slice(0, 150)}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        console.warn(`[TwitterAdapter] Expected array from Apify dataset, got:`, typeof data);
        return [];
      }

      // Hard limit to exactly 6 posts
      return data.slice(0, 6).map((post: any, index: number): FeedItem => {
        const rawText = post.text || post.fullText || '';
        const cleanText = rawText.replace(/\n+/g, ' ').trim();
        
        const firstLine = cleanText.split(/[.!?\n]/)[0]?.trim() || '';
        const title = firstLine.length > 5 ? firstLine.slice(0, 95) : `Tweet by @${post.author?.userName || source.name}`;

        const isVideo = post.extendedEntities?.media?.some((m: any) => m.type === 'video') || post.entities?.media?.some((m: any) => m.type === 'video');
        const thumbnailUrl = post.extendedEntities?.media?.[0]?.media_url_https || post.entities?.media?.[0]?.media_url_https || post.media?.[0]?.url || undefined;

        const postUrl = post.url || `https://twitter.com/${post.author?.userName}/status/${post.id}`;
        const authorName = post.author?.name || source.name;

        return {
          id: `tw-${source.id}-${post.id || index}`,
          platform: 'twitter',
          mediaType: isVideo ? 'video' : 'article',
          title: decodeHtmlEntities(title),
          url: postUrl,
          author: {
            name: decodeHtmlEntities(authorName),
            avatarUrl: post.author?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=1DA1F2&color=fff`,
            handle: post.author?.userName ? `@${post.author.userName}` : undefined,
          },
          publishedAt: post.createdAt || post.created_at || new Date().toISOString(),
          thumbnailUrl,
          summary: cleanText ? `${decodeHtmlEntities(cleanText.slice(0, 220))}...` : undefined,
          content: decodeHtmlEntities(rawText),
          metrics: {
            likes: post.likeCount || post.favorite_count,
            comments: post.replyCount,
            retweets: post.retweetCount,
            views: post.viewCount,
          },
          tags: ['Twitter', 'X',  source.name],
          sourceName: source.name,
          sourceId: source.id,
          isCustom: source.isCustom,
        };
      });
    } catch (err: any) {
      console.warn(`[TwitterAdapter] Error fetching ${source.name} (${targetUrl}):`, err.message);
      return [];
    }
  }

  async validate(url: string): Promise<{ valid: boolean; title?: string; description?: string; platform?: string }> {
    const isTwitter = /twitter\.com|x\.com/i.test(url) || url.startsWith('@');
    if (!isTwitter && !url.startsWith('@')) return { valid: false };

    const username = url.replace(/^@/, '').replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, '').replace(/\/.*$/, '').trim();
    return {
      valid: Boolean(username),
      title: `@${username} on X`,
      description: `X (Twitter) stream for @${username}`,
      platform: 'twitter',
    };
  }
}
