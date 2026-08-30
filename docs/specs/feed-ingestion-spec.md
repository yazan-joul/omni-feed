# 📐 Backend Feed Ingestion Specification

**Persona:** `/architect` & `/analyst`  
**Status:** Retroactive Design Document  
**Date:** 2026-08-30  

---

## 🎯 1. Objective
Establish a high-performance, fault-tolerant aggregation pipeline for OmniFeed that fetches live data from YouTube feeds, podcasts, and articles/blogs, normalizes them into a single chronological feed, and provides robust SWR (Stale-While-Revalidate) caching, timeouts, and validation.

---

## 🏗️ 2. Architectural Blueprint

```mermaid
graph TD
    Client[Client UI /page.tsx] -->|GET /api/feed| Aggregator[/api/feed/route.ts]
    
    subgraph Pipeline [Aggregation & Caching Engine]
        Aggregator -->|Concurrent Map| Fetcher[Fetcher Core]
        Fetcher -->|1. Cache Hit?| Cache[(SimpleTTLCache)]
        Fetcher -->|2. Stale SWR?| Cache
        Fetcher -->|3. Cache Miss / Fetch| Adapters[Adapters Layer]
    end

    subgraph External [Raw Feeds]
        Adapters -->|Timeout Guard 3.5s| YouTube[YouTube XML RSS]
        Adapters -->|Timeout Guard 3.5s| Podcasts[Podcast RSS]
        Adapters -->|Timeout Guard 3.5s| Blogs[Generic RSS/Atom]
    end
    
    Cache -.->|Background Revalidate via after()| Adapters
```

---

## 📝 3. Feature Specifications

### 3.1. Live Multi-Source Ingestion Pipeline (`/api/feed`)
*   **Requirements:**
    *   Ingest feeds concurrently across active default and custom streams.
    *   Enforce a strict timeout of `3500ms` per source stream to avoid stalling the aggregator.
    *   Gracefully degrade on individual source failures (return empty list for that source, do not crash the request).
*   **Normalized Interface (`FeedItem`):**
    ```typescript
    export interface FeedItem {
      id: string;
      platform: ContentPlatform; // youtube | rss | substack | hackernews | reddit | etc.
      mediaType: 'video' | 'article' | 'podcast' | 'post';
      title: string;
      url: string;
      audioUrl?: string; // Podcast direct mp3 link
      duration?: string; // Podcast duration
      author: {
        name: string;
        avatarUrl?: string;
      };
      publishedAt: string;
      thumbnailUrl?: string;
      summary?: string;
      content?: string;
      metrics?: {
        views?: string | number;
        readTime?: string;
      };
      tags: string[];
      sourceName: string;
      sourceId: string;
    }
    ```

### 3.2. Formats & Normalization
*   **YouTube XML Adapter:**
    *   Extract `videoId`, channel name, video title, description.
    *   Generate high-res thumbnails: `https://i.ytimg.com/vi/{videoId}/hqdefault.jpg`.
*   **Podcast RSS Adapter:**
    *   Identify enclosures matching `audio/*` type or `.mp3` extension.
    *   Extract `audioUrl`, `itunes:duration` (duration), and `itunes:image` (cover artwork).
    *   Map `mediaType` to `'podcast'`.
*   **Articles/Blogs RSS Adapter:**
    *   Scrape CDATA/HTML descriptions, remove HTML tags, extract first 240 chars as `summary`.
    *   Decode HTML entities (e.g. `&amp;` -> `&`) from title, summary, and author name.

### 3.3. SWR Caching & Next.js Revalidation
*   **Next.js Cache TTL:** Export `revalidate = 300` in `/api/feed/route.ts`.
*   **Per-Source Stale-While-Revalidate (SWR):**
    *   If cache hit is fresh: Serve cache.
    *   If cache hit is stale: Return cached data instantly to client, trigger background revalidation using Next.js 15 `after()` utility to refresh and update cache.
    *   If cache miss: Fetch blockingly with `3.5s` Timeout Guard.

### 3.4. Universal Auto-Discovery & Validation (`/api/validate-feed`)
*   **YouTube Handle Resolver:** Scrape `youtube.com/@handle` pages for `<meta itemprop="channelId">` to resolve handles to standard RSS feeds.
*   **Generic HTML Auto-Discovery:** Scan general website HTML for `<link rel="alternate" type="application/rss+xml|atom+xml">` tags.
*   **Validation Response:** Returns dynamic JSON details with `success: true`, `platform`, `title`, `description`, `url`.

---

## 🧪 4. Verification & Testing Strategy
*   **Superpowers TDD Flow:**
    *   Write standalone test cases verifying normalization, timeout, and decoder utilities.
    *   Validate the adapters mock pipeline using mock XML feeds.
