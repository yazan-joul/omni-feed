import { FeedItem, FeedSource } from '../types';

export interface FeedAdapter {
  readonly platform: string;
  fetchFeed(source: FeedSource): Promise<FeedItem[]>;
  validate(url: string): Promise<{
    valid: boolean;
    title?: string;
    description?: string;
    platform?: string;
  }>;
}
