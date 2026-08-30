const fs = require('fs');
let code = fs.readFileSync('src/lib/adapters/twitter.adapter.ts', 'utf8');

code = code.replace(
  '      if (!Array.isArray(data)) {\n        console.warn(`[TwitterAdapter] Expected array from Apify dataset, got:`, typeof data);\n        return [];\n      }',
  '      if (!Array.isArray(data)) {\n        throw new Error(`Invalid data from Apify.`);\n      }\n      if (data.length === 0) {\n        throw new Error(`Twitter/X blocked the scraper (0 posts returned for ${targetUrl}).`);\n      }'
);

fs.writeFileSync('src/lib/adapters/twitter.adapter.ts', code);
