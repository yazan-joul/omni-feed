import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Firebase Admin
vi.mock('@/lib/firebase/admin', () => {
  const mockDocs = [
    { id: '1', data: () => ({ sourceId: 'src1', publishedAt: '2026-08-31T10:00:00Z', title: 'Test 1', platform: 'rss' }) },
    { id: '2', data: () => ({ sourceId: 'src2', publishedAt: '2026-08-30T10:00:00Z', title: 'Test 2', platform: 'twitter' }) },
  ];
  const customDocs = [
    { id: '3', data: () => ({ sourceId: 'custom1', publishedAt: '2026-09-01T10:00:00Z', title: 'Test 3', platform: 'youtube' }) },
  ];

  const createMockQuery = (filters: string[] = [], customSourceId?: any) => {
    const filterCustomDocs = (d: any) => {
      const sId = d.data().sourceId;
      if (Array.isArray(customSourceId)) return customSourceId.includes(sId);
      return sId === customSourceId;
    };

    return {
      where: vi.fn().mockImplementation((field, op, val) => {
        return createMockQuery([...filters, 'where'], field === 'sourceId' ? val : customSourceId);
      }),
      orderBy: vi.fn().mockImplementation((...args) => {
        if (filters.includes('where')) {
          throw new Error('FAILED_PRECONDITION: The query requires an index.');
        }
        return createMockQuery([...filters, 'orderBy'], customSourceId);
      }),
      limit: vi.fn().mockImplementation(() => createMockQuery(filters, customSourceId)),
      startAfter: vi.fn().mockImplementation(() => createMockQuery(filters, customSourceId)),
      get: vi.fn().mockResolvedValue({
        empty: false,
        docs: customSourceId ? customDocs.filter(filterCustomDocs) : mockDocs,
        forEach: (cb: any) => {
          const docsToUse = customSourceId ? customDocs.filter(filterCustomDocs) : mockDocs;
          docsToUse.forEach(cb);
        }
      })
    };
  };

  return {
    db: {
      collection: vi.fn().mockReturnValue(createMockQuery())
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

  it('should handle custom sources without composite index failures (Issue 1)', async () => {
    const customSources = [{ id: 'custom1', enabled: true, platform: 'youtube', label: 'Custom YouTube' }];
    const req = new NextRequest(`http://localhost:3000/api/feed?customSources=${encodeURIComponent(JSON.stringify(customSources))}`);
    
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    // Should include items from the custom source
    const hasCustomItem = data.items.some((item: any) => item.sourceId === 'custom1');
    expect(hasCustomItem).toBe(true);
  });
});
