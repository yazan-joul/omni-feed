const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace(
  '          isLoading={isLoading}\n          onRefresh={() => handleSyncFeeds()}',
  '          isLoading={isLoading || isSyncing}\n          onRefresh={() => handleSyncFeeds()}'
);

fs.writeFileSync('src/app/page.tsx', code);
