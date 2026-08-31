import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Firebase Admin
vi.mock('@/lib/firebase/admin', () => {
  const mockDocs = [
    { id: '1', data: () => ({ sourceId: 'src1', publishedAt: '2026-08-31T10:00:00Z', title: 'Test 1', platform: 'rss' }) },
    { id: '2', data: () => ({ sourceId: 'src2', publishedAt: '2026-08-30T10:00:00Z', title: 'Test 2', platform: 'twitter' }) },
  ];
  return {
    db: {
      collection: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        startAfter: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          empty: false,
          docs: mockDocs,
          forEach: (cb: any) => mockDocs.forEach(cb)
        })
      })
    }
  };
});

// Assuming default sources exist, mock them to ensure activeSourceIds isn't empty
vi.mock('@/lib/config/default-sources', () => ({
  DEFAULT_FEED_SOURCES: [
    { id: 'src1', enabled: true, platform: 'rss' },
    { id: 'src2', enabled: true, platform: 'twitter' }
  ]
}));

describe('Feed API Route', () => {
  let GET: any;

  beforeEach(async () => {
    vi.resetModules();
    const route = await import('./route');
    GET = route.GET;
  });

  it('should return 200 with feed items on initial load', async () => {
    const req = new NextRequest('http://localhost:3000/api/feed');
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    // Since it mocks firestore and loads 2 items
    expect(data.items.length).toBeGreaterThan(0);
  });

  it('should handle cursor pagination correctly', async () => {
    const req = new NextRequest('http://localhost:3000/api/feed?cursor=2026-08-31T10:00:00Z');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);
  });
});
