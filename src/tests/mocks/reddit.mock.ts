export const mockRedditApiResponse = {
  data: {
    children: [
      {
        data: {
          id: "rd123",
          title: "Test Reddit Post",
          selftext: "Test content",
          thumbnail: "https://example.com/reddit-img.jpg",
          post_hint: "image",
          author: "reddituser",
          created_utc: 1693526400,
          permalink: "/r/test/comments/rd123/test_post/",
          ups: 420,
          num_comments: 69
        }
      }
    ]
  }
};
