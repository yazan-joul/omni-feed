const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Find the handleSyncFeeds function and replace it
const oldSyncStart = code.indexOf('// Sync Feeds (Background Ingestion)');
const oldSyncEnd = code.indexOf('};', oldSyncStart) + 2;

if (oldSyncStart !== -1) {
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
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customSources: sources.filter(s => s.isCustom) })
      });
      const data = await res.json();
      
      if (data.success) {
        await fetchFeed();
      } else {
        console.error('Ingestion failed:', data.error);
      }
    } catch (error) {
      console.error('Network error during sync:', error);
    } finally {
      setIsSyncing(false);
    }
  };`;

  code = code.substring(0, oldSyncStart) + newSyncFunc.trim() + code.substring(oldSyncEnd);
  fs.writeFileSync('src/app/page.tsx', code);
}
