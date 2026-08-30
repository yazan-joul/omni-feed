export type ContentPlatform =
  | 'youtube'
  | 'rss'
  | 'substack'
  | 'hackernews'
  | 'reddit'
  | 'brightdata'
  | 'custom';

export type MediaType = 'video' | 'article' | 'podcast' | 'post';

export interface Author {
  name: string;
  avatarUrl?: string;
  channelUrl?: string;
}

export interface EngagementMetrics {
  views?: string | number;
  likes?: string | number;
  comments?: string | number;
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
  isCustom?: boolean;
}

export interface FeedSource {
  id: string;
  name: string;
  category: 'Tech' | 'AI & Science' | 'Startups & Business' | 'Design & Dev' | 'News' | 'Custom';
  platform: ContentPlatform;
  url: string;
  channelId?: string;
  icon?: string;
  enabled: boolean;
  isCustom?: boolean;
  description?: string;
}

export interface FeedFilterState {
  searchQuery: string;
  selectedPlatform: ContentPlatform | 'all';
  selectedCategory: string | 'all';
  selectedMediaType: MediaType | 'all';
  sortBy: 'latest' | 'popular';
}
