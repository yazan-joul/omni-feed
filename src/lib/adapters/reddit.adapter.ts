import { FeedAdapter } from './types';
import { FeedItem, FeedSource } from '../types';
import { decodeHtmlEntities } from '../utils/decode';

export class RedditAdapter implements FeedAdapter {
  readonly platform = 'reddit';

  /**
   * Normalize a Reddit URL
   */
  private normalizeRedditUrl(rawUrl: string): string {
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('r/')) {
      return `https://www.reddit.com/${trimmed}`;
    }
    if (trimmed.startsWith('u/')) {
      return `https://www.reddit.com/user/${trimmed.slice(2)}`;
    }
    return `https://www.reddit.com/r/${trimmed}`;
  }

  async fetchFeed(source: FeedSource): Promise<FeedItem[]> {
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      console.warn('[RedditAdapter] Missing APIFY_API_TOKEN in environment.');
      return [];
    }

    const targetUrl = this.normalizeRedditUrl(source.url);

    try {
      // Call Apify Reddit Scraper actor synchronously
      const response = await fetch(
        `https://api.apify.com/v2/acts/harshmaur~reddit-scraper/run-sync-get-dataset-items?token=${apiToken}&timeout=45`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startUrls: [{ url: targetUrl }],
            maxPosts: 6,
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
        console.warn(`[RedditAdapter] Expected array from Apify dataset, got:`, typeof data);
        return [];
      }

      // Hard limit to exactly 6 posts
      return data.slice(0, 6).map((post: any, index: number): FeedItem => {
        const rawText = post.body || post.text || post.selftext || '';
        const titleText = post.title || '';
        
        const isVideo = Boolean(post.isVideo || post.mediaType === 'video' || post.videoUrl);
        const thumbnailUrl =
          (post.thumbnail && post.thumbnail.startsWith('http') && !post.thumbnail.includes('default') && !post.thumbnail.includes('self'))
            ? post.thumbnail
            : post.images?.[0]?.url || (Array.isArray(post.images) && typeof post.images[0] === 'string' ? post.images[0] : undefined);

        const postUrl = post.postUrl || (post.permalink ? `https://reddit.com${post.permalink}` : post.url) || targetUrl;
        const authorName = post.authorName || post.author || source.name;

        let publishedAt = new Date().toISOString();
        if (post.createdAt) {
          const parsed = new Date(post.createdAt).toISOString();
          if (!isNaN(new Date(parsed).getTime())) publishedAt = parsed;
        } else if (post.created_utc) {
          publishedAt = new Date(post.created_utc * 1000).toISOString();
        }

        return {
          id: `rd-${source.id}-${post.id || post.parsedId || index}`,
          platform: 'reddit',
          mediaType: isVideo ? 'video' : 'article',
          title: decodeHtmlEntities(titleText),
          url: postUrl,
          author: {
            name: decodeHtmlEntities(authorName),
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=FF4500&color=fff`,
          },
          publishedAt,
          thumbnailUrl,
          summary: rawText ? `${decodeHtmlEntities(rawText.slice(0, 220))}...` : undefined,
          content: decodeHtmlEntities(rawText),
          metrics: {
            likes: post.upVotes ?? post.score ?? 0,
            comments: post.commentsCount ?? post.numComments ?? 0,
          },
          tags: ['Reddit', source.name],
          sourceName: source.name,
          sourceId: source.id,
          isCustom: source.isCustom,
        };
      });
    } catch (err: any) {
      console.warn(`[RedditAdapter] Error fetching ${source.name} (${targetUrl}):`, err.message);
      return [];
    }
  }

  async validate(url: string): Promise<{ valid: boolean; title?: string; description?: string; platform?: string }> {
    const isReddit = /reddit\.com/i.test(url) || url.startsWith('r/');
    if (!isReddit) return { valid: false };

    let title = 'Reddit Stream';
    const subMatch = url.match(/r\/([a-zA-Z0-9_]+)/);
    if (subMatch) {
      title = `r/${subMatch[1]}`;
    }

    return {
      valid: true,
      title: title,
      description: `Reddit stream for ${title}`,
      platform: 'reddit',
    };
  }
}
