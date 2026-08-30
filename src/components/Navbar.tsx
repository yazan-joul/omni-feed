'use client';

import React from 'react';
import {
  Rss,
  Bookmark,
  Plus,
  SlidersHorizontal,
  Sun,
  Moon,
  Github,
  Radio,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'feed' | 'bookmarks';
  setActiveTab: (tab: 'feed' | 'bookmarks') => void;
  bookmarkCount: number;
  sourcesCount: number;
  onOpenAddModal: () => void;
  onOpenSourcesModal: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  bookmarkCount,
  sourcesCount,
  onOpenAddModal,
  onOpenSourcesModal,
  isDarkMode,
  onToggleTheme,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-3 sm:px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand / Logo */}
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-initial" onClick={() => setActiveTab('feed')}>
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
        </div>
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
            OmniFeed
          </span>
        </div>

        {/* Center: Main Navigation Tabs */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-900/60 border border-white/10">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'feed'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            Live Feed
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === 'bookmarks'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Saved
            {bookmarkCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] bg-violet-400/20 text-violet-300 font-bold">
                {bookmarkCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {/* Add Custom Feed Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-2 text-white shadow-lg shadow-violet-600/25 transition-all active:scale-95 sm:px-3.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Feed</span>
          </button>

          {/* Manage Sources Button */}
          <button
            onClick={onOpenSourcesModal}
            title="Manage Feed Sources"
            className="rounded-xl border border-white/10 bg-slate-800/60 p-2 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            title="Toggle theme"
            className="rounded-xl border border-white/10 bg-slate-800/60 p-2 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-slate-300" />}
          </button>
        </div>
      </div>
    </header>
  );
}
