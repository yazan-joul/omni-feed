const validItems = [
  { id: '1', url: 'https://example.com/post/', title: 'My Awesome Post' },
  { id: '2', url: 'http://example.com/post', title: 'My Awesome Post' },
  { id: '3', url: 'https://instagram.com/p/123/', title: 'Post by @OpenAI' },
  { id: '4', url: 'https://instagram.com/p/123', title: 'Post by @OpenAI' },
];

function normalizeUrl(url) {
  if (!url) return '';
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '') // remove protocol
    .replace(/^www\./, '') // remove www
    .replace(/\/$/, '') // remove trailing slash
    .split('?')[0]; // remove query params
}

function getDedupKey(item) {
  const normUrl = normalizeUrl(item.url);
  // For long, meaningful titles (not generic 'Post by @...'), use the title as a strong dedup key
  const normTitle = item.title ? item.title.trim().toLowerCase() : '';
  if (normTitle && normTitle.length > 15 && !normTitle.startsWith('post by @')) {
    return normTitle;
  }
  return normUrl || item.id;
}

const unique = new Map();
for (const item of validItems) {
  const key = getDedupKey(item);
  if (!unique.has(key)) unique.set(key, item);
}
console.log(Array.from(unique.values()));
