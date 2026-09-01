import Parser from 'rss-parser';
import { FeedAdapter } from './types';
import { FeedItem, FeedSource } from '../types';
import { decodeHtmlEntities } from '../utils/decode';
import { parseRelativeDate } from '../utils/date';

export class RedditAdapter implements FeedAdapter {
  readonly platform = 'reddit';
  private parser: Parser = new Parser({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    customFields: {
      item: [
        ['media:thumbnail', 'mediaThumbnail'],
        ['media:content', 'mediaContent'],
      ],
    },
  });

  /**
   * Normalize a Reddit URL
   */
  private normalizeRedditUrl(rawUrl: string): string {
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed.replace(/\/+$/, '');
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
    const targetUrl = this.normalizeRedditUrl(source.url);

    // 1. Try Fast Native Reddit RSS (typically 500ms - 1.2s)
    try {
      const rssUrl = `${targetUrl}/.rss`;
      const parsedFeed = await this.parser.parseURL(rssUrl);

      if (parsedFeed.items && parsedFeed.items.length > 0) {
        return parsedFeed.items.slice(0, 15).map((item, index): FeedItem => {
          const rawContent = item.content || (item as any)['content:encoded'] || item.contentSnippet || '';
          
          // Extract thumbnail from HTML content if present, or from media:thumbnail
          let thumbnailUrl: string | undefined = undefined;
          
          if ((item as any).mediaThumbnail?.$?.url) {
            thumbnailUrl = (item as any).mediaThumbnail.$.url;
          } else if ((item as any).mediaContent?.$?.url) {
            thumbnailUrl = (item as any).mediaContent.$.url;
          } else {
            const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch && imgMatch[1] && imgMatch[1].startsWith('http')) {
              thumbnailUrl = imgMatch[1];
            }
          }

          // Clean plain text summary
          const cleanText = rawContent.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
          const authorName = item.author || (item as any).creator || source.name;

          return {
            id: `rd-${source.id}-${item.id || item.guid || item.link || index}`,
            platform: 'reddit',
            mediaType: 'article',
            title: decodeHtmlEntities(item.title?.trim() || 'Reddit Post'),
            url: item.link || targetUrl,
            author: {
              name: decodeHtmlEntities(authorName),
              avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName.replace(/^\/u\//, ''))}&background=FF4500&color=fff`,
            },
            publishedAt: parseRelativeDate(item.isoDate || item.pubDate),
            thumbnailUrl,
            summary: cleanText ? `${decodeHtmlEntities(cleanText.slice(0, 220))}...` : undefined,
            content: decodeHtmlEntities(cleanText || rawContent),
            metrics: {},
            tags: ['Reddit', source.name],
            sourceName: source.name,
            sourceId: source.id,
            isCustom: source.isCustom,
          };
        });
      }
    } catch (rssErr: any) {
      console.warn(`[RedditAdapter] Native RSS fallback to Apify for ${source.name}:`, rssErr.message);
    }

    // 2. Fallback to Apify harshmaur/reddit-scraper
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) return [];

    try {
      const response = await fetch(
        `https://api.apify.com/v2/acts/harshmaur~reddit-scraper/run-sync-get-dataset-items?token=${apiToken}&timeout=25`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startUrls: [{ url: targetUrl }],
            maxPosts: 6,
            maxItems: 6,
          }),
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      if (!Array.isArray(data)) return [];

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
      console.warn(`[RedditAdapter] Error fetching ${source.name}:`, err.message);
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
