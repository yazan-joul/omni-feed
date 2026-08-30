import { FeedAdapter } from './types';
import { FeedItem, FeedSource } from '../types';
import { decodeHtmlEntities } from '../utils/decode';

export class TwitterAdapter implements FeedAdapter {
  readonly platform = 'twitter';

  /**
   * Normalize a Twitter / X URL or handle into a standard profile URL
   */
  private normalizeTwitterUrl(rawUrl: string): string {
    const trimmed = rawUrl.trim().replace(/^@/, '');
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed.replace('twitter.com', 'x.com');
    }
    // Assume it's a username handle
    return `https://x.com/${trimmed}`;
  }

  async fetchFeed(source: FeedSource): Promise<FeedItem[]> {
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      console.warn('[TwitterAdapter] Missing APIFY_API_TOKEN in environment.');
      return [];
    }

    const targetUrl = this.normalizeTwitterUrl(source.url);

    try {
      // Call Apify X Profile Posts Scraper actor synchronously
      const response = await fetch(
        `https://api.apify.com/v2/acts/scraper_one~x-profile-posts-scraper/run-sync-get-dataset-items?token=${apiToken}&timeout=45`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profileUrls: [targetUrl],
            maxPosts: 6,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify request failed (${response.status}): ${errorText.slice(0, 150)}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error(`Invalid data from Apify.`);
      }
      if (data.length === 0) {
        throw new Error(`Twitter/X blocked the scraper (0 posts returned for ${targetUrl}).`);
      }

      return data.slice(0, 6).map((post: any, index: number): FeedItem => {
        const rawText =
          post.postText ||
          post.text ||
          post.fullText ||
          post.full_text ||
          post.tweet_text ||
          post.content ||
          post.description ||
          post.caption ||
          post.tweet?.text ||
          post.tweet?.full_text ||
          post.legacy?.full_text ||
          post.note_tweet?.note_tweet_results?.result?.text ||
          '';
        const cleanText = rawText.replace(/\r\n|\r|\n+/g, ' ').trim();

        // Extract a clean headline: take the first sentence or up to 120 chars on word boundaries
        let title = '';
        if (cleanText) {
          if (cleanText.length <= 110) {
            title = cleanText;
          } else {
            const truncated = cleanText.slice(0, 110);
            const lastSpace = truncated.lastIndexOf(' ');
            title = (lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated) + '...';
          }
        }
        const authorHandle = post.author?.screenName || post.author?.userName || source.name.replace(/^@/, '');
        if (!title) {
          title = `Update from @${authorHandle}`;
        }

        const isVideo = Boolean(
          post.media?.some((m: any) => m.type === 'video' || m.type === 'animated_gif') ||
          post.extendedEntities?.media?.some((m: any) => m.type === 'video')
        );

        const thumbnailUrl =
          post.media?.[0]?.mediaUrlHttps ||
          post.media?.[0]?.url ||
          post.extendedEntities?.media?.[0]?.media_url_https ||
          undefined;

        const postUrl =
          post.postUrl ||
          (post.postId ? `https://x.com/${authorHandle}/status/${post.postId}` : targetUrl);

        const authorName = post.author?.name || source.name;
        const authorAvatar =
          post.author?.profileImageUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=0284c7&color=fff`;

        let publishedAt = new Date().toISOString();
        if (post.timestamp) {
          const t = typeof post.timestamp === 'number' ? post.timestamp : Number(post.timestamp);
          if (!isNaN(t)) publishedAt = new Date(t).toISOString();
          else if (typeof post.timestamp === 'string') publishedAt = new Date(post.timestamp).toISOString();
        } else if (post.createdAt || post.created_at) {
          publishedAt = new Date(post.createdAt || post.created_at).toISOString();
        }

        return {
          id: `tw-${source.id}-${post.postId || post.conversationId || post.id || index}`,
          platform: 'twitter',
          mediaType: isVideo ? 'video' : 'article',
          title: decodeHtmlEntities(title),
          url: postUrl,
          author: {
            name: decodeHtmlEntities(authorName),
            avatarUrl: authorAvatar,
            handle: authorHandle ? `@${authorHandle}` : undefined,
          },
          publishedAt,
          thumbnailUrl,
          summary: cleanText ? `${decodeHtmlEntities(cleanText.slice(0, 220))}...` : undefined,
          content: decodeHtmlEntities(rawText),
          metrics: {
            likes: post.favouriteCount ?? post.likeCount ?? post.favorite_count ?? 0,
            comments: post.replyCount ?? post.commentsCount ?? 0,
            retweets: post.repostCount ?? post.retweetCount ?? 0,
            views: post.viewCount ? Number(post.viewCount).toLocaleString() : undefined,
          },
          tags: ['X (Twitter)', source.name],
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
