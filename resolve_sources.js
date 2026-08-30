const fs = require('fs');
let content = fs.readFileSync('src/lib/hooks/useCustomSources.ts', 'utf-8');
content = content.replace(/<<<<<<< HEAD\n([\s\S]*?)=======\n>>>>>>> origin\/alona\n/, '$1');
fs.writeFileSync('src/lib/hooks/useCustomSources.ts', content);
