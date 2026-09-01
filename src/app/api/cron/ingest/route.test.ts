import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock all adapters
vi.mock('@/lib/adapters/rss.adapter', () => ({
  RSSAdapter: class { fetchFeed = vi.fn().mockResolvedValue([{ id: 'mock-rss-1', platform: 'rss', url: 'https://example.com' }]) }
}));
vi.mock('@/lib/adapters/youtube.adapter', () => ({
  YouTubeAdapter: class { fetchFeed = vi.fn().mockResolvedValue([]) }
}));
vi.mock('@/lib/adapters/instagram.adapter', () => ({
  InstagramAdapter: class { fetchFeed = vi.fn().mockResolvedValue([]) }
}));
vi.mock('@/lib/adapters/facebook.adapter', () => ({
  FacebookAdapter: class { fetchFeed = vi.fn().mockResolvedValue([]) }
}));
vi.mock('@/lib/adapters/twitter.adapter', () => ({
  TwitterAdapter: class { fetchFeed = vi.fn().mockResolvedValue([]) }
}));
vi.mock('@/lib/adapters/reddit.adapter', () => ({
  RedditAdapter: class { fetchFeed = vi.fn().mockResolvedValue([]) }
}));

const mockSet = vi.fn();
const mockCommit = vi.fn().mockResolvedValue(true);

vi.mock('@/lib/firebase/admin', () => ({
  db: {
    batch: () => ({
      set: mockSet,
      commit: mockCommit
    }),
    collection: () => ({
      doc: (id: string) => ({ id })
    }),
    getAll: vi.fn().mockResolvedValue([])
  }
}));

vi.mock('@/lib/config/default-sources', () => ({
  DEFAULT_FEED_SOURCES: [
    { id: 'src1', enabled: true, platform: 'rss', url: 'test', name: 'test' }
  ]
}));

describe('Ingest API Route', () => {
  let GET: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const route = await import('./route');
    GET = route.GET;
  });

  it('should successfully ingest items from adapters and batch commit', async () => {
    const req = new NextRequest('http://localhost:3000/api/cron/ingest');
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.ingested).toBeGreaterThan(0);
    
    expect(mockSet).toHaveBeenCalled();
    expect(mockCommit).toHaveBeenCalled();
  });
});
