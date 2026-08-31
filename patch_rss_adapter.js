const fs = require('fs');
let code = fs.readFileSync('src/lib/adapters/rss.adapter.ts', 'utf8');

code = code.replace(
  '.slice(0, 30)',
  '.slice(0, 500)'
);

fs.writeFileSync('src/lib/adapters/rss.adapter.ts', code);
