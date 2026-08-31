import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RSSAdapter } from './rss.adapter';
import { validRSSXml, identicalLinksXml, missingPubDateXml } from '../../tests/mocks/rss.mock';

describe('RSSAdapter', () => {
  let adapter: RSSAdapter;

  beforeEach(() => {
    adapter = new RSSAdapter();
    global.fetch = vi.fn();
  });

  const mockSource = {
    id: 'src1',
    name: 'Test Source',
    url: 'https://example.com/rss',
    platform: 'rss',
    enabled: true,
  };

  it('should parse a valid RSS feed correctly', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => validRSSXml,
    });

    const items = await adapter.fetchFeed(mockSource);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('New AI Model Released');
    expect(items[0].url).toBe('https://example.com/ai-model');
    expect(items[0].publishedAt).toBe('2026-08-31T12:00:00.000Z');
  });

  it('should handle identical links across items by relying on GUID for id', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => identicalLinksXml,
    });

    const items = await adapter.fetchFeed(mockSource);
    expect(items).toHaveLength(2);
    expect(items[0].url).toBe('https://mypodcast.com');
    expect(items[1].url).toBe('https://mypodcast.com');
    // Ensure ids are unique despite identical URLs
    expect(items[0].id).not.toBe(items[1].id);
    expect(items[0].id).toContain('ep10-guid');
    expect(items[1].id).toContain('ep9-guid');
  });

  it('should fallback to current date if pubDate is missing', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => missingPubDateXml,
    });

    const items = await adapter.fetchFeed(mockSource);
    expect(items).toHaveLength(1);
    // Should be a valid ISO string date
    expect(new Date(items[0].publishedAt).getTime()).not.toBeNaN();
  });
});
