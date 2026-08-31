import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TwitterAdapter } from './twitter.adapter';
import { mockTwitterApiResponse } from '../../tests/mocks/twitter.mock';

describe('TwitterAdapter', () => {
  let adapter: TwitterAdapter;

  beforeEach(() => {
    adapter = new TwitterAdapter();
    global.fetch = vi.fn();
    process.env.APIFY_API_TOKEN = 'test-token';
  });

  const mockSource = {
    id: 'tw1',
    name: '@devuser',
    url: 'https://x.com/devuser',
    platform: 'twitter',
    enabled: true,
  };

  it('should parse Twitter Apify response correctly', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockTwitterApiResponse,
    });

    const items = await adapter.fetchFeed(mockSource);
    expect(items).toHaveLength(2);
    
    // Check first item
    expect(items[0].title).toBe('Just launched a new feature! 🚀');
    expect(items[0].author.name).toBe('Dev User');
    expect(items[0].thumbnailUrl).toBe('https://example.com/image.jpg');
    
    // Check second item (truncation logic)
    expect(items[1].title.length).toBeLessThanOrEqual(115);
    expect(items[1].title).toContain('...');
  });

  it('should return empty array if API token is missing', async () => {
    delete process.env.APIFY_API_TOKEN;
    const items = await adapter.fetchFeed(mockSource);
    expect(items).toEqual([]);
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      text: async () => 'Rate limit exceeded',
      status: 429
    });

    const items = await adapter.fetchFeed(mockSource);
    expect(items).toEqual([]);
  });
});
