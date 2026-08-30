const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

code = code.replace(/onSyncFeeds: \(\) => void;\n\s*isSyncing: boolean;/, '');
code = code.replace(/onSyncFeeds,\n\s*isSyncing,/, '');
code = code.replace(/RefreshCw,/, '');

fs.writeFileSync('src/components/Navbar.tsx', code);
