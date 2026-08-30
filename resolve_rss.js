const fs = require('fs');

let content = fs.readFileSync('src/lib/adapters/rss.adapter.ts', 'utf-8');

// Replace Conflict 1
content = content.replace(
/<<<<<<< HEAD\n          \['itunes:summary', 'itunesSummary'\],\n          \['itunes:author', 'itunesAuthor'\],\n=======\n>>>>>>> origin\/alona/,
`          ['itunes:summary', 'itunesSummary'],
          ['itunes:author', 'itunesAuthor'],`
);

// Replace Conflict 2
content = content.replace(
/<<<<<<< HEAD[\s\S]*?itunesImage\?\.\[\$\.?href\] \|\|\n=======\n        \/\/ --- Extract Best Image ---\n        const itunesImage = \(item as any\)\.itunesImage\?\.\$?\.\.?href \|\| \(parsed as any\)\.itunesImage\?\.\$?\.\.?href;\n        let thumbnailUrl =\n          itunesImage \|\|\n          \(item as any\)\.mediaThumbnail\?\.\$?\.\.?url \|\|\n>>>>>>> origin\/alona/g,
`        // --- Detect Podcast ---
        let isPodcast = false;
        let audioUrl = undefined;
        let duration = undefined;

        if (item.enclosure && item.enclosure.url && (item.enclosure.type?.includes('audio') || item.enclosure.url.endsWith('.mp3'))) {
          isPodcast = true;
          audioUrl = item.enclosure.url;
        }

        const itunesDuration = (item as any).itunesDuration;
        if (itunesDuration) {
          duration = itunesDuration;
        }
        
        // --- Extract Best Image ---
        const itunesImage = (item as any).itunesImage?.$?.href || (parsed as any).itunesImage?.$?.href;
        let thumbnailUrl =
          itunesImage ||
          (item as any).mediaThumbnail?.$?.url ||`
);

// For conflict 2, I used a regex, wait I should use a generic one if I'm not sure of the exact strings. 
// Let's just fix the whole block using awk or node.
