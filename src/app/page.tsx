'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { FilterBar } from '@/components/FilterBar';
import { FeedGrid } from '@/components/FeedGrid';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { ReaderDrawer } from '@/components/ReaderDrawer';
import { BottomAudioPlayer } from '@/components/BottomAudioPlayer';
import { AddFeedModal } from '@/components/AddFeedModal';
import { SourcesModal } from '@/components/SourcesModal';
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { useCustomSources } from '@/lib/hooks/useCustomSources';
import { DEFAULT_FEED_SOURCES } from '@/lib/config/default-sources';
import { FeedItem, ContentPlatform, MediaType, TimeRange } from '@/lib/types';
import { Bookmark } from 'lucide-react';

export default function HomePage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'feed' | 'bookmarks'>('feed');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlatform, setSelectedPlatform] = useState<ContentPlatform | 'all'>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType | 'all'>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [limitPerSource, setLimitPerSource] = useState<number>(0); // 0 = all
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals & Drawers
  const [activeVideoItem, setActiveVideoItem] = useState<FeedItem | null>(null);
  const [activeReaderItem, setActiveReaderItem] = useState<FeedItem | null>(null);
  const [activePodcastItem, setActivePodcastItem] = useState<FeedItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Feed Data & Loading
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedSources, setFailedSources] = useState<string[]>([]);

  // Bookmarks & Custom Sources Hooks
  const {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    markAsRead,
    toggleRead,
    markAllAsRead,
    isRead,
  } = useBookmarks();

  const {
    sources,
    customOnly,
    addSource,
    importSources,
    removeSource,
    toggleSource,
    resetToDefault,
    mounted,
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

  const fetchAbortController = useRef<AbortController | null>(null);

  // Fetch Aggregated Feed Data
  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFailedSources([]);

    // Cancel any in-flight request to prevent race conditions
    if (fetchAbortController.current) {
      fetchAbortController.current.abort();
    }
    const abortController = new AbortController();
    fetchAbortController.current = abortController;

    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedPlatform && selectedPlatform !== 'all') params.set('platform', selectedPlatform);
      if (selectedMediaType && selectedMediaType !== 'all') params.set('mediaType', selectedMediaType);
      if (searchQuery) params.set('search', searchQuery);

      // Pass disabled or removed default source IDs
      const activeDefaultIds = sources.filter((s) => !s.isCustom && s.enabled).map((s) => s.id);
      const disabledOrRemovedDefaultIds = DEFAULT_FEED_SOURCES.filter(
        (ds) => !activeDefaultIds.includes(ds.id)
      ).map((ds) => ds.id);

      if (disabledOrRemovedDefaultIds.length > 0) {
        params.set('disabledDefaults', JSON.stringify(disabledOrRemovedDefaultIds));
      }

      // Pass enabled custom sources
      if (customOnly.length > 0) {
        params.set('customSources', JSON.stringify(customOnly.filter((s) => s.enabled)));
      }

      const res = await fetch(`/api/feed?${params.toString()}`, {
        signal: abortController.signal
      });

      if (!res.ok) {
        const text = await res.text();
        const serverMessage = text ? text.slice(0, 160).replace(/\s+/g, ' ').trim() : 'Unknown error';
        throw new Error(`Feed request failed (${res.status}): ${serverMessage}`);
      }

      const responseText = await res.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from feed API.');
      }

      let data: any;
      const maybeJson = responseText.trim();
      if (maybeJson.startsWith('{') || maybeJson.startsWith('[')) {
        try {
          data = JSON.parse(maybeJson);
        } catch {
          throw new Error('Feed API response was not valid JSON.');
        }
      } else {
        throw new Error(`Feed API returned non-JSON content: ${maybeJson.slice(0, 80)}`);
      }

      // Ensure this is still the most recent request
      if (abortController.signal.aborted) return;

      if (data.success && Array.isArray(data.items)) {
        setFeedItems(data.items);
        setFailedSources(data.failedSources || []);
      } else {
        setError('Unable to load feed streams.');
        setFeedItems([]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Fetch error:', err);
      setError(err?.message ? `Connection interrupted: ${err.message}` : 'Connection interrupted. Serving cached items.');
      setFeedItems((current) => (current.length > 0 ? current : []));
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [selectedCategory, selectedPlatform, selectedMediaType, searchQuery, customOnly, sources]);

  useEffect(() => {
    if (mounted) {
      fetchFeed();
    }
  }, [fetchFeed, mounted]);

  // Handlers
  const handleOpenVideo = (item: FeedItem) => {
    markAsRead(item.id);
    setActiveVideoItem(item);
  };

  const handleOpenReader = (item: FeedItem) => {
    markAsRead(item.id);
    setActiveReaderItem(item);
    setActivePodcastItem(null);
  };

  const handleOpenPodcast = (item: FeedItem) => {
    markAsRead(item.id);
    setActiveVideoItem(null);
    setActiveReaderItem(null);
    setActivePodcastItem(item);
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

  // Base raw items for active tab
  const rawItems = activeTab === 'feed' ? feedItems : filteredBookmarks;

  // Process items: Time Range Filter -> Unread Only -> Per-Source Capping
  let displayedItems = rawItems;

  // 1. Time Range Filter
  if (timeRange !== 'all') {
    const msMap: Record<TimeRange, number> = {
      '24h': 24 * 3600 * 1000,
      '3d': 3 * 24 * 3600 * 1000,
      '7d': 7 * 24 * 3600 * 1000,
      'all': 0,
    };
    const cutoff = Date.now() - msMap[timeRange];
    displayedItems = displayedItems.filter((item) => {
      const pubTime = new Date(item.publishedAt).getTime();
      return !isNaN(pubTime) && pubTime >= cutoff;
    });
  }

  // 2. Unread Only Filter
  if (unreadOnly) {
    displayedItems = displayedItems.filter((item) => !isRead(item.id));
  }

  // 3. Per-Source Limit
  if (limitPerSource > 0) {
    const counts: Record<string, number> = {};
    displayedItems = displayedItems.filter((item) => {
      counts[item.sourceId] = (counts[item.sourceId] || 0) + 1;
      return counts[item.sourceId] <= limitPerSource;
    });
  }

  const handleMarkAllVisibleAsRead = () => {
    markAllAsRead(displayedItems.map((i) => i.id));
  };
  
  const hasActivePodcastPlayer = Boolean(activePodcastItem);

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
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 sm:py-8 space-y-6 ${hasActivePodcastPlayer ? 'pb-36 md:pb-32' : ''}`}>
        {/* Hero Banner / Feed Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              {activeTab === 'feed' ? (
                <>
                  <span>Unified Stream</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-violet-400 fill-violet-400/20" />
                  <span>Bookmarks</span>
                </>
              )}
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              ({displayedItems.length} {displayedItems.length === 1 ? 'item' : 'items'})
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{sources.filter((s) => s.enabled).length} active streams</span>
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
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          limitPerSource={limitPerSource}
          setLimitPerSource={setLimitPerSource}
          unreadOnly={unreadOnly}
          setUnreadOnly={setUnreadOnly}
          onMarkAllAsRead={handleMarkAllVisibleAsRead}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isLoading={isLoading}
          onRefresh={fetchFeed}
        />

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Feed Cards Grid / List View */}
        <FeedGrid
          items={displayedItems}
          isLoading={isLoading}
          viewMode={viewMode}
          isBookmarked={isBookmarked}
          isRead={isRead}
          onToggleBookmark={toggleBookmark}
          onToggleRead={toggleRead}
          onOpenVideo={handleOpenVideo}
          onOpenReader={handleOpenReader}
          onOpenPodcast={handleOpenPodcast}
          onResetFilters={() => {
            setSearchQuery('');
            setSelectedCategory('All');
            setSelectedPlatform('all');
            setSelectedMediaType('all');
            setTimeRange('all');
            setLimitPerSource(0);
            setUnreadOnly(false);
          }}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          failedSources={failedSources}
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

      <BottomAudioPlayer
        item={activePodcastItem}
        isOpen={Boolean(activePodcastItem)}
        onClose={() => setActivePodcastItem(null)}
      />

      {/* Add Custom Feed Modal */}
      <AddFeedModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSource={(source) => {
          addSource(source);
          fetchFeed();
        }}
        onImportSources={(imported) => {
          importSources(imported);
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
        onImportSources={(imported) => {
          importSources(imported);
          fetchFeed();
        }}
      />

      {/* Minimal Footer */}
      <footer className="w-full border-t border-white/5 py-4 px-4 text-center text-[11px] text-slate-500">
        <p>OmniFeed • Unified Stream Aggregator</p>
      </footer>
    </div>
  );
}
