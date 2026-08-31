# OmniFeed Features Specification

## 1. Stream Addition Flow & Validation Logic
Adding a new feed stream goes through a unified modal (`AddFeedModal.tsx`) and is validated dynamically:
- **Client-Side Parsing**: Evaluates URL/Handle and deduces the target platform.
- **Server Validation (`/api/validate-feed`)**: Verifies reachability, format validity, and extracts essential metadata (e.g., title, description, channel ID) before allowing insertion into the user's custom sources.
- **Platform-Specific Validation**: Each adapter implements a `validate(url: string)` method to parse URLs, handles, or subreddits, confirming correct routing and parameters.

## 2. Ingestion & Single-Source Sync
- Background cron ingestion continuously fetches data across all feeds.
- **Single-Source Sync**: The ingest API (`/api/cron/ingest?sourceId=...`) supports querying and updating a single specific source, allowing real-time or user-triggered refreshes of a newly added feed without waiting for the global cron sweep.

## 3. OPML Export/Import
- Built-in support for importing and exporting feed configurations via the standard OPML (Outline Processor Markup Language) format.
- Handled via the `/api/opml` route, allowing users to migrate their existing RSS setups seamlessly into OmniFeed, or backup their OmniFeed custom configurations.

## 4. UI View Modes
The application supports multiple unified feed views:
- **Grid View**: A dense layout optimized for imagery and video thumbnails, showing cards (`FeedCard`) aligned side-by-side.
- **List View**: A classic, linear RSS reader-style view, prioritizing text content, summary reading, and chronological scrolling.
- Real-time switching between these modes without loss of scroll position, thanks to localized client state.
