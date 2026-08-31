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

    if (!rawInput) {
      return NextResponse.json(
        { success: false, error: 'Please enter a URL, Subreddit, @handle, or RSS link.' },
        { status: 400 }
      );
    }

    // --- 0.5 iTunes Podcast Search (if input is likely a search query and not a URL) ---
    if (!rawInput.includes('.') && !rawInput.startsWith('@') && !rawInput.startsWith('r/') && !rawInput.startsWith('/r/')) {
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

    // --- 1. Handle Reddit Subreddit formats (r/LocalLLaMA, reddit.com/r/..., or /r/...) ---
    if (rawInput.startsWith('r/') || rawInput.startsWith('/r/') || rawInput.includes('reddit.com/r/')) {
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

    // --- 2. Handle Instagram profiles (instagram.com/..., @handle on IG) ---
    if (rawInput.includes('instagram.com') || rawInput.includes('instagr.am')) {
      const match = rawInput.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i);
      const handle = match ? match[1] : 'profile';
      const normalizedUrl = `https://www.instagram.com/${handle}/`;

      return NextResponse.json({
        success: true,
        platform: 'instagram',
        title: `@${handle} (Instagram)`,
        description: `Instagram social stream for @${handle}`,
        url: normalizedUrl,
      });
    }

    // --- 3. Handle X / Twitter (@username, x.com/..., twitter.com/...) ---
    if (rawInput.startsWith('@') || rawInput.includes('x.com/') || rawInput.includes('twitter.com/')) {
      let handle = '';
      if (rawInput.startsWith('@')) {
        handle = rawInput.slice(1);
      } else {
        const match = rawInput.match(/(?:x|twitter)\.com\/([a-zA-Z0-9_]+)/i);
        handle = match ? match[1] : rawInput;
      }
      const normalizedUrl = `https://x.com/${handle}`;

      return NextResponse.json({
        success: true,
        platform: 'twitter',
        title: `@${handle} on X`,
        description: `Social updates and tweets from @${handle}`,
        url: normalizedUrl,
      });
    }

    // --- 3.5 Handle Facebook (facebook.com/...) ---
    if (rawInput.includes('facebook.com') || rawInput.includes('fb.me')) {
      const match = rawInput.match(/facebook\.com\/([a-zA-Z0-9_.-]+)/i);
      const handle = match ? match[1] : 'page';
      const normalizedUrl = `https://www.facebook.com/${handle}`;

      return NextResponse.json({
        success: true,
        platform: 'facebook',
        title: `${handle} on Facebook`,
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
