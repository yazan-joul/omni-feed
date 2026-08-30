'use client';

import React from 'react';
import { FeedItem } from '@/lib/types';
import { FeedCard } from './FeedCard';
import { Inbox, Sparkles, Plus } from 'lucide-react';

interface FeedGridProps {
  items: FeedItem[];
  isLoading: boolean;
  viewMode: 'grid' | 'list';
  isBookmarked: (id: string) => boolean;
  isRead: (id: string) => boolean;
  onToggleBookmark: (item: FeedItem) => void;
  onOpenVideo: (item: FeedItem) => void;
  onOpenReader: (item: FeedItem) => void;
  onResetFilters?: () => void;
  onOpenAddModal?: () => void;
}

export function FeedGrid({
  items,
  isLoading,
  viewMode,
  isBookmarked,
  isRead,
  onToggleBookmark,
  onOpenVideo,
  onOpenReader,
  onResetFilters,
  onOpenAddModal,
}: FeedGridProps) {
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

  // Empty state
  if (items.length === 0) {
    return (
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
    );
  }

  return (
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
          onOpenVideo={onOpenVideo}
          onOpenReader={onOpenReader}
        />
      ))}
    </div>
  );
}
