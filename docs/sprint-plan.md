# ⚡ 4-Hour Lean Sprint Plan & Team Roles: OmniFeed

## 🎯 Product Mission
**OmniFeed** is a unified content aggregator that merges **YouTube videos, Tech blogs, RSS feeds, Substacks, and Podcasts** into a single, high-performance, distraction-free dashboard.

---

## 👥 Team Roles & Responsibilities

### 👤 Member 1: Frontend & UX Lead ("The Face")
- **Main Responsibilities:**
  - Build & refine the responsive feed grid (`src/components/FeedGrid.tsx`, `src/components/FeedCard.tsx`).
  - Polish the **YouTube Embedded Video Player Modal** (`src/components/VideoPlayerModal.tsx`).
  - Polish the **Distraction-Free Article Reader Drawer** (`src/components/ReaderDrawer.tsx`).
  - Refine Search, Category Pills, and View Switcher (`src/components/FilterBar.tsx`).
  - Add the **Sticky Bottom Audio Player** for podcasts (`src/components/BottomAudioPlayer.tsx`).

### 👤 Member 2: Ingestion & API Lead ("The Engine")
- **Main Responsibilities:**
  - Maintain the main feed aggregation endpoint (`src/app/api/feed/route.ts`).
  - Manage the **Zero-Quota YouTube XML Parser** (`src/lib/adapters/youtube.adapter.ts`).
  - Manage the **Universal RSS/Atom/Podcast Parser** (`src/lib/adapters/rss.adapter.ts`).
  - Curate & verify default channels and RSS feeds (`src/lib/config/default-sources.ts`).
  - Ensure fallback cache (`src/lib/mock-data.ts`) guarantees **zero demo crashes** during judging.

### 👤 Member 3: Features, Deployment & Pitch Lead ("The Closer")
- **Main Responsibilities:**
  - Build & test the **"Add Custom Feed"** validator modal (`src/components/AddFeedModal.tsx`, `src/app/api/validate-feed/route.ts`).
  - Manage **Bookmarks & Reading History** in LocalStorage (`src/lib/hooks/useBookmarks.ts`).
  - Set up 1-Click live deployment to **Railway** or **Vercel**.
  - Prepare the **2-minute judging pitch script** and live demo workflow for Monday.

---

## ⏱️ 4-Hour Timeline

| Time Block | Focus | Goal / Output |
| :--- | :--- | :--- |
| **Hour 1** | **Clone & Setup** | All 3 members clone repo, run `npm install` and `npm run dev`, verify dashboard runs locally. |
| **Hour 2** | **Feature Polish** | Dev 1 polishes player & reader; Dev 2 tests podcast feeds; Dev 3 validates custom stream adder. |
| **Hour 3** | **Integration & Test** | Merge branches into `main`, test live search, video modal, and podcast playback. |
| **Hour 4** | **Deploy & Pitch** | Deploy to Railway/Vercel, test live URL on mobile and desktop, rehearse 2-minute demo. |

---

## 🚀 How to Run Locally

```bash
# 1. Clone repository
git clone https://github.com/yazan-joul/omni-feed.git
cd omni-feed

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
# Open http://localhost:3000
```
