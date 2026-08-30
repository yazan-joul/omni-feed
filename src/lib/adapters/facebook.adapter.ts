import { FeedAdapter } from './types';
import { FeedItem, FeedSource } from '../types';
import { decodeHtmlEntities } from '../utils/decode';

export class FacebookAdapter implements FeedAdapter {
  readonly platform = 'facebook';

  /**
   * Normalize an Facebook URL or handle into a direct profile URL
   */
  private normalizeFacebookUrl(rawUrl: string): string {
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    // Assume it's a page handle
    return `https://www.facebook.com/${trimmed}`;
  }

  async fetchFeed(source: FeedSource): Promise<FeedItem[]> {
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      console.warn('[FacebookAdapter] Missing APIFY_API_TOKEN in environment.');
      return [];
    }

    const targetUrl = this.normalizeFacebookUrl(source.url);

    try {
      // Call Apify Facebook Posts Scraper actor synchronously
      const response = await fetch(
        `https://api.apify.com/v2/acts/apify~facebook-posts-scraper/run-sync-get-dataset-items?token=${apiToken}&timeout=45`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startUrls: [{ url: targetUrl }],
            resultsLimit: 6, 
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify request failed (${response.status}): ${errorText.slice(0, 150)}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        console.warn(`[FacebookAdapter] Expected array from Apify dataset, got:`, typeof data);
        return [];
      }

      // Hard limit to exactly 6 posts to avoid over-fetching in UI
      return data.slice(0, 6).map((post: any, index: number): FeedItem => {
        const rawText = post.text || post.message || '';
        const cleanText = rawText.replace(/\n+/g, ' ').trim();
        
        const firstLine = cleanText.split(/[.!?\n]/)[0]?.trim() || '';
        const title = firstLine.length > 5 ? firstLine.slice(0, 95) : `Post by ${post.pageName || source.name}`;

        const isVideo = post.video || post.videoUrl;
        const thumbnailUrl = post.imageUrl || post.thumbnailUrl || (Array.isArray(post.images) && post.images[0]?.url) || undefined;

        const postUrl = post.postUrl || post.url || source.url;
        const authorName = post.pageName || post.user?.name || source.name;

        return {
          id: `fb-${source.id}-${post.postId || post.id || index}`,
          platform: 'facebook',
          mediaType: isVideo ? 'video' : 'article',
          title: decodeHtmlEntities(title),
          url: postUrl,
          author: {
            name: decodeHtmlEntities(authorName),
            avatarUrl: post.user?.profilePic || post.pageProfilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=1877F2&color=fff`,
            handle: post.user?.username ? `@${post.user.username}` : undefined,
          },
          publishedAt: post.time || post.timestamp || new Date().toISOString(),
          thumbnailUrl,
          summary: cleanText ? `${decodeHtmlEntities(cleanText.slice(0, 220))}...` : undefined,
          content: decodeHtmlEntities(rawText),
          metrics: {
            likes: post.likes || post.reactions?.count,
            comments: post.comments || post.commentsCount,
            shares: post.shares || post.sharesCount,
          },
          tags: ['Facebook', source.category, source.name],
          sourceName: source.name,
          sourceId: source.id,
          isCustom: source.isCustom,
        };
      });
    } catch (err: any) {
      console.warn(`[FacebookAdapter] Error fetching ${source.name} (${targetUrl}):`, err.message);
      return [];
    }
  }

  async validate(url: string): Promise<{ valid: boolean; title?: string; description?: string; platform?: string }> {
    const isFacebook = /facebook\.com/i.test(url);
    if (!isFacebook) return { valid: false };

    const username = url.replace(/https?:\/\/(www\.)?facebook\.com\//, '').replace(/\/.*$/, '').trim();
    return {
      valid: Boolean(username),
      title: `${username} on Facebook`,
      description: `Facebook stream for ${username}`,
      platform: 'facebook',
    };
  }
}
