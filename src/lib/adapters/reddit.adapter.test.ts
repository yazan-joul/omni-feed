import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedditAdapter } from './reddit.adapter';
import { mockRedditApiResponse } from '../../tests/mocks/reddit.mock';

// Mock rss-parser to throw an error so it falls back to the fetch API
vi.mock('rss-parser', () => {
  return {
    default: class MockParser {
      parseURL = vi.fn().mockRejectedValue(new Error('Network error'));
      parseString = vi.fn();
    }
  };
});

describe('RedditAdapter', () => {
  let adapter: RedditAdapter;

  beforeEach(() => {
    adapter = new RedditAdapter();
    global.fetch = vi.fn();
    process.env.APIFY_API_TOKEN = 'test-token';
  });

  const mockSource = {
    id: 'rd1',
    name: 'r/test',
    url: 'https://reddit.com/r/test',
    platform: 'reddit',
    enabled: true,
  };

  it('should parse Reddit response correctly after falling back to apify', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockRedditApiResponse.data.children.map((c: any) => c.data),
    });

    const items = await adapter.fetchFeed(mockSource);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Test Reddit Post');
    expect(items[0].thumbnailUrl).toBe('https://example.com/reddit-img.jpg');
    // Using default mapping properties
  });
});
