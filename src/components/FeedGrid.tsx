import React, { useState } from 'react';
import { FeedItem } from '@/lib/types';
import { FeedCard } from './FeedCard';
import { Inbox, AlertTriangle, CheckCircle2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';

interface FeedGridProps {
  items: FeedItem[];
  isLoading: boolean;
  viewMode: 'grid' | 'list';
  isBookmarked: (id: string) => boolean;
  isRead: (id: string) => boolean;
  onToggleBookmark: (item: FeedItem) => void;
  onToggleRead?: (id: string) => void;
  onMarkAllAsRead?: (ids: string[]) => void;
  onOpenVideo: (item: FeedItem) => void;
  onOpenReader: (item: FeedItem) => void;
  onOpenPodcast: (item: FeedItem) => void;
  onResetFilters?: () => void;
  onOpenAddModal?: () => void;
  failedSources?: string[];
}

interface TimeChunk {
  title: string;
  subtitle?: string;
  items: FeedItem[];
  isToday?: boolean;
  isOlder?: boolean;
  defaultOpen: boolean;
}

export function FeedGrid({
  items,
  isLoading,
  viewMode,
  isBookmarked,
  isRead,
  onToggleBookmark,
  onToggleRead,
  onMarkAllAsRead,
  onOpenVideo,
  onOpenReader,
  onOpenPodcast,
  onResetFilters,
  onOpenAddModal,
  failedSources = [],
}: FeedGridProps) {
  const [olderArchiveLimit, setOlderArchiveLimit] = useState(12);
  // Default open for last 24h (Today) and last 48h (Yesterday), folded for the rest
  const [collapsedChunks, setCollapsedChunks] = useState<Record<string, boolean>>({
    'Earlier This Week': true,
    'Older Archive': true,
  });

  const toggleChunk = (title: string) => {
    setCollapsedChunks((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Skeleton loading state
  if (isLoading && items.length === 0) {
    return (
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
            : 'space-y-4'
        }
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel rounded-2xl p-4 space-y-3 animate-pulse border border-white/5"
          >
            <div className="aspect-video w-full rounded-xl bg-slate-800/60" />
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-slate-800" />
              <div className="h-3 w-24 rounded bg-slate-800" />
            </div>
            <div className="h-4 w-5/6 rounded bg-slate-800" />
            <div className="h-3 w-full rounded bg-slate-800/60" />
          </div>
        ))}
      </div>
    );
  }

  // Time-chunking partitioning (Today: < 24h, Yesterday: 24h-48h, This Week: 2-7d, Older: >7d)
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const todayItems: FeedItem[] = [];
  const yesterdayItems: FeedItem[] = [];
  const thisWeekItems: FeedItem[] = [];
  const olderItems: FeedItem[] = [];

  for (const item of items) {
    const pubTime = new Date(item.publishedAt).getTime();
    if (isNaN(pubTime)) {
      todayItems.push(item);
      continue;
    }
    const diff = now - pubTime;
    if (diff < dayMs) {
      todayItems.push(item);
    } else if (diff < dayMs * 2) {
      yesterdayItems.push(item);
    } else if (diff < dayMs * 7) {
      thisWeekItems.push(item);
    } else {
      olderItems.push(item);
    }
  }

  const chunks: TimeChunk[] = [
    { title: 'Today', subtitle: 'Past 24 Hours', items: todayItems, isToday: true, defaultOpen: true },
    { title: 'Yesterday', subtitle: '24-48 Hours Ago', items: yesterdayItems, defaultOpen: true },
    { title: 'Earlier This Week', subtitle: 'Last 7 Days', items: thisWeekItems, defaultOpen: false },
    { title: 'Older Archive', subtitle: 'Previous Stories', items: olderItems, isOlder: true, defaultOpen: false },
  ].filter((chunk) => chunk.items.length > 0);

  const totalChunks = chunks.length;

  return (
    <div className="space-y-8">
      {failedSources.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/20 flex items-start gap-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-amber-400">Stream Fetch Notice</h4>
            <p className="text-xs opacity-90">
              The following sources could not be refreshed right now:
              <span className="font-semibold ml-1">{failedSources.join(', ')}</span>
            </p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 border border-white/10 my-8">
          <div className="w-16 h-16 rounded-2xl bg-cyan-600/10 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/20 shadow-inner">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-100">No content matches your filter</h3>
          <p className="text-sm text-slate-400">
            Try adjusting your search query, switching platforms, or extending your time filter.
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium shadow-md shadow-cyan-600/20 transition-all"
              >
                Add Feed
              </button>
            )}
          </div>
        </div>
      ) : (
        chunks.map((chunk, chunkIndex) => {
          const isCollapsed = Boolean(collapsedChunks[chunk.title]);

          return (
            <section key={chunk.title} className="space-y-4">
              {/* Collapsible Time Chunk Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => toggleChunk(chunk.title)}
                  className="flex items-center gap-2 group text-left transition-colors focus:outline-none"
                >
                  <div className="p-1 rounded-lg bg-slate-800/80 group-hover:bg-cyan-600/20 text-slate-400 group-hover:text-cyan-300 transition-colors">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase group-hover:text-cyan-300 transition-colors">
                    {chunk.title}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    ({chunk.items.length} {chunk.items.length === 1 ? 'item' : 'items'})
                  </span>
                  {chunk.subtitle && (
                    <span className="text-[11px] text-slate-500 hidden sm:inline ml-2">
                      {chunk.subtitle}
                    </span>
                  )}
                  {isCollapsed && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400 font-medium ml-1">
                      Folded &bull; Click to load
                    </span>
                  )}
                </button>

                {!isCollapsed && onMarkAllAsRead && (
                  <button
                    onClick={() => onMarkAllAsRead(chunk.items.map((i) => i.id))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark as Read
                  </button>
                )}
              </div>

              {/* Lazy-loaded Grid / List: only renders DOM when expanded */}
              {!isCollapsed && (
                <>
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
                        : 'space-y-4'
                    }
                  >
                    {(chunk.isOlder ? chunk.items.slice(0, olderArchiveLimit) : chunk.items).map((item) => (
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

                  {/* Load More Button for Older Archive */}
                  {chunk.isOlder && chunk.items.length > olderArchiveLimit && (
                    <div className="pt-4 flex justify-center">
                      <button
                        onClick={() => setOlderArchiveLimit((prev) => prev + 12)}
                        className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium text-slate-200 transition-all shadow-md"
                      >
                        Load More Archive
                      </button>
                    </div>
                  )}

                  {/* Caught-Up Divider for Today Section */}
                  {chunk.isToday && (
                    <div className="pt-4">
                      <div className="glass-panel rounded-2xl p-4 sm:p-5 text-center border border-cyan-500/20 bg-cyan-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-cyan-950/30">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-sm font-semibold text-slate-100">You're all caught up for Today</h4>
                            <p className="text-xs text-slate-400">
                              {chunk.items.length} fresh stories reviewed from the past 24 hours.
                            </p>
                          </div>
                        </div>
                        {totalChunks > 1 && chunkIndex === 0 && (
                          <span className="text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-white/5">
                            Earlier content below &darr;
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
