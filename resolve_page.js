const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf-8');

// Replace Conflict 1
content = content.replace(
/<<<<<<< HEAD[\s\S]*?const res = await fetch\(`\/api\/feed\?\$\{params\.toString\(\)\}`, \{\n        signal: abortController\.signal\n      \}\);\n      const data = await res\.json\(\);\n=======\n[\s\S]*?>>>>>>> origin\/alona/,
`      // Pass disabled or removed default source IDs
      const activeDefaultIds = sources.filter((s) => !s.isCustom && s.enabled).map((s) => s.id);
      const disabledOrRemovedDefaultIds = DEFAULT_FEED_SOURCES.filter(
        (ds) => !activeDefaultIds.includes(ds.id)
      ).map((ds) => ds.id);

      if (disabledOrRemovedDefaultIds.length > 0) {
        params.set('disabledDefaults', JSON.stringify(disabledOrRemovedDefaultIds));
      }

      // Pass enabled custom sources
      if (customOnly.length > 0) {
        params.set('customSources', JSON.stringify(customOnly.filter((s) => s.enabled)));
      }

      const res = await fetch(\`/api/feed?\${params.toString()}\`, {
        signal: abortController.signal
      });

      if (!res.ok) {
        const text = await res.text();
        const serverMessage = text ? text.slice(0, 160).replace(/\\s+/g, ' ').trim() : 'Unknown error';
        throw new Error(\`Feed request failed (\${res.status}): \${serverMessage}\`);
      }

      const responseText = await res.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from feed API.');
      }

      let data: any;
      const maybeJson = responseText.trim();
      if (maybeJson.startsWith('{') || maybeJson.startsWith('[')) {
        try {
          data = JSON.parse(maybeJson);
        } catch {
          throw new Error('Feed API response was not valid JSON.');
        }
      } else {
        throw new Error(\`Feed API returned non-JSON content: \${maybeJson.slice(0, 80)}\`);
      }`
);

// Replace Conflict 2
content = content.replace(
/<<<<<<< HEAD\n  \/\/ Base raw items for active tab[\s\S]*?  const handleMarkAllVisibleAsRead = \(\) => \{\n    markAllAsRead\(displayedItems\.map\(\(i\) => i\.id\)\);\n  \};\n=======\n  const displayedItems = activeTab === 'feed' \? feedItems : filteredBookmarks;\n  const hasActivePodcastPlayer = Boolean\(activePodcastItem\);\n>>>>>>> origin\/alona/,
`  // Base raw items for active tab
  const rawItems = activeTab === 'feed' ? feedItems : filteredBookmarks;

  // Process items: Time Range Filter -> Unread Only -> Per-Source Capping
  let displayedItems = rawItems;

  // 1. Time Range Filter
  if (timeRange !== 'all') {
    const msMap: Record<TimeRange, number> = {
      '24h': 24 * 3600 * 1000,
      '3d': 3 * 24 * 3600 * 1000,
      '7d': 7 * 24 * 3600 * 1000,
      'all': 0,
    };
    const cutoff = Date.now() - msMap[timeRange];
    displayedItems = displayedItems.filter((item) => {
      const pubTime = new Date(item.publishedAt).getTime();
      return !isNaN(pubTime) && pubTime >= cutoff;
    });
  }

  // 2. Unread Only Filter
  if (unreadOnly) {
    displayedItems = displayedItems.filter((item) => !isRead(item.id));
  }

  // 3. Per-Source Limit
  if (limitPerSource > 0) {
    const counts: Record<string, number> = {};
    displayedItems = displayedItems.filter((item) => {
      counts[item.sourceId] = (counts[item.sourceId] || 0) + 1;
      return counts[item.sourceId] <= limitPerSource;
    });
  }

  const handleMarkAllVisibleAsRead = () => {
    markAllAsRead(displayedItems.map((i) => i.id));
  };
  
  const hasActivePodcastPlayer = Boolean(activePodcastItem);`
);

// Replace Conflict 3
content = content.replace(
/<<<<<<< HEAD\n      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 space-y-5">\n        \{\/\* Minimalist Subheader \*\/}\n        <div className="flex items-center justify-between pb-1 border-b border-white\/5">\n          <div className="flex items-center gap-2\.5">\n            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">\n=======\n      <main className=\{\`flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 sm:py-8 space-y-6 \$\{hasActivePodcastPlayer \? 'pb-36 md:pb-32' : ''\}\`\}>\n        \{\/\* Hero Banner \/ Feed Title \*\/}\n        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white\/5">\n          <div>\n            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2\.5">\n>>>>>>> origin\/alona/,
`      <main className={\`flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 sm:py-8 space-y-6 \${hasActivePodcastPlayer ? 'pb-36 md:pb-32' : ''}\`}>
        {/* Hero Banner / Feed Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">`
);

fs.writeFileSync('src/app/page.tsx', content);
