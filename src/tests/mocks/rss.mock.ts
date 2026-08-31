export const validRSSXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tech News</title>
    <link>https://example.com</link>
    <description>Latest tech news</description>
    <item>
      <title>New AI Model Released</title>
      <link>https://example.com/ai-model</link>
      <guid>https://example.com/ai-model</guid>
      <pubDate>Mon, 31 Aug 2026 12:00:00 GMT</pubDate>
      <description>OpenAI just released a new AI model.</description>
    </item>
  </channel>
</rss>`;

export const identicalLinksXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Podcast</title>
    <link>https://mypodcast.com</link>
    <description>A tech podcast</description>
    <item>
      <title>Episode 10</title>
      <link>https://mypodcast.com</link>
      <guid>ep10-guid</guid>
      <pubDate>Sun, 30 Aug 2026 12:00:00 GMT</pubDate>
      <description>Episode 10</description>
      <enclosure url="https://mypodcast.com/ep10.mp3" type="audio/mpeg" />
    </item>
    <item>
      <title>Episode 9</title>
      <link>https://mypodcast.com</link>
      <guid>ep9-guid</guid>
      <pubDate>Sat, 29 Aug 2026 12:00:00 GMT</pubDate>
      <description>Episode 9</description>
      <enclosure url="https://mypodcast.com/ep9.mp3" type="audio/mpeg" />
    </item>
  </channel>
</rss>`;

export const missingPubDateXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>No Dates Feed</title>
    <link>https://nodates.com</link>
    <description>No dates here</description>
    <item>
      <title>No Date Item</title>
      <link>https://nodates.com/item1</link>
      <guid>nodate-guid</guid>
      <description>This item has no pubdate</description>
    </item>
  </channel>
</rss>`;
