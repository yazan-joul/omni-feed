import { FeedAdapter } from './types';
import { FeedItem, FeedSource } from '../types';
import { decodeHtmlEntities } from '../utils/decode';

export class InstagramAdapter implements FeedAdapter {
  readonly platform = 'instagram';

  /**
   * Normalize an Instagram URL or handle into a direct profile URL
   */
  private normalizeInstagramUrl(rawUrl: string): string {
    const trimmed = rawUrl.trim().replace(/^@/, '');
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      // Ensure trailing slash for profile URL
      return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
    }
    // Assume it's a username handle
    return `https://www.instagram.com/${trimmed}/`;
  }

  async fetchFeed(source: FeedSource): Promise<FeedItem[]> {
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      console.warn('[InstagramAdapter] Missing APIFY_API_TOKEN in environment.');
      return [];
    }

    const targetUrl = this.normalizeInstagramUrl(source.url);

    try {
      // Call Apify Instagram Scraper actor synchronously
      const response = await fetch(
        `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${apiToken}&timeout=45`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            directUrls: [targetUrl],
            resultsType: 'posts',
            resultsLimit: 6, // User requested 6 posts per profile limit
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify request failed (${response.status}): ${errorText.slice(0, 150)}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        console.warn(`[InstagramAdapter] Expected array from Apify dataset, got:`, typeof data);
        return [];
      }

      return data.slice(0, 6).map((post: any, index: number): FeedItem => {
        const rawCaption = post.caption || post.text || '';
        const cleanCaption = rawCaption.replace(/\n+/g, ' ').trim();
        
        // Use first sentence or up to 90 chars as title
        const firstLine = cleanCaption.split(/[.!?\n]/)[0]?.trim() || '';
        const title = firstLine.length > 5 ? firstLine.slice(0, 95) : `Post by @${post.ownerUsername || source.name}`;

        const isVideo = post.type === 'Video' || Boolean(post.videoUrl) || Boolean(post.videoViewCount);
        const thumbnailUrl = post.displayUrl || (Array.isArray(post.images) && post.images[0]) || undefined;

        const postUrl = post.url || (post.shortCode ? `https://www.instagram.com/p/${post.shortCode}/` : source.url);
        const authorName = post.ownerFullName || (post.ownerUsername ? `@${post.ownerUsername}` : source.name);

        return {
          id: `ig-${source.id}-${post.id || post.shortCode || index}`,
          platform: 'instagram',
          mediaType: isVideo ? 'video' : 'article',
          title: decodeHtmlEntities(title),
          url: postUrl,
          author: {
            name: decodeHtmlEntities(authorName),
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=e1306c&color=fff`,
            handle: post.ownerUsername ? `@${post.ownerUsername}` : undefined,
          },
          publishedAt: post.timestamp ? new Date(post.timestamp).toISOString() : new Date().toISOString(),
          thumbnailUrl,
          summary: cleanCaption ? `${decodeHtmlEntities(cleanCaption.slice(0, 220))}...` : undefined,
          content: decodeHtmlEntities(rawCaption),
          metrics: {
            likes: post.likesCount ? Number(post.likesCount).toLocaleString() : undefined,
            comments: post.commentsCount ? Number(post.commentsCount).toLocaleString() : undefined,
            views: post.videoViewCount ? Number(post.videoViewCount).toLocaleString() : undefined,
          },
          tags: ['Instagram', source.category, source.name],
          sourceName: source.name,
          sourceId: source.id,
          isCustom: source.isCustom,
        };
      });
    } catch (err: any) {
      console.warn(`[InstagramAdapter] Error fetching ${source.name} (${targetUrl}):`, err.message);
      return [];
    }
  }

  async validate(url: string): Promise<{ valid: boolean; title?: string; description?: string; platform?: string }> {
    const isInstagram = /instagram\.com/i.test(url) || url.startsWith('@');
    if (!isInstagram) return { valid: false };

    const username = url.replace(/^@/, '').replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '').trim();
    return {
      valid: Boolean(username),
      title: `@${username} on Instagram`,
      description: `Instagram stream for @${username}`,
      platform: 'instagram',
    };
  }
}
