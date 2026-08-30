import fs from 'fs';
import path from 'path';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

class PersistentTTLCache {
  private store = new Map<string, CacheEntry<any>>();
  private cacheFilePath: string;
  private isLoaded = false;

  constructor() {
    const cacheDir = path.join(process.cwd(), '.cache');
    this.cacheFilePath = path.join(cacheDir, 'feed-cache.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const raw = fs.readFileSync(this.cacheFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          for (const [key, entry] of Object.entries(parsed)) {
            if (entry && typeof entry === 'object') {
              this.store.set(key, entry as CacheEntry<any>);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Cache] Failed to load cache from disk:', err);
    } finally {
      this.isLoaded = true;
    }
  }

  private saveToDisk(): void {
    try {
      const cacheDir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      const obj: Record<string, CacheEntry<any>> = {};
      for (const [key, entry] of this.store.entries()) {
        obj[key] = entry;
      }
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(obj), 'utf-8');
    } catch (err) {
      console.warn('[Cache] Failed to save cache to disk:', err);
    }
  }

  get<T>(key: string): T | null {
    this.loadFromDisk();
    const entry = this.store.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      this.store.delete(key);
      this.saveToDisk();
      return null;
    }
    return entry.data as T;
  }

  // SWR Support: Returns data even if expired, along with a stale flag
  getWithStale<T>(key: string): { data: T | null; isStale: boolean } {
    this.loadFromDisk();
    const entry = this.store.get(key);
    if (!entry) return { data: null, isStale: true };

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    return { data: entry.data as T, isStale: isExpired };
  }

  set<T>(key: string, data: T, ttlMs = 1000 * 60 * 5): void {
    this.loadFromDisk();
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
    this.saveToDisk();
  }

  clear(): void {
    this.store.clear();
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        fs.unlinkSync(this.cacheFilePath);
      }
    } catch (err) {
      console.warn('[Cache] Failed to delete cache file:', err);
    }
  }
}

export const feedCache = new PersistentTTLCache();

