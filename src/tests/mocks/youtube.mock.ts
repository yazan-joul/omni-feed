export const mockYoutubeApiResponse = {
  items: [
    {
      id: { kind: "youtube#video", videoId: "12345" },
      snippet: {
        title: "Test Video Title",
        description: "Test video description",
        publishedAt: "2026-08-31T10:00:00Z",
        channelTitle: "Test Channel",
        thumbnails: {
          high: { url: "https://example.com/yt-high.jpg" },
          default: { url: "https://example.com/yt-default.jpg" }
        }
      }
    }
  ]
};
