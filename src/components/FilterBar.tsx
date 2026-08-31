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
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Clock,
  Layers,
  CheckCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ContentPlatform, MediaType, TimeRange } from '@/lib/types';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedPlatform: ContentPlatform | 'all';
  setSelectedPlatform: (p: ContentPlatform | 'all') => void;
  selectedMediaType: MediaType | 'all';
  setSelectedMediaType: (m: MediaType | 'all') => void;
  limitPerSource: number;
  setLimitPerSource: (l: number) => void;
  unreadOnly: boolean;
  setUnreadOnly: (u: boolean) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  isLoading: boolean;
  refreshingPlatform?: ContentPlatform | 'all' | null;
  onRefresh: () => void;
  onRefreshPlatform: (platform: ContentPlatform) => void;
}

export function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedPlatform,
  setSelectedPlatform,
  selectedMediaType,
  setSelectedMediaType,
  limitPerSource,
  setLimitPerSource,
  unreadOnly,
  setUnreadOnly,
  viewMode,
  setViewMode,
  isLoading,
  refreshingPlatform,
  onRefresh,
  onRefreshPlatform,
}: FilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderPlatformButton = (
    platform: ContentPlatform,
    label: string,
    Icon: React.ElementType,
    activeColorClass: string,
    iconColorClass: string,
    hoverColorClass: string
  ) => {
    const isActive = selectedPlatform === platform;
    const isThisPlatformRefreshing = refreshingPlatform === platform;

    return (
      <div
        className={`inline-flex items-stretch rounded-lg border transition-all shrink-0 ${
          isActive
            ? `${activeColorClass} border-transparent shadow-sm`
            : `bg-slate-900/50 border-white/10 ${hoverColorClass}`
        }`}
      >
        <button
          onClick={() => {
            setSelectedPlatform(platform);
            if (
              (platform === 'youtube' && (selectedMediaType === 'article' || selectedMediaType === 'podcast')) ||
              (platform === 'rss' && selectedMediaType === 'video') ||
              (platform === 'instagram' && selectedMediaType === 'podcast')
            ) {
              setSelectedMediaType('all');
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            isActive ? 'text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : iconColorClass}`} />
          <span>{label}</span>
        </button>

        <div className={`w-[1px] my-1 ${isActive ? 'bg-white/20' : 'bg-white/10'}`} />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRefreshPlatform(platform);
          }}
          title={`Refresh ${label}`}
          disabled={isThisPlatformRefreshing || isLoading}
          className={`flex items-center justify-center px-2 py-1.5 transition-colors focus:outline-none ${
            isActive
              ? 'text-white/80 hover:text-white hover:bg-black/10'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          <RotateCw
            className={`w-3.5 h-3.5 ${
              isThisPlatformRefreshing
                ? 'animate-spin text-cyan-400 opacity-100'
                : 'opacity-70 hover:opacity-100'
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 mb-6 relative z-20">
      {/* 1. Top row: Search, Format toggles, Layout toggles, Global Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-2 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
        
        {/* Search */}
        <div className="relative w-full sm:w-72 md:w-96 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search feed... (Cmd+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-slate-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none">
          {/* Media Format Toggles */}
          <div className="flex items-center bg-slate-950/50 p-1 rounded-xl border border-white/5 shrink-0">
            <button
              onClick={() => setSelectedMediaType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMediaType === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={() => setSelectedMediaType('article')}
              title="Articles & Posts"
              className={`p-1.5 rounded-lg transition-all ${
                selectedMediaType === 'article' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedMediaType('video')}
              title="Videos"
              className={`p-1.5 rounded-lg transition-all ${
                selectedMediaType === 'video' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedMediaType('podcast')}
              title="Podcasts"
              className={`p-1.5 rounded-lg transition-all ${
                selectedMediaType === 'podcast' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Headphones className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-white/10 shrink-0" />

          {/* View Layout Toggles */}
          <div className="flex items-center bg-slate-950/50 p-1 rounded-xl border border-white/5 shrink-0">
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

          {/* Global Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh All"
            className="shrink-0 p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RotateCw
              className={`w-4 h-4 ${
                refreshingPlatform === 'all' || (isLoading && !refreshingPlatform)
                  ? 'animate-spin text-cyan-400'
                  : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Middle row: Per-Source Cap and Unread Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-1 border-t border-white/5 text-xs text-slate-300">
        {/* Left: Per-Source Limit Selector */}
        <div className="flex items-center gap-1 bg-slate-900/40 p-1 rounded-xl border border-white/5">
          <div className="flex items-center gap-1 text-slate-400 px-2 py-0.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-[11px] uppercase tracking-wider">Cap / src:</span>
          </div>
          {[5, 10, 15, 0].map((l) => (
            <button
              key={l}
              onClick={() => setLimitPerSource(l)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                limitPerSource === l
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {l === 0 ? 'All' : l}
            </button>
          ))}
        </div>

        {/* Right: Unread Only Filter */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              unreadOnly
                ? 'bg-cyan-600/30 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {unreadOnly ? <EyeOff className="w-3.5 h-3.5 text-cyan-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
            <span>{unreadOnly ? 'Showing Unread Only' : 'Show All'}</span>
          </button>
        </div>
      </div>

      {/* 3. Bottom row: Platform Filter & Refresh Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none mt-2">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all border shrink-0 ${
            selectedPlatform === 'all'
              ? 'bg-slate-700 text-white border-slate-600 shadow-sm'
              : 'bg-slate-900/50 text-slate-400 hover:text-slate-200 border-white/10 hover:bg-slate-900/80 hover:border-white/20'
          }`}
        >
          All Platforms
        </button>
        
        {renderPlatformButton('youtube', 'YouTube', Youtube, 'bg-red-600/90 text-white', 'text-red-500', 'hover:border-red-500/40 hover:bg-slate-900/80')}
        {renderPlatformButton('rss', 'RSS', Rss, 'bg-cyan-600/90 text-white', 'text-cyan-400', 'hover:border-cyan-500/40 hover:bg-slate-900/80')}
        {renderPlatformButton('twitter', 'X / Twitter', Twitter, 'bg-sky-500/90 text-white', 'text-sky-400', 'hover:border-sky-500/40 hover:bg-slate-900/80')}
        {renderPlatformButton('reddit', 'Reddit', MessageCircle, 'bg-orange-600/90 text-white', 'text-orange-500', 'hover:border-orange-500/40 hover:bg-slate-900/80')}
        {renderPlatformButton('instagram', 'Instagram', Instagram, 'bg-pink-600/90 text-white', 'text-pink-400', 'hover:border-pink-500/40 hover:bg-slate-900/80')}
        {renderPlatformButton('facebook', 'Facebook', Facebook, 'bg-blue-700/90 text-white', 'text-blue-500', 'hover:border-blue-500/40 hover:bg-slate-900/80')}
      </div>
    </div>
  );
}
