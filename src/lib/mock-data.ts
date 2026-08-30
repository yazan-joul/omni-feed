import { FeedItem } from './types';

export const FALLBACK_FEED_ITEMS: FeedItem[] = [
  {
    id: 'mock-yt-1',
    platform: 'youtube',
    mediaType: 'video',
    title: 'The Future of AI Agentic Workflows in 2026',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    summary: 'A deep dive into multi-agent systems, autonomous coding loops, and how modern developer environments are evolving beyond traditional vibe coding.',
    content: 'Full video walkthrough exploring the state of LLM architectures, context management, test-driven development integration, and autonomous software development lifecycle tools.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    author: {
      name: 'Fireship',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      channelUrl: 'https://www.youtube.com/@Fireship'
    },
    metrics: {
      views: '142K',
      likes: '12.4K',
      comments: '840'
    },
    tags: ['AI', 'Tech', 'Agents', 'JavaScript'],
    sourceName: 'Fireship',
    sourceId: 'yt-fireship'
  },
  {
    id: 'mock-rss-1',
    platform: 'rss',
    mediaType: 'article',
    title: 'Show HN: Building High-Performance Spec-Driven Agents for Rapid Hackathons',
    url: 'https://news.ycombinator.com',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    summary: 'We built a unified content aggregation engine that bridges YouTube Data feeds and universal RSS parsers with zero quota dependency.',
    content: `<h3>Why Spec-Driven Development Matters in Hackathons</h3>
<p>When you have 24-48 hours to ship a fullstack product, the biggest failure mode isn't lack of coding speed—it's architectural drift and context rot. By breaking tasks into structured personas (BMAD) and enforcing test-driven execution (Superpowers), teams ship production-grade products with zero dead code.</p>
<p>Key innovations highlighted in this release include:</p>
<ul>
  <li>Hybrid RSS & REST ingestion pipeline for zero-quota video fetching</li>
  <li>Client-side responsive reader mode with distraction-free layout</li>
  <li>Dynamic custom feed validation and real-time streaming parser</li>
</ul>`,
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
    author: {
      name: 'OmniTeam',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    },
    metrics: {
      views: '3.2K',
      comments: '184',
      readTime: '4 min read'
    },
    tags: ['Show HN', 'Tech', 'Hackathon', 'WebDev'],
    sourceName: 'Hacker News',
    sourceId: 'rss-hackernews'
  },
  {
    id: 'mock-yt-2',
    platform: 'youtube',
    mediaType: 'video',
    title: 'Breakthrough: Real-time Multi-Modal Neural Synthesis Explained',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    summary: 'Two Minute Papers covers the newest neural rendering paper that achieves 120 FPS photorealistic 3D generation on consumer hardware.',
    content: 'Fellow scholars, this is Two Minute Papers with Károly Zsolnai-Fehér. Today we look at an astonishing milestone in real-time neural synthesis.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    author: {
      name: 'Two Minute Papers',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      channelUrl: 'https://www.youtube.com/@TwoMinutePapers'
    },
    metrics: {
      views: '88K',
      likes: '7.8K',
      comments: '412'
    },
    tags: ['AI & Science', 'Research', 'Graphics'],
    sourceName: 'Two Minute Papers',
    sourceId: 'yt-two-minute-papers'
  },
  {
    id: 'mock-rss-2',
    platform: 'rss',
    mediaType: 'article',
    title: 'The Next Generation of Web Architecture: Fullstack React & Edge Caching',
    url: 'https://techcrunch.com',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    summary: 'How modern web applications leverage server components, intelligent stale-while-revalidate caching, and micro-frontends to deliver sub-50ms loads.',
    content: `<p>Modern software engineering has reached an inflection point where fullstack frameworks like Next.js 15 handle both high-frequency API ingestion and ultra-crisp responsive client rendering with ease.</p><p>By structuring ingestion pipelines with modular adapter patterns, applications achieve unparalleled resilience.</p>`,
    publishedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    author: {
      name: 'TechCrunch Newsdesk',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    },
    metrics: {
      views: '45K',
      readTime: '6 min read'
    },
    tags: ['Startups & Business', 'Engineering', 'Architecture'],
    sourceName: 'TechCrunch',
    sourceId: 'rss-techcrunch'
  },
  {
    id: 'mock-rss-3',
    platform: 'rss',
    mediaType: 'article',
    title: 'Mastering Modern CSS: Container Queries, Subgrid, and Glassmorphic UIs',
    url: 'https://www.smashingmagazine.com',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    summary: 'A complete practical guide to building responsive, accessible, and breathtaking interfaces with pure modern CSS and Tailwind.',
    content: `<p>CSS has evolved faster in the last two years than in the prior decade. From container queries to native color-mix() and backdrop-filter glass effects, design systems can now be crafted with incredible elegance.</p>`,
    publishedAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    author: {
      name: 'Smashing Mag Team',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80'
    },
    metrics: {
      views: '19K',
      readTime: '8 min read'
    },
    tags: ['Design & Dev', 'CSS', 'UI/UX'],
    sourceName: 'Smashing Magazine',
    sourceId: 'rss-smashingmag'
  },
  {
    id: 'mock-yt-3',
    platform: 'youtube',
    mediaType: 'video',
    title: 'Lex Fridman Podcast #420 – Deep Learning, Physics, and the Universe',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    summary: 'A 3-hour journey into the fundamental laws of physics, artificial intelligence scaling laws, and humanity’s multi-planetary future.',
    content: 'Full episode discussion spanning quantum computing, neural networks, consciousness, and the frontiers of technological innovation.',
    publishedAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    author: {
      name: 'Lex Fridman',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      channelUrl: 'https://www.youtube.com/@lexfridman'
    },
    metrics: {
      views: '520K',
      likes: '34K',
      comments: '2.1K'
    },
    tags: ['AI & Science', 'Podcast', 'Physics'],
    sourceName: 'Lex Fridman',
    sourceId: 'yt-lex-fridman'
  }
];
