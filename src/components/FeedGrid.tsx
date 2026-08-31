import React, { useRef, useEffect } from 'react';
import { FeedItem } from '@/lib/types';
import { FeedCard } from './FeedCard';
import { Inbox, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface FeedGridProps {
  items: FeedItem[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
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

export function FeedGrid({
  items,
  isLoading,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
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
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore?.();
        }
      },
      { rootMargin: '400px' } // Load earlier
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Skeleton loading state (initial load only)
  if (isLoading && items.length === 0) {
    return (
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5' : 'space-y-4'}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-2xl p-4 space-y-3 animate-pulse border border-white/5">
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

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const isItemToday = (item: FeedItem) => {
    const pubTime = new Date(item.publishedAt).getTime();
    return isNaN(pubTime) || now - pubTime < dayMs;
  };

  let todayCount = items.filter(isItemToday).length;

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
        <>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5' : 'space-y-4'}>
            {items.map((item, i) => {
              const today = isItemToday(item);
              const nextItem = items[i + 1];
              const nextIsToday = nextItem ? isItemToday(nextItem) : false;
              
              // Show the divider if this item is today, and the next is not,
              // OR this is the last item, it is today, and there's no more to load.
              const showCaughtUp = today && !nextIsToday && (nextItem || !hasMore);

              return (
                <React.Fragment key={item.id}>
                  <FeedCard
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
                  {showCaughtUp && (
                    <div className="col-span-full pt-6 pb-2">
                      <div className="glass-panel rounded-2xl p-4 sm:p-5 text-center border border-cyan-500/20 bg-cyan-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-cyan-950/30">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-sm font-semibold text-slate-100">You're all caught up for Today</h4>
                            <p className="text-xs text-slate-400">
                              {todayCount} fresh stories reviewed from the past 24 hours.
                            </p>
                          </div>
                        </div>
                        {hasMore || items.length > todayCount ? (
                          <span className="text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-white/5">
                            Earlier content below &darr;
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          
          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="col-span-full flex justify-center py-8">
              {isLoadingMore ? (
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <button 
                  onClick={() => onLoadMore?.()}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium text-slate-200 transition-all shadow-md"
                >
                  Load More
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
