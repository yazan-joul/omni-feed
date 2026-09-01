exports.deduplicate = function() {
  const validItems = [
    { id: '1', url: 'http://a.com', title: 'A', publishedAt: '2024' },
    { id: '2', url: 'http://a.com', title: 'A', publishedAt: '2024' }, // dup url
    { id: '3', url: '', title: 'B', publishedAt: '2024' },
    { id: '4', url: '', title: 'B', publishedAt: '2024' }, // dup title+date
    { id: '5', url: '', title: 'C', publishedAt: '2024' },
    { id: '5', url: 'http://c.com', title: 'C2', publishedAt: '2025' }, // dup id
  ];

  const uniqueMap = new Map();
  for (const item of validItems) {
    const dedupKey = item.url || `${item.title}-${item.publishedAt}` || item.id;
    if (!uniqueMap.has(dedupKey)) {
      uniqueMap.set(dedupKey, item);
    }
  }
  return Array.from(uniqueMap.values());
}
