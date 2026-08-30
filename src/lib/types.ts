export type ContentPlatform =
  | 'youtube'
  | 'rss'
  | 'substack'
  | 'reddit'
  | 'twitter'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'custom';

export type MediaType = 'video' | 'article' | 'podcast' | 'post';

export interface Author {
  name: string;
  avatarUrl?: string;
  channelUrl?: string;
  handle?: string;
}

export interface EngagementMetrics {
  views?: string | number;
  likes?: string | number;
  comments?: string | number;
  retweets?: string | number;
  shares?: string | number;
  readTime?: string;
}

export interface FeedItem {
  id: string;
  platform: ContentPlatform;
  title: string;
  url: string;
  author: Author;
  publishedAt: string; // ISO string
  thumbnailUrl?: string;
  summary?: string;
  content?: string;
  metrics?: EngagementMetrics;
  tags: string[];
  mediaType: MediaType;
  sourceName: string;
  sourceId: string;
  videoId?: string; // YouTube specific ID for instant embed
  audioUrl?: string; // Podcast enclosure URL when present on RSS feeds
  durationSeconds?: number; // Podcast runtime when present in RSS metadata
  isCustom?: boolean;
}

export interface FeedSource {
  id: string;
  name: string;
  platform: ContentPlatform;
  url: string;
  channelId?: string;
  icon?: string;
  enabled: boolean;
  isCustom?: boolean;
  description?: string;
}

export type TimeRange = '24h' | '3d' | '7d' | 'all';

export interface FeedFilterState {
  searchQuery: string;
  selectedPlatform: ContentPlatform | 'all';
  selectedMediaType: MediaType | 'all';
  timeRange: TimeRange;
  limitPerSource: number; // 0 = unlimited, or 3, 5, 10, 15
  unreadOnly: boolean;
  sortBy: 'latest' | 'popular';
}
