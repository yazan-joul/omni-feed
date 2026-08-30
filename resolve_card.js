const fs = require('fs');

let content = fs.readFileSync('src/components/FeedCard.tsx', 'utf-8');

content = content.replace(
/<<<<<<< HEAD\n  CheckCircle2,\n=======\n>>>>>>> origin\/alona/,
`  CheckCircle2,`
);

content = content.replace(
/<<<<<<< HEAD\n=======\n  const shouldUsePodcastFallback = isPodcast && \(\!item\.thumbnailUrl \|\| imageFailed\);\n  const shouldRenderThumbnail = Boolean\(item\.thumbnailUrl\) && \!imageFailed;\n  const formattedDuration =[\s\S]*?>>>>>>> origin\/alona/,
`  const shouldUsePodcastFallback = isPodcast && (!item.thumbnailUrl || imageFailed);
  const shouldRenderThumbnail = Boolean(item.thumbnailUrl) && !imageFailed;
  const formattedDuration =
    item.durationSeconds !== undefined && item.durationSeconds !== null
      ? (() => {
          const hours = Math.floor(item.durationSeconds / 3600);
          const minutes = Math.floor((item.durationSeconds % 3600) / 60);
          const seconds = item.durationSeconds % 60;

          if (hours > 0) {
            return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
          }

          return \`\${minutes}:\${String(seconds).padStart(2, '0')}\`;
        })()
      : undefined;`
);

content = content.replace(
/<<<<<<< HEAD\n                    \? 'bg-amber-500\/10 text-amber-400 border border-amber-500\/20'\n                    : 'bg-violet-500\/10 text-violet-400 border border-violet-500\/20'\n=======\n                      \? 'bg-emerald-500\/10 text-emerald-400 border border-emerald-500\/20'\n                      : 'bg-violet-500\/10 text-violet-400 border border-violet-500\/20'\n>>>>>>> origin\/alona/,
`                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'`
);

content = content.replace(
/<<<<<<< HEAD\n                  <Headphones className="w-3 h-3 text-amber-400" \/>\n                \) : \(\n                  <Rss className="w-3 h-3 text-violet-400" \/>\n                \)\}\n                \{item\.sourceName\}\n=======\n                  <Headphones className="w-3 h-3 text-emerald-400" \/>\n                \) : \(\n                  <Rss className="w-3 h-3 text-violet-400" \/>\n                \)\}\n                \{isPodcast \? 'Podcast' : item\.sourceName\}\n>>>>>>> origin\/alona/,
`                  <Headphones className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Rss className="w-3 h-3 text-violet-400" />
                )}
                {isPodcast ? 'Podcast' : item.sourceName}`
);


content = content.replace(
/<<<<<<< HEAD\n              \{item\.duration && \(\n                <span className="text-amber-400\/80 font-mono text-\[11px\] hidden sm:inline">\{item\.duration\}<\/span>\n              \)\}\n              \{item\.metrics\?\.readTime && \(\n=======\n              \{isPodcast && formattedDuration && \(\n                <span className="text-slate-400 hidden sm:inline">\{formattedDuration\}<\/span>\n              \)\}\n              \{\!isPodcast && item\.metrics\?\.readTime && \(\n>>>>>>> origin\/alona/,
`              {isPodcast && formattedDuration && (
                <span className="text-slate-400 hidden sm:inline">{formattedDuration}</span>
              )}
              {!isPodcast && item.metrics?.readTime && (`
);

content = content.replace(
/<<<<<<< HEAD\n                  \? 'bg-amber-600\/90 text-white shadow-md shadow-amber-600\/30'\n                  : 'bg-violet-600\/90 text-white shadow-md shadow-violet-600\/30'\n=======\n                    \? 'bg-emerald-600\/90 text-white shadow-md shadow-emerald-600\/30'\n                    : 'bg-violet-600\/90 text-white shadow-md shadow-violet-600\/30'\n>>>>>>> origin\/alona/,
`                  ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-violet-600/90 text-white shadow-md shadow-violet-600/30'`
);

content = content.replace(
/<<<<<<< HEAD\n            \{item\.duration && \(\n              <span className="bg-black\/60 backdrop-blur-md px-2 py-0\.5 rounded-md text-amber-300 font-mono">\n                \{item\.duration\}\n              <\/span>\n            \)\}\n            \{item\.metrics\?\.readTime && \!item\.duration && \(\n=======\n            \{isPodcast && formattedDuration && \(\n              <span className="bg-black\/60 backdrop-blur-md px-2 py-0\.5 rounded-md">\n                \{formattedDuration\}\n              <\/span>\n            \)\}\n            \{\!isPodcast && item\.metrics\?\.readTime && \(\n>>>>>>> origin\/alona/,
`            {isPodcast && formattedDuration && (
              <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                {formattedDuration}
              </span>
            )}
            {!isPodcast && item.metrics?.readTime && (`
);

content = content.replace(
/<<<<<<< HEAD\n            \{isVideo \? 'Watch Video' : isPodcast \? 'Listen Episode' : 'Read Article'\} &rarr;\n=======\n            \{isVideo \? 'Watch Video' : isPodcast \? 'Listen Podcast' : 'Read Article'\} &rarr;\n>>>>>>> origin\/alona/,
`            {isVideo ? 'Watch Video' : isPodcast ? 'Listen Podcast' : 'Read Article'} &rarr;`
);


fs.writeFileSync('src/components/FeedCard.tsx', content);
