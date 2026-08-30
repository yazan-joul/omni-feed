import { FeedAdapter } from './types';
import { FeedItem, FeedSource } from '../types';
import { decodeHtmlEntities } from '../utils/decode';

export class InstagramAdapter implements FeedAdapter {
  readonly platform = 'instagram';

  /**
   * Extract username handle from Instagram URL or string
   */
  private extractUsername(rawUrl: string): string {
    return rawUrl
      .trim()
      .replace(/^@/, '')
      .replace(/https?:\/\/(www\.)?instagram\.com\//i, '')
      .replace(/\/.*$/, '')
      .trim();
  }

  async fetchFeed(source: FeedSource): Promise<FeedItem[]> {
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      console.warn('[InstagramAdapter] Missing APIFY_API_TOKEN in environment.');
      return [];
    }

    const username = this.extractUsername(source.url);
    if (!username) return [];
    const profileUrl = `https://www.instagram.com/${username}/`;

    try {
      // 1. Try fast Instagram Profile Scraper (usually 8-12 seconds)
      const profileRes = await fetch(
        `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apiToken}&timeout=30`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernames: [username] }),
        }
      );

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (Array.isArray(profileData) && profileData.length > 0 && Array.isArray(profileData[0].latestPosts) && profileData[0].latestPosts.length > 0) {
          const profile = profileData[0];
          const authorName = profile.fullName || `@${username}`;
          const authorAvatar = profile.profilePicUrlHD || profile.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=e1306c&color=fff`;

          return profile.latestPosts.slice(0, 6).map((post: any, index: number): FeedItem => {
            const rawCaption = post.caption || post.text || '';
            const cleanCaption = rawCaption.replace(/\n+/g, ' ').trim();
            const firstLine = cleanCaption.split(/[.!?\n]/)[0]?.trim() || '';
            const title = firstLine.length > 5 ? firstLine.slice(0, 95) : `Post by @${username}`;

            const isVideo = post.type === 'Video' || Boolean(post.videoUrl) || Boolean(post.videoViewCount);
            const thumbnailUrl = post.displayUrl || post.thumbnailUrl || (Array.isArray(post.images) && post.images[0]) || undefined;
            const postUrl = post.url || (post.shortCode ? `https://www.instagram.com/p/${post.shortCode}/` : profileUrl);

            return {
              id: `ig-${source.id}-${post.id || post.shortCode || index}`,
              platform: 'instagram',
              mediaType: isVideo ? 'video' : 'article',
              title: decodeHtmlEntities(title),
              url: postUrl,
              author: {
                name: decodeHtmlEntities(authorName),
                avatarUrl: authorAvatar,
                handle: `@${username}`,
              },
              publishedAt: post.timestamp ? new Date(post.timestamp).toISOString() : new Date().toISOString(),
              thumbnailUrl,
              summary: cleanCaption ? `${decodeHtmlEntities(cleanCaption.slice(0, 220))}...` : undefined,
              content: decodeHtmlEntities(rawCaption),
              metrics: {
                likes: post.likesCount ? Number(post.likesCount).toLocaleString() : post.likesCount,
                comments: post.commentsCount ? Number(post.commentsCount).toLocaleString() : post.commentsCount,
                views: post.videoViewCount ? Number(post.videoViewCount).toLocaleString() : undefined,
              },
              tags: ['Instagram', source.name],
              sourceName: source.name,
              sourceId: source.id,
              isCustom: source.isCustom,
            };
          });
        }
      }

      // 2. Fallback to standard Instagram scraper
      const response = await fetch(
        `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${apiToken}&timeout=45`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            directUrls: [profileUrl],
            resultsType: 'posts',
            resultsLimit: 6,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Apify request failed (${response.status})`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) return [];

      return data.slice(0, 6).map((post: any, index: number): FeedItem => {
        const rawCaption = post.caption || post.text || '';
        const cleanCaption = rawCaption.replace(/\n+/g, ' ').trim();
        const firstLine = cleanCaption.split(/[.!?\n]/)[0]?.trim() || '';
        const title = firstLine.length > 5 ? firstLine.slice(0, 95) : `Post by @${post.ownerUsername || username}`;

        const isVideo = post.type === 'Video' || Boolean(post.videoUrl) || Boolean(post.videoViewCount);
        const thumbnailUrl = post.displayUrl || (Array.isArray(post.images) && post.images[0]) || undefined;
        const postUrl = post.url || (post.shortCode ? `https://www.instagram.com/p/${post.shortCode}/` : profileUrl);
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
            handle: post.ownerUsername ? `@${post.ownerUsername}` : `@${username}`,
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
          tags: ['Instagram', source.name],
          sourceName: source.name,
          sourceId: source.id,
          isCustom: source.isCustom,
        };
      });
    } catch (err: any) {
      console.warn(`[InstagramAdapter] Error fetching ${source.name} (${profileUrl}):`, err.message);
      return [];
    }
  }

  async validate(url: string): Promise<{ valid: boolean; title?: string; description?: string; platform?: string }> {
    const isInstagram = /instagram\.com/i.test(url) || url.startsWith('@');
    if (!isInstagram) return { valid: false };

    const username = this.extractUsername(url);
    return {
      valid: Boolean(username),
      title: `@${username} on Instagram`,
      description: `Instagram stream for @${username}`,
      platform: 'instagram',
    };
  }
}
