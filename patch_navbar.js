const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

// Find the sync button and remove it
const syncBtnRegex = /\{\/\* Sync Button \*\/\}.*?<\/button>/s;
code = code.replace(syncBtnRegex, '');

fs.writeFileSync('src/components/Navbar.tsx', code);
