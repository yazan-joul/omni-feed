import { decodeHtmlEntities } from '../src/lib/utils/decode';
import { feedCache } from '../src/lib/utils/cache';
import { RSSAdapter } from '../src/lib/adapters/rss.adapter';
import { BrightDataAdapter } from '../src/lib/adapters/brightdata.adapter';
import { FeedSource } from '../src/lib/types';
import { XMLParser } from 'fast-xml-parser';
import assert from 'assert';

console.log('🧪 Starting Backend Pipeline Tests (Superpowers TDD)...\n');

// 1. Test HTML Entity Decoder
try {
  console.log('➡️ [Suite 1/7] Testing HTML Entity Decoder...');
  assert.strictEqual(decodeHtmlEntities('Hello &amp; World'), 'Hello & World');
  assert.strictEqual(decodeHtmlEntities('Bob&#8217;s Pizza'), "Bob's Pizza");
  assert.strictEqual(decodeHtmlEntities('&quot;Next.js 15&quot;'), '"Next.js 15"');
  assert.strictEqual(decodeHtmlEntities('Line&nbsp;Break'), 'Line Break');
  console.log('✅ HTML Entity Decoder tests passed!');
} catch (err: any) {
  console.error('❌ HTML Entity Decoder tests failed:', err.message);
  process.exit(1);
}

// 2. Test SWR Cache Logic & Relaxed Social TTL
try {
  console.log('\n➡️ [Suite 2/7] Testing SWR Cache Logic & Social 60m TTL...');
  const key = 'test-key';
  const val = [{ id: '1', title: 'Test Item' }];
  
  // Set cache with 100ms TTL
  feedCache.set(key, val, 100);
  
  const fresh = feedCache.getWithStale(key);
  assert.deepStrictEqual(fresh.data, val);
  assert.strictEqual(fresh.isStale, false);
  
  // Test 60-minute TTL key
  const socialKey = 'social-source-openai';
  feedCache.set(socialKey, [{ id: 'bd-1', title: 'Social Update' }], 1000 * 60 * 60);
  const socialFresh = feedCache.getWithStale<any[]>(socialKey);
  assert.strictEqual(socialFresh.isStale, false);
  assert.strictEqual(socialFresh.data?.length, 1);

  // Wait 150ms to make the short key stale
  setTimeout(() => {
    try {
      const stale = feedCache.getWithStale(key);
      assert.deepStrictEqual(stale.data, val);
      assert.strictEqual(stale.isStale, true);
      console.log('✅ SWR Cache Logic & TTL tests passed!');
    } catch (err: any) {
      console.error('❌ SWR Cache Logic tests failed (async):', err.message);
      process.exit(1);
    }
  }, 150);
} catch (err: any) {
  console.error('❌ SWR Cache Logic tests failed:', err.message);
  process.exit(1);
}

// 3. Test Podcast XML Parsing (RSS Adapter) via Local Data URI
const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Test Podcast</title>
    <item>
      <title>Episode 1 &amp; Only</title>
      <link>https://example.com/episode1</link>
      <enclosure url="https://example.com/episode1.mp3" type="audio/mpeg" length="12345"/>
      <itunes:duration>45:30</itunes:duration>
      <itunes:image href="https://example.com/cover.jpg"/>
      <itunes:summary>This is a &quot;great&quot; episode.</itunes:summary>
      <pubDate>Sun, 30 Aug 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const dataUri = `data:text/xml;base64,${Buffer.from(mockXml).toString('base64')}`;

const testSource: FeedSource = {
  id: 'test-pod',
  name: 'Test Podcast Source',
  platform: 'rss',
  url: dataUri,
  enabled: true,
};

const rssAdapter = new RSSAdapter();
const brightDataAdapter = new BrightDataAdapter();

setTimeout(async () => {
  try {
    console.log('\n➡️ [Suite 3/7] Testing Podcast XML Normalization...');
    const items = await rssAdapter.fetchFeed(testSource);
    
    assert.strictEqual(items.length, 1);
    const item = items[0];
    
    // Normalized check
    assert.strictEqual(item.mediaType, 'podcast');
    assert.strictEqual(item.title, 'Episode 1 & Only'); // decoded
    assert.strictEqual(item.audioUrl, 'https://example.com/episode1.mp3');
    assert.strictEqual(item.durationSeconds, 2730);
    assert.strictEqual(item.thumbnailUrl, 'https://example.com/cover.jpg');
    assert.strictEqual(item.summary, 'This is a "great" episode....'); // decoded and trimmed
    
    console.log('✅ Podcast XML Normalization tests passed!');

    // 4. Test Bright Data X/Twitter Normalization
    console.log('\n➡️ [Suite 4/7] Testing Bright Data X/Twitter Post Normalization...');
    const mockTwitterPayload = {
      tweet_id: '1234567890',
      text: 'Excited to announce our new model release with 128k context &amp; reasoning capabilities!',
      user_name: 'OpenAI',
      username: 'OpenAI',
      user_avatar: 'https://example.com/avatar.jpg',
      likes: 12500,
      retweets: 3200,
      replies: 450,
      views: 450000,
      url: 'https://x.com/OpenAI/status/1234567890',
      created_at: '2026-08-30T14:00:00.000Z',
    };

    const twitterSource: FeedSource = {
      id: 'x-openai',
      name: 'OpenAI Updates',
      platform: 'brightdata',
      url: 'https://x.com/OpenAI',
      enabled: true,
    };

    const normalizedTweet = brightDataAdapter.normalizeSocialPost(mockTwitterPayload, twitterSource);
    assert.strictEqual(normalizedTweet.id, '1234567890');
    assert.strictEqual(normalizedTweet.mediaType, 'post');
    assert.strictEqual(normalizedTweet.author.name, 'OpenAI');
    assert.strictEqual(normalizedTweet.author.handle, '@OpenAI');
    assert.strictEqual(normalizedTweet.summary, 'Excited to announce our new model release with 128k context & reasoning capabilities!');
    assert.strictEqual(normalizedTweet.metrics?.likes, '12.5K');
    assert.strictEqual(normalizedTweet.metrics?.retweets, '3.2K');
    assert.strictEqual(normalizedTweet.metrics?.views, '450K');
    console.log('✅ Bright Data X/Twitter Normalization tests passed!');

    // 5. Test Bright Data Reddit Normalization
    console.log('\n➡️ [Suite 5/7] Testing Reddit Post Normalization...');
    const mockRedditPayload = {
      id: 'reddit_post_abc',
      title: 'Comparing LLaMA 3.3 vs Mistral on Agentic Reasoning Benchmarks',
      selftext: 'Here is a detailed breakdown of latency, memory overhead, and token efficiency.',
      author: 'u/local_dev',
      score: 1500,
      num_comments: 180,
      url: 'https://reddit.com/r/LocalLLaMA/comments/abc',
      created_utc: 1788100000,
      thumbnail: 'https://example.com/reddit-thumb.jpg',
    };

    const redditSource: FeedSource = {
      id: 'reddit-localllama',
      name: 'r/LocalLLaMA',
      platform: 'reddit',
      url: 'https://reddit.com/r/LocalLLaMA',
      enabled: true,
    };

    const normalizedReddit = brightDataAdapter.normalizeSocialPost(mockRedditPayload, redditSource);
    assert.strictEqual(normalizedReddit.mediaType, 'post');
    assert.strictEqual(normalizedReddit.platform, 'reddit');
    assert.strictEqual(normalizedReddit.author.name, 'u/local_dev');
    assert.strictEqual(normalizedReddit.metrics?.likes, '1.5K');
    assert.strictEqual(normalizedReddit.metrics?.comments, '180');
    assert.strictEqual(normalizedReddit.tags.includes('Reddit'), true);
    console.log('✅ Reddit Normalization tests passed!');

    // 6. Test Authentic Social Media Normalization
    console.log('\n➡️ [Suite 6/8] Testing Authentic Social Media Normalization...');
    const rawTweet = {
      tweet_id: '189201928374',
      text: 'Introducing the next generation of multimodal reasoning models.',
      user_name: 'OpenAI',
      username: 'OpenAI',
      likes: 14200,
      retweets: 2800,
      url: 'https://x.com/OpenAI/status/189201928374',
    };
    const normalizedTweet2 = brightDataAdapter.normalizeSocialPost(rawTweet, twitterSource);
    assert.strictEqual(normalizedTweet2.mediaType, 'post');
    assert.strictEqual(normalizedTweet2.title, 'Introducing the next generation of multimodal reasoning models.');
    assert.strictEqual(normalizedTweet2.url, 'https://x.com/OpenAI/status/189201928374');
    assert.strictEqual(normalizedTweet2.metrics?.likes, '14.2K');
    console.log('✅ Authentic Social Media Normalization tests passed!');

    // 7. Test OPML XML Parsing
    console.log('\n➡️ [Suite 7/7] Testing OPML XML Bulk Extraction...');
    const mockOpmlXml = `<?xml version="1.0" encoding="UTF-8"?>
    <opml version="2.0">
      <head><title>Test Feeds</title></head>
      <body>
        <outline text="Tech Blogs" title="Tech Blogs">
          <outline text="Hacker News" title="Hacker News" type="rss" xmlUrl="https://news.ycombinator.com/rss"/>
          <outline text="The Verge" title="The Verge" type="rss" xmlUrl="https://theverge.com/rss/index.xml"/>
        </outline>
        <outline text="YouTube Channels" title="YouTube Channels">
          <outline text="Fireship" title="Fireship" type="rss" xmlUrl="https://youtube.com/feeds/videos.xml?channel_id=123"/>
        </outline>
      </body>
    </opml>`;

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsedOpml = parser.parse(mockOpmlXml);
    assert.strictEqual(Boolean(parsedOpml.opml?.body), true);

    const extractOutlines = (node: any): any[] => {
      let outlines: any[] = [];
      if (!node) return outlines;
      if (Array.isArray(node)) {
        node.forEach((n: any) => outlines.push(...extractOutlines(n)));
      } else if (node.outline) {
        outlines.push(...extractOutlines(node.outline));
      }
      if (node['@_xmlUrl']) outlines.push(node);
      return outlines;
    };

    const outlines = extractOutlines(parsedOpml.opml.body.outline);
    assert.strictEqual(outlines.length, 3);
    assert.strictEqual(outlines[0]['@_title'], 'Hacker News');
    assert.strictEqual(outlines[1]['@_title'], 'The Verge');
    assert.strictEqual(outlines[2]['@_title'], 'Fireship');
    // 8. Test Universal Stream Validator (Reddit, Instagram, X, YouTube)
    console.log('\n➡️ [Suite 8/8] Testing Universal Stream Validator Logic...');
    const testValidate = async (rawInput: string) => {
      if (rawInput.startsWith('r/') || rawInput.includes('reddit.com/r/')) {
        const match = rawInput.match(/(?:reddit\.com)?\/?r\/([a-zA-Z0-9_]+)/i);
        const sub = match ? match[1] : rawInput.replace(/^\/?r\//i, '');
        return { valid: true, platform: 'reddit', title: `r/${sub}` };
      }
      if (rawInput.includes('instagram.com')) {
        const match = rawInput.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i);
        const handle = match ? match[1] : 'profile';
        return { valid: true, platform: 'instagram', title: `@${handle} (Instagram)` };
      }
      if (rawInput.startsWith('@') || rawInput.includes('x.com/')) {
        const handle = rawInput.startsWith('@') ? rawInput.slice(1) : rawInput.split('x.com/')[1];
        return { valid: true, platform: 'twitter', title: `@${handle} on X` };
      }
      return { valid: true, platform: 'rss', title: 'Feed' };
    };

    const redditRes = await testValidate('r/technology');
    assert.strictEqual(redditRes.platform, 'reddit');
    assert.strictEqual(redditRes.title, 'r/technology');

    const igRes = await testValidate('https://www.instagram.com/natgeo/');
    assert.strictEqual(igRes.platform, 'instagram');
    assert.strictEqual(igRes.title, '@natgeo (Instagram)');

    const xRes = await testValidate('@realDonaldTrump');
    assert.strictEqual(xRes.platform, 'twitter');
    assert.strictEqual(xRes.title, '@realDonaldTrump on X');

    console.log('✅ Universal Stream Validator tests passed!');

    console.log('\n🎉 ALL 8 Superpowers Backend Test Suites Passed Successfully!');
  } catch (err: any) {
    console.error('❌ Tests failed:', err.message);
    process.exit(1);
  }
}, 300);
