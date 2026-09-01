'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Search,
  X,
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ContentPlatform, MediaType } from '@/lib/types';
import { useIsOverflowing } from '@/lib/hooks/useIsOverflowing';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedPlatform: ContentPlatform | 'all';
  setSelectedPlatform: (p: ContentPlatform | 'all') => void;
  selectedMediaType: MediaType | 'all';
  setSelectedMediaType: (m: MediaType | 'all') => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  isLoading: boolean;
}

export function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedPlatform,
  setSelectedPlatform,
  selectedMediaType,
  setSelectedMediaType,
  viewMode,
  setViewMode,
  isLoading,
}: FilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const platformContainerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const isOverflowing = useIsOverflowing(platformContainerRef);

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
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
            isActive ? 'text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : iconColorClass}`} />
          <span className="whitespace-nowrap">{label}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2.5 mb-6 relative z-20">
      {/* 1. Top row: Search, Format toggles, Layout toggles */}
      <div className="flex items-center justify-between gap-2 bg-slate-900/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl overflow-x-auto scrollbar-none [text-size-adjust:100%] [-webkit-text-size-adjust:100%]">
        
        {/* Search (Expandable on Mobile) */}
        <div className="relative group transition-all duration-300 w-10 sm:w-48 md:w-64 focus-within:w-40 sm:focus-within:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none z-10" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950/50 border border-transparent hover:border-white/10 focus:border-cyan-500/50 text-white placeholder-transparent sm:placeholder-slate-500 focus-within:placeholder-slate-500 text-[13px] focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner cursor-pointer focus:cursor-text"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-slate-400 transition-colors z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center justify-end gap-1.5 overflow-x-auto scrollbar-none ml-auto shrink-0">
          {/* Media Format Toggles */}
          <div className="flex items-center bg-slate-950/50 p-1 rounded-xl border border-white/5 shrink-0">
            <button
              onClick={() => setSelectedMediaType('all')}
              className={`px-2 py-1.5 rounded-lg font-medium transition-all shrink-0 text-[11px] ${
                selectedMediaType === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <button
              onClick={() => setSelectedMediaType('article')}
              title="Articles & Posts"
              aria-label="Filter by Articles & Posts"
              className={`p-1.5 rounded-lg transition-all ${
                selectedMediaType === 'article' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedMediaType('video')}
              title="Videos"
              aria-label="Filter by Videos"
              className={`p-1.5 rounded-lg transition-all ${
                selectedMediaType === 'video' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedMediaType('podcast')}
              title="Podcasts"
              aria-label="Filter by Podcasts"
              className={`p-1.5 rounded-lg transition-all ${
                selectedMediaType === 'podcast' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Headphones className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden sm:block w-px h-6 bg-white/10 shrink-0" />

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
        </div>
      </div>

      {/* 2. Platform Filters */}
      <div className="flex items-center gap-1.5">
        <div
          ref={platformContainerRef}
          className={`flex items-center gap-1.5 transition-all duration-200 flex-1 ${
            isExpanded
              ? 'flex-wrap pb-1'
              : 'overflow-x-auto scrollbar-none flex-nowrap pb-1'
          }`}
        >
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border shrink-0 ${
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

        {/* Expand / Collapse Button (Dynamic based on overflow) */}
        {(isOverflowing || isExpanded) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse platform list' : 'Expand all platforms'}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 mb-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 border border-white/10 transition-colors"
          >
            <span className="hidden sm:inline">{isExpanded ? 'Collapse' : 'All'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
