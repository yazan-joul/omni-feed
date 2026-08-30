# 📐 Bright Data Social Media Ingestion Specification

**Persona:** `/architect` & `/analyst`  
**Status:** Approved Feature Specification  
**Date:** 2026-08-30  

---

## 🎯 1. Objective
Establish a reliable, cost-efficient ingestion pipeline for social media streams (X/Twitter, Reddit, LinkedIn) powered by **Bright Data**, normalizing them into OmniFeed's unified `FeedItem` schema with `mediaType: 'post'`.

---

## 🏗️ 2. Architectural Blueprint

```mermaid
graph TD
    Client[Client UI /page.tsx] -->|GET /api/feed| Aggregator[/api/feed/route.ts]
    
    subgraph AggregationEngine [Aggregation & SWR Pipeline]
        Aggregator --> SWRCheck{feedCache Check}
        SWRCheck -->|Hit < 60m TTL| ReturnCached[Return Cached Social Posts]
        SWRCheck -->|Stale > 60m TTL| StaleReturn[Return Stale + Trigger background after]
        SWRCheck -->|Miss| BrightDataAdapter[BrightDataAdapter]
    end

    subgraph BrightDataScraper [Bright Data Ingestion Layer]
        BrightDataAdapter -->|1. Check Credentials| EnvCheck{API Key / Zone Configured?}
        EnvCheck -->|Yes| BDScrape[Bright Data Web Unlocker / Dataset API]
        EnvCheck -->|No / Offline| MockSocial[High-Fidelity Social Mock Fallback]
        BDScrape --> Normalizer[Social Post Normalizer]
        MockSocial --> Normalizer
    end

    Normalizer -->|Normalized FeedItem with mediaType: post| CacheStore[(feedCache 60m TTL)]
    CacheStore --> Aggregator
```

---

## 📝 3. Feature Specifications

### 3.1. Social Media Normalization Contract (`FeedItem`)
* **X (Twitter) Posts:**
  * `platform`: `'brightdata'` or `'twitter'`
  * `mediaType`: `'post'`
  * `author`: Display name, avatar URL, handle (`@username`)
  * `summary`: Tweet text content (with HTML entity unescaping)
  * `metrics`: `{ likes, comments, views, retweets }`
  * `tags`: `['X (Twitter)', source.category]`
* **Reddit Posts:**
  * `platform`: `'reddit'`
  * `mediaType`: `'post'`
  * `metrics`: `{ likes: score, comments: num_comments }`
  * `tags`: `['Reddit', 'r/subreddit', source.category]`

### 3.2. Relaxed Caching & SWR TTL
* Standard RSS/YouTube streams use a **3-minute** TTL.
* Bright Data social media streams use a **60-minute (3600s)** TTL to align with periodic scraping batches, prevent redundant proxy requests, and conserve credits.

### 3.3. Zero-Credential Development Mode
* If `BRIGHTDATA_API_KEY` or `BRIGHTDATA_ZONE` are absent, the adapter automatically generates rich, high-fidelity mock social posts with realistic avatars, timestamps, and engagement counters so developers and offline users have zero friction.

### 3.4. OPML Bulk Import & Export Specification
* **Import (`POST /api/opml`):** Accepts `.opml` or `.xml` file uploads, recursively parses nested outline hierarchies, identifies RSS/Atom/YouTube feeds, categorizes them, and merges them into `localStorage` while skipping duplicates.
* **Export (`GET /api/opml`):** Dynamically generates valid OPML 2.0 XML with categorised feed outlines for backup or migration into other RSS readers.
