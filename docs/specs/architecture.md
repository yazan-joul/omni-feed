# OmniFeed Architecture Specification

## 1. Data Pipeline
OmniFeed employs a dual-layer data pipeline to ensure fast reads and robust data retention.

### Memory Cache (Client/Server)
- Quick rendering of initial feeds via client-side caching or lightweight server caching.
- Used heavily for UI responsiveness and standard view modes.

### Firestore Deep Pagination (Database)
- Feed items are stored persistently in Firestore (`feed_items` collection).
- Supports deep pagination across unified feeds utilizing composite indexes.
- Prevents redundant document creation by using deterministic IDs.

## 2. Platform Adapters
OmniFeed integrates with 6 distinct platforms via specialized adapters that implement a common `FeedAdapter` interface:
1. **RSS Adapter**: Parses XML feeds (Atom/RSS).
2. **YouTube Adapter**: Fetches channel feeds or search queries.
3. **Reddit Adapter**: Retrieves subreddit posts and links.
4. **Twitter/X Adapter**: Uses Apify to scrape user timelines.
5. **Instagram Adapter**: Uses Apify for profile picture scraping and posts.
6. **Facebook Adapter**: Uses Apify to extract public page posts.

## 3. Deterministic ID Algorithms
To prevent duplication during cron ingestions, every item generates a stable, deterministic ID based on its origin properties:
- Generates a base64 encoded safe ID from the unique string identifier.
- Replaces unsafe characters (`/`, `+`, `=`) with `_`.
- Format: `[platform]-[sourceId]-[postId/videoId/index]` natively in all adapters (e.g. `yt-${source.id}-${videoId}`), ensuring isolation between multiple channels/streams on the same platform.

## 4. Ingestion Engine & Safeguards
- **Cron Job (`/api/cron/ingest`)**: Regularly fetches updates from all active custom and default sources.
- **Single-Source & Dynamic Sync**: `/api/cron/ingest?sourceId=...` ingests a specific stream and merges it into Firestore. Cache hydration fetches documents using single-field queries and sorts in memory to avoid blocking on Firestore composite indexes.

- **Timeouts**: Generous but hard-capped timeouts (e.g., 60s for social/Apify, 15s for RSS/YouTube).
- **Apify Safeguards**: Hard limits on `resultsLimit` (e.g., max 6 posts) and timeout constraints embedded directly in Apify fetch calls to prevent credit exhaustion.
- **Error Handling**: Graceful fallback per adapter if a single source fails, without crashing the entire batch ingestion. Implements an exponential backoff for retries (`fetchWithRetry`).
