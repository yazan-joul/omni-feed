import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YouTubeAdapter } from './youtube.adapter';
import { mockYoutubeApiResponse } from '../../tests/mocks/youtube.mock';

vi.mock('rss-parser', () => {
  return {
    default: class MockParser {
      parseURL = vi.fn().mockResolvedValue({ items: [] });
    }
  };
});

describe('YouTubeAdapter', () => {
  let adapter: YouTubeAdapter;

  beforeEach(() => {
    adapter = new YouTubeAdapter();
    global.fetch = vi.fn();
    process.env.YOUTUBE_API_KEY = 'test-key';
  });

  const mockSource = {
    id: 'yt1',
    name: 'Test Channel',
    url: 'https://youtube.com/channel/UC123',
    platform: 'youtube',
    enabled: true, channelId: 'UC123',
  };

  it('should parse YouTube response correctly', async () => {
    // YouTube adapter makes multiple calls, one might be for page HTML to resolve channel ID
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('googleapis.com')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockYoutubeApiResponse,
          text: async () => JSON.stringify(mockYoutubeApiResponse)
        });
      }
      return Promise.resolve({
        ok: true,
        text: async () => '<meta itemprop="channelId" content="UC123">',
      });
    });

    const items = await adapter.fetchFeed(mockSource);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Test Video Title');
    expect(items[0].mediaType).toBe('video');
    expect(items[0].thumbnailUrl).toBe('https://example.com/yt-high.jpg');
    expect(items[0].url).toBe('https://www.youtube.com/watch?v=12345');
  });

  it('should return empty array on fetch failure', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      text: async () => 'error',
    });
    const items = await adapter.fetchFeed(mockSource);
    expect(items).toEqual([]);
  });
});
