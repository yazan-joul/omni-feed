# 🌐 OmniFeed — Universal Content Aggregator

> **Built for the Weekend AI Hackathon using Antigravity, BMAD-METHOD & Superpowers.**

![OmniFeed Cover](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

OmniFeed aggregates multimedia streams—**YouTube videos, Substack newsletters, Tech blogs, Hacker News, and custom RSS feeds**—into a single, high-performance, distraction-free dashboard.

---

## ✨ Key Features

- ⚡ **Zero-Quota YouTube & RSS Ingestion:** Custom hybrid XML ingestion pipeline that streams full-resolution video thumbnails and metadata with zero API quota exhaustion.
- 🎬 **Instant Embedded Video Player:** Watch YouTube videos inside a distraction-free modal without leaving the app.
- 📖 **Distraction-Free Article Reader Mode:** Read articles with font size adjustments and clean typography.
- ➕ **Dynamic "Add Feed" Validator:** Paste any RSS link or YouTube channel URL to instantly validate and add it to your personal feed.
- 💾 **Local Bookmarks & Read History:** Save articles and track reading history with client persistence.
- 🛡️ **Offline & Demo-Safe Architecture:** Built-in fallback cache guarantees the app **never crashes during live demo presentations**.

---

## 🛠️ Architecture & Tech Stack

```
┌───────────────────────────────────────────────────────────┐
│                      Next.js 15 App                       │
│        (React 19 + TypeScript + Tailwind CSS)             │
└─────────────────────────────┬─────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
       /api/feed Route              /api/validate-feed
               │                             │
    ┌──────────┴──────────┐                  │
    ▼                     ▼                  ▼
YouTube Adapter      RSS/Atom Adapter   Validator
 (XML RSS + API)    (Parser + Content)
```

- **Framework:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Icons:** Lucide React
- **Ingestion:** `rss-parser` + `fast-xml-parser` + Custom YouTube Channel parser
- **State:** React Hooks + LocalStorage
- **Deployment:** Railway / Vercel / Docker

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/omni-feed.git
cd omni-feed
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm start
```

---

## 👥 Team Workstreams
- **Dev 1 (Frontend & UX Lead):** Responsive Masonry Grid, Video Player Modal, Reader Drawer, Dark Theme.
- **Dev 2 (Backend & Ingestion Engine):** Unified Adapter Pattern, RSS/YouTube XML Stream Parsers, SWR Caching.
- **Dev 3 (Interactivity & Extensibility):** Feed Validator, LocalStorage Bookmarks, Docker/Deployment configuration.

---

## 📜 License
MIT © 2026 OmniFeed Team
