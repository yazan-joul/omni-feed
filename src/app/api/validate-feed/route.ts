import { NextRequest, NextResponse } from 'next/server';
import { RSSAdapter } from '@/lib/adapters/rss.adapter';
import { YouTubeAdapter } from '@/lib/adapters/youtube.adapter';

export const dynamic = 'force-dynamic';

const rssAdapter = new RSSAdapter();
const ytAdapter = new YouTubeAdapter();

// --- Universal HTML Auto-Discovery Helper ---
async function discoverRssFromHtml(url: string): Promise<{ discoveredUrl: string | null; isYouTube: boolean }> {
  try {
    if (!url.startsWith('http')) return { discoveredUrl: null, isYouTube: false };

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) return { discoveredUrl: null, isYouTube: false };
    const html = await response.text();
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

    // 1. YouTube Channel ID Extraction (e.g. from @Fireship handles)
    if (isYouTube) {
      const ytChannelMatch =
        html.match(/<meta itemprop="channelId" content="([^"]+)"/i) ||
        html.match(/channelId":"([^"]+)"/i);
      if (ytChannelMatch && ytChannelMatch[1]) {
        return {
          discoveredUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${ytChannelMatch[1]}`,
          isYouTube: true,
        };
      }
    }

    // 2. Generic RSS/Atom auto-discovery via <link rel="alternate">
    const linkRegex = /<link[^>]+rel=["']?alternate["']?[^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const tag = match[0];
      if (tag.includes('application/rss+xml') || tag.includes('application/atom+xml')) {
        const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
        if (hrefMatch && hrefMatch[1]) {
          let discovered = hrefMatch[1];
          if (discovered.startsWith('/')) {
            const urlObj = new URL(url);
            discovered = `${urlObj.protocol}//${urlObj.host}${discovered}`;
          }
          return { discoveredUrl: discovered, isYouTube: false };
        }
      }
    }

    return { discoveredUrl: null, isYouTube };
  } catch {
    return { discoveredUrl: null, isYouTube: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let rawInput = (body?.url || '').trim();
    const explicitPlatform = body?.platform;

    if (!rawInput) {
      return NextResponse.json(
        { success: false, error: 'Please enter a URL, Subreddit, @handle, or RSS link.' },
        { status: 400 }
      );
    }

    // --- 0.5 Smart Searches (YouTube / iTunes) ---
    if (!rawInput.includes('.') && !rawInput.startsWith('@') && !rawInput.startsWith('r/') && !rawInput.startsWith('/r/')) {
      // YouTube Search
      if (explicitPlatform === 'youtube') {
        try {
          const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(rawInput)}&sp=EgIQAg%253D%253D`;
          const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            signal: AbortSignal.timeout(4000)
          });
          const html = await res.text();
          const channelMatch = html.match(/channelId":"([^"]+)"/);
          if (channelMatch && channelMatch[1]) {
            rawInput = `https://www.youtube.com/channel/${channelMatch[1]}`;
          }
        } catch (e) {
          // Fall through
        }
      } 
      // Podcast Search
      else if (!explicitPlatform || explicitPlatform === 'rss') {
        try {
          const searchUrl = `https://itunes.apple.com/search?media=podcast&term=${encodeURIComponent(rawInput)}&limit=1`;
          const res = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const podcast = data.results[0];
              if (podcast.feedUrl) {
                return NextResponse.json({
                  success: true,
                  platform: 'rss',
                  title: podcast.collectionName,
                  description: podcast.artistName ? `Podcast by ${podcast.artistName}` : 'Podcast',
                  url: podcast.feedUrl,
                });
              }
            }
          }
        } catch (e) {
          // Fall through
        }
      }
    }

    // --- 1. Handle Reddit ---
    if (explicitPlatform === 'reddit' || rawInput.startsWith('r/') || rawInput.startsWith('/r/') || rawInput.includes('reddit.com/r/')) {
      const match = rawInput.match(/(?:reddit\.com)?\/?r\/([a-zA-Z0-9_]+)/i);
      const sub = match ? match[1] : rawInput.replace(/^\/?r\//i, '').replace(/[^a-zA-Z0-9_]/g, '');
      const normalizedUrl = `https://www.reddit.com/r/${sub}`;

      return NextResponse.json({
        success: true,
        platform: 'reddit',
        title: `r/${sub}`,
        description: `Live discussions & posts from Reddit's r/${sub}`,
        url: normalizedUrl,
      });
    }

    // --- 2. Handle Instagram ---
    if (explicitPlatform === 'instagram' || rawInput.includes('instagram.com') || rawInput.includes('instagr.am')) {
      let handle = rawInput;
      if (rawInput.includes('instagram.com') || rawInput.includes('instagr.am')) {
        const match = rawInput.match(/instagr(?:am\.com|\.am)\/(?:p\/)?([a-zA-Z0-9_.]+)/i);
        handle = match ? match[1] : 'profile';
      } else if (handle.startsWith('@')) {
        handle = handle.slice(1);
      }
      
      const normalizedUrl = `https://www.instagram.com/${handle}/`;

      return NextResponse.json({
        success: true,
        platform: 'instagram',
        title: `@${handle}`,
        description: `Instagram feed for @${handle}`,
        url: normalizedUrl,
      });
    }

    // --- 3. Handle X / Twitter ---
    if (explicitPlatform === 'twitter' || rawInput.startsWith('@') || rawInput.includes('x.com/') || rawInput.includes('twitter.com/')) {
      let handle = rawInput;
      if (rawInput.includes('x.com/') || rawInput.includes('twitter.com/')) {
        const match = rawInput.match(/(?:x|twitter)\.com\/([a-zA-Z0-9_]+)/i);
        handle = match ? match[1] : rawInput;
      } else if (handle.startsWith('@')) {
        handle = handle.slice(1);
      }
      const normalizedUrl = `https://x.com/${handle}`;

      return NextResponse.json({
        success: true,
        platform: 'twitter',
        title: `@${handle}`,
        description: `X timeline for @${handle}`,
        url: normalizedUrl,
      });
    }

    // --- 3.5 Handle Facebook ---
    if (explicitPlatform === 'facebook' || rawInput.includes('facebook.com') || rawInput.includes('fb.me')) {
      let handle = rawInput;
      if (rawInput.includes('facebook.com') || rawInput.includes('fb.me')) {
        const match = rawInput.match(/facebook\.com\/([a-zA-Z0-9_.-]+)/i);
        handle = match ? match[1] : 'page';
      } else if (handle.startsWith('@')) {
        handle = handle.slice(1);
      }
      const normalizedUrl = `https://www.facebook.com/${handle}`;

      return NextResponse.json({
        success: true,
        platform: 'facebook',
        title: `${handle}`,
        description: `Facebook stream for ${handle}`,
        url: normalizedUrl,
      });
    }

    let targetUrl = rawInput;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    // --- 4. Attempt Auto-Discovery (Resolves YouTube handles & hidden RSS links on blogs) ---
    const { discoveredUrl, isYouTube } = await discoverRssFromHtml(targetUrl);
    if (discoveredUrl) {
      targetUrl = discoveredUrl;
    }

    // --- 5. YouTube Validation ---
    if (isYouTube || targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      const ytResult = await ytAdapter.validate(targetUrl);
      if (ytResult.valid) {
        return NextResponse.json({
          success: true,
          platform: 'youtube',
          title: ytResult.title || 'YouTube Channel',
          description: ytResult.description,
          url: ytResult.feedUrl || targetUrl,
          channelId: ytResult.channelId,
        });
      }
    }

    // --- 6. RSS / Atom Validation ---
    const rssResult = await rssAdapter.validate(targetUrl);
    if (rssResult.valid) {
      return NextResponse.json({
        success: true,
        platform: 'rss',
        title: rssResult.title || 'RSS Feed',
        description: rssResult.description || 'Custom RSS/Atom Stream',
        url: targetUrl,
      });
    }

    // --- 7. Generic Web / RSS Fallback ---
    return NextResponse.json(
      { success: false, error: 'Could not find a valid RSS feed, YouTube channel, or supported social profile for this link.' },
      { status: 422 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Validation failed.' },
      { status: 500 }
    );
  }
}
