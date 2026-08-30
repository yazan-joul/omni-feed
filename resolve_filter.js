const fs = require('fs');

let content = fs.readFileSync('src/components/FilterBar.tsx', 'utf-8');

// Replace Conflict 1
content = content.replace(
/<<<<<<< HEAD\n    <div className="w-full space-y-3\.5 mb-6">\n      \{\/\* 1\. Top row: Search Bar, Media Type Switcher, View Mode & Refresh \*\/}\n      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">\n=======\n    <div className="w-full space-y-3 sm:space-y-4 mb-6 overflow-x-hidden">\n      \{\/\* Top row: Search Bar, Media Switcher, View Switcher & Refresh \*\/}\n      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">\n>>>>>>> origin\/alona/,
`    <div className="w-full space-y-3 sm:space-y-4 mb-6 overflow-x-hidden">
      {/* Top row: Search Bar, Media Switcher, View Switcher & Refresh */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">`
);

// Replace Conflict 2
content = content.replace(
/<<<<<<< HEAD\n            placeholder="Search feed, authors, tags\.\.\. \(Press '\/' to focus\)"\n=======\n            placeholder="Search across videos, podcasts, articles, tags, authors\.\.\. \(Press '\/' to focus\)"\n>>>>>>> origin\/alona/,
`            placeholder="Search across videos, podcasts, articles, tags, authors... (Press '/' to focus)"`
);

// Replace Conflict 3
content = content.replace(
/<<<<<<< HEAD\n        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">[\s\S]*?              Articles\n            <\/button>\n          <\/div>\n=======\n        <div className="flex w-full items-center gap-2 md:w-auto">[\s\S]*?              Articles\n              <\/button>\n            <\/div>\n          <\/div>\n>>>>>>> origin\/alona/,
`        <div className="flex w-full items-center gap-2 md:w-auto">
          {/* Media Type Filter */}
          <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none rounded-xl border border-white/10 bg-slate-900/60 p-1 text-xs md:flex-none">
            <div className="flex min-w-max items-center gap-1">
              <button
                onClick={() => setSelectedMediaType('all')}
                className={\`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap \${
                  selectedMediaType === 'all' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }\`}
              >
                All Types
              </button>
              <button
                onClick={() => setSelectedMediaType('video')}
                className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap \${
                  selectedMediaType === 'video' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }\`}
              >
                <Video className="w-3.5 h-3.5" />
                Videos
              </button>
              <button
                onClick={() => setSelectedMediaType('podcast')}
                className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap \${
                  selectedMediaType === 'podcast' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }\`}
              >
                <Headphones className="w-3.5 h-3.5" />
                Podcasts
              </button>
              <button
                onClick={() => setSelectedMediaType('article')}
                className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap \${
                  selectedMediaType === 'article' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }\`}
              >
                <FileText className="w-3.5 h-3.5" />
                Articles
              </button>
            </div>
          </div>`
);


fs.writeFileSync('src/components/FilterBar.tsx', content);
