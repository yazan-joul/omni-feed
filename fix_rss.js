const fs = require('fs');
let content = fs.readFileSync('src/lib/adapters/rss.adapter.ts', 'utf-8');

// Add import
content = content.replace(
  "import Parser from 'rss-parser';",
  "import Parser from 'rss-parser';\nimport { decodeHtmlEntities } from '../utils/decode';"
);

// Decode title
content = content.replace(
  "title: item.title?.trim() || 'Untitled Article',",
  "title: decodeHtmlEntities(item.title?.trim() || 'Untitled Article'),"
);

// Decode author
content = content.replace(
  "name: (item as any).creator || item.creator || item.author || parsed.title || source.name,",
  "name: decodeHtmlEntities((item as any).creator || item.creator || item.author || parsed.title || source.name),"
);

// Decode summary
content = content.replace(
  "summary: cleanSummary ? `${cleanSummary}...` : undefined,",
  "summary: cleanSummary ? `${decodeHtmlEntities(cleanSummary)}...` : undefined,"
);

fs.writeFileSync('src/lib/adapters/rss.adapter.ts', content);
