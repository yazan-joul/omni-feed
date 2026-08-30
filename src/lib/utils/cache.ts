interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

class SimpleTTLCache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  // SWR Support: Returns data even if expired, along with a stale flag
  getWithStale<T>(key: string): { data: T | null; isStale: boolean } {
    const entry = this.store.get(key);
    if (!entry) return { data: null, isStale: true };

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    return { data: entry.data as T, isStale: isExpired };
  }

  set<T>(key: string, data: T, ttlMs = 1000 * 60 * 5): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  clear(): void {
    this.store.clear();
  }
}

export const feedCache = new SimpleTTLCache();
