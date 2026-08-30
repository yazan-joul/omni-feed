import { FeedSource } from '../types';

export const DEFAULT_FEED_SOURCES: FeedSource[] = [
  // --- YouTube Channels (Curated) ---
  {
    id: 'yt-fireship',
    name: 'Fireship',
    platform: 'youtube',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA',
    channelId: 'UCsBjURrPoezykLs9EqgamOA',
    description: 'Code tutorials and tech news in 100 seconds.',
    enabled: true,
  },
  {
    id: 'yt-theo',
    name: 'Theo - t3.gg',
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
    platform: 'rss',
    url: 'https://feed.syntax.fm/rss',
    description: 'Tasty Treats Podcast for Web Developers.',
    enabled: true,
  },
  {
    id: 'pod-changelog',
    name: 'The Changelog',
    platform: 'rss',
    url: 'https://changelog.com/podcast/feed',
    description: 'Conversations with leaders and innovators of software development.',
    enabled: true,
  },

  // --- Articles, News & Publications (Curated) ---
  {
    id: 'rss-theverge',
    name: 'The Verge',
    platform: 'rss',
    url: 'https://www.theverge.com/rss/index.xml',
    description: 'Covering technology, science, and digital culture.',
    enabled: true,
  },
  {
    id: 'rss-github-blog',
    name: 'GitHub Engineering',
    platform: 'rss',
    url: 'https://github.blog/feed/',
    description: 'Engineering deep dives and architecture from GitHub.',
    enabled: true,
  },

  // --- Social Media & Communities (Apify) ---
  {
    id: 'social-openai-ig',
    name: 'OpenAI Instagram',
    platform: 'instagram',
    url: 'https://www.instagram.com/openai/',
    description: 'Official OpenAI releases, demos, and updates on Instagram.',
    enabled: true,
  },
  {
    id: 'social-openai',
    name: 'OpenAI on X',
    platform: 'twitter',
    url: 'https://x.com/OpenAI',
    description: 'Official AI research, model releases, and dev updates on X.',
    enabled: true,
  },
  {
    id: 'social-localllama',
    name: 'r/LocalLLaMA',
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
