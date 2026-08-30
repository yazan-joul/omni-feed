const fs = require('fs');

let content = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

content = content.replace(
/<<<<<<< HEAD[\s\S]*?>>>>>>> origin\/alona/,
`        <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-initial" onClick={() => setActiveTab('feed')}>
          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Rss className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-lg font-bold tracking-tight bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent sm:text-xl">
                OmniFeed
              </span>
              <span className="hidden shrink-0 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-400 sm:inline-block">
                v1.0
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="truncate">{sourcesCount} Live Streams</span>
            </div>
          </div>
        </div>`
);

fs.writeFileSync('src/components/Navbar.tsx', content);
