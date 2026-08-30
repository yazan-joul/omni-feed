const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Replace handleSyncFeeds definition
const newSyncFunc = `
  // Sync Feeds (Background Ingestion)
  const handleSyncFeeds = async (platformOverride?: string) => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      let url = '/api/cron/ingest';
      if (platformOverride && platformOverride !== 'all' && platformOverride !== 'All') {
        url += \`?platform=\${platformOverride}\`;
      }
      // Trigger background ingestion layer with custom sources
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customSources: sources.filter(s => s.isCustom) })
      });
      const data = await res.json();
      
      if (data.success) {
        // Refetch local DB to show fresh items
        await fetchFeed();
      } else {
        console.error('Ingestion failed:', data.error);
      }
    } catch (error) {
      console.error('Network error during sync:', error);
    } finally {
      setIsSyncing(false);
    }
  };
`;

code = code.replace(/\/\/\s*Sync Feeds\s*\(Background Ingestion\).*?setIsSyncing\(false\);\n\s*\};\n/s, newSyncFunc);

// Update Navbar to NOT take sync props (since we removed them)
code = code.replace(/onSyncFeeds=\{handleSyncFeeds\}\s*isSyncing=\{isSyncing\}/, '');

// Update FilterBar to use handleSyncFeeds
code = code.replace('onRefresh={fetchFeed}', 'onRefresh={() => handleSyncFeeds()}');
code = code.replace('onRefreshPlatform={handleRefreshPlatform}', 'onRefreshPlatform={(p) => handleSyncFeeds(p)}');

fs.writeFileSync('src/app/page.tsx', code);
