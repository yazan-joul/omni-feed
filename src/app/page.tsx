'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { FilterBar } from '@/components/FilterBar';
import { FeedGrid } from '@/components/FeedGrid';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { ReaderDrawer } from '@/components/ReaderDrawer';
import { AddFeedModal } from '@/components/AddFeedModal';
import { SourcesModal } from '@/components/SourcesModal';
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { useCustomSources } from '@/lib/hooks/useCustomSources';
import { FeedItem, ContentPlatform, MediaType } from '@/lib/types';
import { Sparkles, Radio, Bookmark, AlertCircle, RefreshCw } from 'lucide-react';

export default function HomePage() {
  // State: Navigation tabs
  const [activeTab, setActiveTab] = useState<'feed' | 'bookmarks'>('feed');

  // State: Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlatform, setSelectedPlatform] = useState<ContentPlatform | 'all'>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // State: Modals & Drawers
  const [activeVideoItem, setActiveVideoItem] = useState<FeedItem | null>(null);
  const [activeReaderItem, setActiveReaderItem] = useState<FeedItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // State: Feed Data & Loading
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hooks: Bookmarks & Custom Sources
  const { bookmarks, toggleBookmark, isBookmarked, markAsRead, isRead } = useBookmarks();
  const {
    sources,
    customOnly,
    addSource,
    removeSource,
    toggleSource,
    resetToDefault,
  } = useCustomSources();

  // Toggle Dark/Light Theme
  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
      }
      return next;
    });
  };

  // Fetch Aggregated Feed Data
  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedPlatform && selectedPlatform !== 'all') params.set('platform', selectedPlatform);
      if (selectedMediaType && selectedMediaType !== 'all') params.set('mediaType', selectedMediaType);
      if (searchQuery) params.set('search', searchQuery);

      // Pass enabled custom sources
      if (customOnly.length > 0) {
        params.set('customSources', JSON.stringify(customOnly));
      }

      const res = await fetch(`/api/feed?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.items)) {
        setFeedItems(data.items);
      } else {
        setError('Unable to load feed streams.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Connection interrupted. Serving cached items.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedPlatform, selectedMediaType, searchQuery, customOnly]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Open Video Handler
  const handleOpenVideo = (item: FeedItem) => {
    markAsRead(item.id);
    setActiveVideoItem(item);
  };

  // Open Reader Handler
  const handleOpenReader = (item: FeedItem) => {
    markAsRead(item.id);
    setActiveReaderItem(item);
  };

  // Filter Bookmarks
  const filteredBookmarks = bookmarks.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || item.tags.some((t) => t.toLowerCase() === selectedCategory.toLowerCase());
    const matchesPlatform =
      selectedPlatform === 'all' || item.platform === selectedPlatform;
    const matchesMediaType =
      selectedMediaType === 'all' || item.mediaType === selectedMediaType;

    return matchesSearch && matchesCategory && matchesPlatform && matchesMediaType;
  });

  const displayedItems = activeTab === 'feed' ? feedItems : filteredBookmarks;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-violet-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bookmarkCount={bookmarks.length}
        sourcesCount={sources.filter((s) => s.enabled).length}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSourcesModal={() => setIsSourcesModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Hero Banner / Feed Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              {activeTab === 'feed' ? (
                <>
                  <span>Unified Multi-Stream</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </>
              ) : (
                <>
                  <Bookmark className="w-7 h-7 text-violet-400 fill-violet-400/20" />
                  <span>Saved Bookmarks</span>
                </>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {activeTab === 'feed'
                ? 'Aggregating YouTube tech creators, RSS publications, Substacks, and developer feeds in real time.'
                : `You have saved ${bookmarks.length} articles and videos for offline reading.`}
            </p>
          </div>

          {/* Quick stats pills */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              <span>{feedItems.length} Stories Ingested</span>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" /> + Custom Stream
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          selectedMediaType={selectedMediaType}
          setSelectedMediaType={setSelectedMediaType}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isLoading={isLoading}
          onRefresh={fetchFeed}
        />

        {/* Feed Cards Grid / List View */}
        <FeedGrid
          items={displayedItems}
          isLoading={isLoading}
          viewMode={viewMode}
          isBookmarked={isBookmarked}
          isRead={isRead}
          onToggleBookmark={toggleBookmark}
          onOpenVideo={handleOpenVideo}
          onOpenReader={handleOpenReader}
          onResetFilters={() => {
            setSearchQuery('');
            setSelectedCategory('All');
            setSelectedPlatform('all');
            setSelectedMediaType('all');
          }}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />
      </main>

      {/* Embedded Video Modal */}
      <VideoPlayerModal
        item={activeVideoItem}
        isOpen={Boolean(activeVideoItem)}
        onClose={() => setActiveVideoItem(null)}
        isBookmarked={activeVideoItem ? isBookmarked(activeVideoItem.id) : false}
        onToggleBookmark={toggleBookmark}
      />

      {/* Reader Drawer */}
      <ReaderDrawer
        item={activeReaderItem}
        isOpen={Boolean(activeReaderItem)}
        onClose={() => setActiveReaderItem(null)}
        isBookmarked={activeReaderItem ? isBookmarked(activeReaderItem.id) : false}
        onToggleBookmark={toggleBookmark}
      />

      {/* Add Custom Feed Modal */}
      <AddFeedModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSource={(source) => {
          addSource(source);
          fetchFeed();
        }}
      />

      {/* Manage Sources Modal */}
      <SourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        sources={sources}
        onToggleSource={(id) => {
          toggleSource(id);
          fetchFeed();
        }}
        onRemoveSource={(id) => {
          removeSource(id);
          fetchFeed();
        }}
        onResetSources={() => {
          resetToDefault();
          fetchFeed();
        }}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 px-4 text-center text-xs text-slate-500">
        <p>OmniFeed • Spec-Driven AI Hackathon Project • Built with Antigravity, Next.js 15, BMAD & Superpowers</p>
      </footer>
    </div>
  );
}
