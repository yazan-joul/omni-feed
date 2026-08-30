const fs = require('fs');
let content = fs.readFileSync('src/lib/types.ts', 'utf-8');
content = content.replace(/<<<<<<< HEAD\n  audioUrl\?: string; \/\/ Podcast direct mp3 link\n  duration\?: string; \/\/ Podcast duration\n=======\n([\s\S]*?)>>>>>>> origin\/alona\n/, '$1');
fs.writeFileSync('src/lib/types.ts', content);
