'use client';

import React, { useRef, useEffect } from 'react';
import {
  Search,
  X,
  RotateCw,
  LayoutGrid,
  List,
  Video,
  FileText,
  Headphones,
  Youtube,
  Rss,
  Terminal,
  Headphones,
  Clock,
  Layers,
  CheckCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/config/default-sources';
import { ContentPlatform, MediaType, TimeRange } from '@/lib/types';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedPlatform: ContentPlatform | 'all';
  setSelectedPlatform: (p: ContentPlatform | 'all') => void;
  selectedMediaType: MediaType | 'all';
  setSelectedMediaType: (m: MediaType | 'all') => void;
  timeRange: TimeRange;
  setTimeRange: (t: TimeRange) => void;
  limitPerSource: number;
  setLimitPerSource: (l: number) => void;
  unreadOnly: boolean;
  setUnreadOnly: (u: boolean) => void;
  onMarkAllAsRead?: () => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedPlatform,
  setSelectedPlatform,
  selectedMediaType,
  setSelectedMediaType,
  timeRange,
  setTimeRange,
  limitPerSource,
  setLimitPerSource,
  unreadOnly,
  setUnreadOnly,
  onMarkAllAsRead,
  viewMode,
  setViewMode,
  isLoading,
  onRefresh,
}: FilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full space-y-3 sm:space-y-4 mb-6 overflow-x-hidden">
      {/* Top row: Search Bar, Media Switcher, View Switcher & Refresh */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search input */}
        <div className="relative w-full md:flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search across videos, podcasts, articles, tags, authors... (Press '/' to focus)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Media Type & View Mode Controls */}
<<<<<<< HEAD
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Media Type Filter */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
            <button
              onClick={() => setSelectedMediaType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedMediaType === 'all' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedMediaType('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedMediaType === 'video' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Videos
            </button>
            <button
              onClick={() => setSelectedMediaType('podcast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedMediaType === 'podcast' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              Podcasts
            </button>
            <button
              onClick={() => setSelectedMediaType('article')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedMediaType === 'article' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Articles
            </button>
=======
        <div className="flex w-full items-center gap-2 md:w-auto">
          {/* Media Type Filter */}
          <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none rounded-xl border border-white/10 bg-slate-900/60 p-1 text-xs md:flex-none">
            <div className="flex min-w-max items-center gap-1">
              <button
                onClick={() => setSelectedMediaType('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedMediaType === 'all' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setSelectedMediaType('video')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedMediaType === 'video' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Videos
              </button>
              <button
                onClick={() => setSelectedMediaType('podcast')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedMediaType === 'podcast' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                Podcasts
              </button>
              <button
                onClick={() => setSelectedMediaType('article')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedMediaType === 'article' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Articles
              </button>
            </div>
>>>>>>> origin/alona
          </div>

          {/* View Mode Grid/List */}
          <div className="flex shrink-0 items-center rounded-xl border border-white/10 bg-slate-900/60 p-1">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Live Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Feed"
            className="shrink-0 p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-violet-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Middle row: Time Window, Source Limit, and Read Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-1 border-t border-white/5 text-xs text-slate-300">
        {/* Left: Time Window & Per-Source Limit */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Time Window Pills */}
          <div className="flex items-center gap-1 bg-slate-900/40 p-1 rounded-xl border border-white/5">
            <div className="flex items-center gap-1 text-slate-400 px-2 py-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-semibold text-[11px] uppercase tracking-wider">Time:</span>
            </div>
            {(['all', '24h', '3d', '7d'] as TimeRange[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  timeRange === t
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {t === 'all' ? 'All Time' : t === '24h' ? 'Last 24h' : t === '3d' ? '3 Days' : 'This Week'}
              </button>
            ))}
          </div>

          {/* Per-Source Limit Selector */}
          <div className="flex items-center gap-1 bg-slate-900/40 p-1 rounded-xl border border-white/5">
            <div className="flex items-center gap-1 text-slate-400 px-2 py-0.5">
              <Layers className="w-3.5 h-3.5" />
              <span className="font-semibold text-[11px] uppercase tracking-wider">Cap:</span>
            </div>
            {[5, 10, 15, 0].map((l) => (
              <button
                key={l}
                onClick={() => setLimitPerSource(l)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  limitPerSource === l
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {l === 0 ? 'All' : `${l}/src`}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Unread Only & Mark All Read */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              unreadOnly
                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {unreadOnly ? <EyeOff className="w-3.5 h-3.5 text-indigo-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
            <span>{unreadOnly ? 'Showing Unread Only' : 'Show All (Read & Unread)'}</span>
          </button>

          {onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              title="Mark all visible items as read"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 text-slate-400 hover:text-emerald-400 transition-all text-xs font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Bottom row: Category & Platform Pills */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-none">
        {/* Categories */}
        <div className="flex min-w-max items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Platform Filter */}
        <div className="flex min-w-max items-center gap-1">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedPlatform === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Platforms
          </button>
          <button
            onClick={() => {
              setSelectedPlatform('youtube');
              if (selectedMediaType === 'article' || selectedMediaType === 'podcast') {
                setSelectedMediaType('all');
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedPlatform === 'youtube'
                ? 'bg-red-600/80 text-white'
                : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-red-500" />
            YouTube
          </button>
          <button
            onClick={() => {
              setSelectedPlatform('hackernews');
              if (selectedMediaType === 'video' || selectedMediaType === 'podcast') {
                setSelectedMediaType('all');
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedPlatform === 'hackernews'
                ? 'bg-amber-600/80 text-white'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-500" />
            Hacker News
          </button>
          <button
            onClick={() => {
              setSelectedPlatform('rss');
              if (selectedMediaType === 'video') {
                setSelectedMediaType('all');
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedPlatform === 'rss'
                ? 'bg-blue-600/80 text-white'
                : 'text-slate-400 hover:text-blue-400'
            }`}
          >
            <Rss className="w-3.5 h-3.5 text-blue-400" />
            RSS
          </button>
        </div>
      </div>
    </div>
  );
}
