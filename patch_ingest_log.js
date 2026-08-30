const fs = require('fs');
const file = 'src/app/api/cron/ingest/route.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'let targetSources = [...DEFAULT_FEED_SOURCES, ...customSources].filter(s => s.enabled);',
  'let targetSources = [...DEFAULT_FEED_SOURCES, ...customSources].filter(s => s.enabled);\n    console.log("Target sources:", targetSources.map(s => s.id));'
);

fs.writeFileSync(file, code);
