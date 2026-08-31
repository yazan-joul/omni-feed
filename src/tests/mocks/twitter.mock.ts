export const mockTwitterApiResponse = [
  {
    postText: "Just launched a new feature! 🚀",
    author: {
      name: "Dev User",
      screenName: "devuser",
      profileImageUrl: "https://example.com/avatar.jpg"
    },
    postId: "1234567890",
    timestamp: 1693526400000,
    media: [
      {
        type: "photo",
        mediaUrlHttps: "https://example.com/image.jpg"
      }
    ]
  },
  {
    full_text: "Here is a really long tweet that goes beyond the 110 characters limit to test the truncation logic in our adapter.",
    author: {
      name: "Long Poster",
      userName: "longposter"
    },
    conversationId: "0987654321",
    created_at: "2026-08-31T12:00:00Z"
  }
];
