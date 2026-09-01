# BMAD Specification: Google Analytics 4 (GA4) Integration & Event Instrumentation

**Status:** Approved for Implementation  
**Author:** Principal Architect Persona  
**Target:** OmniFeed Web Traffic & User Behavioral Analytics  

---

## 1. Objectives
* Enable real-time visitor tracking, audience demographics, traffic sources (LinkedIn, X, direct referrals), and engagement metrics.
* Provide zero-overhead, asynchronous loading via Next.js native `next/script` (`strategy="afterInteractive"`).
* Track key user lifecycle events (stream additions, stream removals, bookmarks, media playback) without putting any load on backend servers.

---

## 2. Event Taxonomy & Schema

| Event Name | Trigger Location | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `stream_added` | `useCustomSources.addSource()` | `platform`, `stream_id`, `total_streams`, `custom_streams_count` | Logged when a user follows a new feed/stream |
| `stream_removed` | `useCustomSources.removeSource()` | `platform`, `stream_id`, `total_streams`, `custom_streams_count` | Logged when a user deletes/unfollows a stream |
| `streams_imported` | `useCustomSources.importSources()` | `imported_count`, `total_streams` | Logged when bulk OPML/streams are imported |
| `bookmark_added` | `useBookmarks.toggleBookmark()` | `platform`, `item_id`, `content_type` | Logged when an item is saved |
| `bookmark_removed` | `useBookmarks.toggleBookmark()` | `platform`, `item_id` | Logged when an item is unsaved |
| `play_video` | `page.tsx` (`setActiveVideoItem`) | `platform`, `item_id`, `title` | Logged when YouTube/video modal opens |
| `play_podcast` | `page.tsx` (`setActivePodcastItem`)| `platform`, `item_id`, `title` | Logged when audio player starts |
| `open_reader` | `page.tsx` (`setActiveReaderItem`) | `platform`, `item_id`, `title` | Logged when full reader drawer opens |

---

## 3. Server Overhead Analysis
* **Network Overhead on OmniFeed/Railway Server:** **0.0%**. GA4 events are sent asynchronously directly from the client's browser (beacon API) to Google's edge endpoints.
* **Database / Firestore Reads/Writes Impact:** **0 extra writes**. Metrics are computed in memory on client events and sent to Google Analytics.
