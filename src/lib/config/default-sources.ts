import { FeedSource } from '../types';

export const DEFAULT_FEED_SOURCES: FeedSource[] = [
  // --- YouTube Channels (Curated) ---
  {
    id: 'yt-fireship',
    name: 'Fireship',
    category: 'Tech',
    platform: 'youtube',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA',
    channelId: 'UCsBjURrPoezykLs9EqgamOA',
    description: 'Code tutorials and tech news in 100 seconds.',
    enabled: true,
  },
  {
    id: 'yt-theo',
    name: 'Theo - t3.gg',
    category: 'Design & Dev',
    platform: 'youtube',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCbRP3c757lWg9M-U7TyEkXA',
    channelId: 'UCbRP3c757lWg9M-U7TyEkXA',
    description: 'Web development, React, Next.js, and tech commentary.',
    enabled: true,
  },

  // --- Podcasts (Curated) ---
  {
    id: 'pod-syntax',
    name: 'Syntax.fm',
    category: 'Design & Dev',
    platform: 'rss',
    url: 'https://feed.syntax.fm/rss',
    description: 'Tasty Treats Podcast for Web Developers.',
    enabled: true,
  },
  {
    id: 'pod-changelog',
    name: 'The Changelog',
    category: 'Tech',
    platform: 'rss',
    url: 'https://changelog.com/podcast/feed',
    description: 'Conversations with leaders and innovators of software development.',
    enabled: true,
  },

  // --- Articles, News & Publications (Curated) ---
  {
    id: 'rss-hackernews',
    name: 'Hacker News',
    category: 'Tech',
    platform: 'hackernews',
    url: 'https://news.ycombinator.com/rss',
    description: 'Top developer and startup stories curated by the community.',
    enabled: true,
  },
  {
    id: 'rss-theverge',
    name: 'The Verge',
    category: 'Tech',
    platform: 'rss',
    url: 'https://www.theverge.com/rss/index.xml',
    description: 'Covering technology, science, and digital culture.',
    enabled: true,
  },
  {
    id: 'rss-github-blog',
    name: 'GitHub Engineering',
    category: 'Design & Dev',
    platform: 'rss',
    url: 'https://github.blog/feed/',
    description: 'Engineering deep dives and architecture from GitHub.',
    enabled: true,
  },

  // --- Social Media & Communities (Bright Data / Scraped) ---
  {
    id: 'social-openai',
    name: 'OpenAI Updates',
    category: 'AI & Science',
    platform: 'brightdata',
    url: 'https://x.com/OpenAI',
    description: 'Official AI research, model releases, and dev updates via Bright Data.',
    enabled: true,
  },
  {
    id: 'social-localllama',
    name: 'r/LocalLLaMA',
    category: 'AI & Science',
    platform: 'reddit',
    url: 'https://reddit.com/r/LocalLLaMA',
    description: 'Open-source LLMs, quantization, local AI benchmarks, and architectures.',
    enabled: true,
  }
];

export const CATEGORIES = [
  'All',
  'Tech',
  'AI & Science',
  'Startups & Business',
  'Design & Dev'
] as const;
