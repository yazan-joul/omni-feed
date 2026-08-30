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
  Youtube,
  Rss,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/config/default-sources';
import { ContentPlatform, MediaType } from '@/lib/types';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedPlatform: ContentPlatform | 'all';
  setSelectedPlatform: (p: ContentPlatform | 'all') => void;
  selectedMediaType: MediaType | 'all';
  setSelectedMediaType: (m: MediaType | 'all') => void;
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
    <div className="w-full space-y-4 mb-6">
      {/* Top row: Search Bar, Media Switcher, View Switcher & Refresh */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search across videos, articles, tags, authors... (Press '/' to focus)"
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
        <div className="flex items-center gap-2">
          {/* Media Type Filter */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
            <button
              onClick={() => setSelectedMediaType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedMediaType === 'all' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Types
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
              onClick={() => setSelectedMediaType('article')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedMediaType === 'article' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Articles
            </button>
          </div>

          {/* View Mode Grid/List */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/60 border border-white/10">
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
            className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-violet-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bottom row: Category & Platform Pills */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-none">
        {/* Categories */}
        <div className="flex items-center gap-1.5 flex-nowrap">
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
        <div className="flex items-center gap-1 flex-nowrap">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedPlatform === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Sources
          </button>
          <button
            onClick={() => setSelectedPlatform('youtube')}
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
            onClick={() => setSelectedPlatform('hackernews')}
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
            onClick={() => setSelectedPlatform('rss')}
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
