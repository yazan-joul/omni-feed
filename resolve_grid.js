const fs = require('fs');

let content = fs.readFileSync('src/components/FeedGrid.tsx', 'utf-8');

content = content.replace(
/<<<<<<< HEAD[\s\S]*?>>>>>>> origin\/alona/,
`    <div className="space-y-4">
      {failedSources.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/20 flex items-start gap-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-amber-400">Stream Fetch Failed</h4>
            <p className="text-xs opacity-90">
              The following sources could not be loaded due to rate limits or API blocks: 
              <span className="font-semibold ml-1">{failedSources.join(', ')}</span>
            </p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 border border-white/10 my-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/10 text-violet-400 mx-auto flex items-center justify-center border border-violet-500/20 shadow-inner">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-100">No content matches your filter</h3>
          <p className="text-sm text-slate-400">
            Try clearing your search query, switching categories, or adding a new custom stream.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onResetFilters && (
              <button
                onClick={onResetFilters}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all"
              >
                Reset Filters
              </button>
            )}
            {onOpenAddModal && (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium shadow-md shadow-violet-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Feed
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
              : 'space-y-4'
          }
        >
          {items.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              viewMode={viewMode}
              isBookmarked={isBookmarked(item.id)}
              isRead={isRead(item.id)}
              onToggleBookmark={onToggleBookmark}
              onToggleRead={onToggleRead}
              onOpenVideo={onOpenVideo}
              onOpenReader={onOpenReader}
              onOpenPodcast={onOpenPodcast}
            />
          ))}
        </div>
      )}`
);

fs.writeFileSync('src/components/FeedGrid.tsx', content);
