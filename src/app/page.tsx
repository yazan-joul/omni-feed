'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const [selectedPlatform, setSelectedPlatform] = useState<ContentPlatform | 'all'>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType | 'all'>('all');
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

  // Fetch Aggregated Feed Data (Only runs on mount, source changes, or manual refresh)
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
  }, [customOnly, sources]);

  useEffect(() => {
    if (mounted) {
      fetchFeed();
    }
  }, [fetchFeed, mounted]);

  const handleRefreshPlatform = async (platform: ContentPlatform) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/feed?platform=${platform}&forceRefresh=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setFeedItems((prev) => {
            const others = prev.filter((i) => i.platform !== platform);
            const merged = [...others, ...data.items];
            merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            return merged;
          });
          if (data.failedSources) {
            setFailedSources((prev) => Array.from(new Set([...prev, ...data.failedSources])));
          }
        }
      }
    } catch (err) {
      console.error('Error refreshing platform:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Instant 0ms In-Memory Filtering (Client-side useMemo)
  const displayedItems = useMemo(() => {
    const rawItems = activeTab === 'feed' ? feedItems : bookmarks;

    const filtered = rawItems.filter((item) => {
      // 1. Search Query Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSummary = item.summary?.toLowerCase().includes(q);
        const matchesAuthor = item.author.name.toLowerCase().includes(q);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesAuthor && !matchesTags) {
          return false;
        }
      }

      // 2. Platform Filter
      if (selectedPlatform !== 'all' && item.platform !== selectedPlatform) {
        return false;
      }

      // 3. Media Type Filter
      if (selectedMediaType !== 'all' && item.mediaType !== selectedMediaType) {
        return false;
      }

      // 4. Unread Only Filter
      if (unreadOnly && isRead(item.id)) {
        return false;
      }

      return true;
    });

    // 5. Per-Source Capping
    if (limitPerSource > 0) {
      const counts: Record<string, number> = {};
      return filtered.filter((item) => {
        counts[item.sourceId] = (counts[item.sourceId] || 0) + 1;
        return counts[item.sourceId] <= limitPerSource;
      });
    }

    return filtered;
  }, [
    activeTab,
    feedItems,
    bookmarks,
    searchQuery,
    selectedPlatform,
    selectedMediaType,
    unreadOnly,
    limitPerSource,
    isRead,
  ]);

  const handleMarkAllVisibleAsRead = () => {
    markAllAsRead(displayedItems.map((i) => i.id));
  };
  
  const hasActivePodcastPlayer = Boolean(activePodcastItem);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-cyan-600 selection:text-white">
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
        {/* Filter & Search Bar */}
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          selectedMediaType={selectedMediaType}
          setSelectedMediaType={setSelectedMediaType}
          limitPerSource={limitPerSource}
          setLimitPerSource={setLimitPerSource}
          unreadOnly={unreadOnly}
          setUnreadOnly={setUnreadOnly}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isLoading={isLoading}
          onRefresh={fetchFeed}
          onRefreshPlatform={handleRefreshPlatform}
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
          onMarkAllAsRead={markAllAsRead}
          onOpenVideo={handleOpenVideo}
          onOpenReader={handleOpenReader}
          onOpenPodcast={handleOpenPodcast}
          onResetFilters={() => {
            setSearchQuery('');
            setSelectedPlatform('all');
            setSelectedMediaType('all');
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
        }}
        onImportSources={(imported) => {
          importSources(imported);
        }}
      />

      {/* Manage Sources Modal */}
      <SourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        sources={sources}
        onToggleSource={(id) => {
          toggleSource(id);
        }}
        onRemoveSource={(id) => {
          removeSource(id);
        }}
        onResetSources={() => {
          resetToDefault();
        }}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onImportSources={(imported) => {
          importSources(imported);
        }}
      />

      {/* Minimal Footer */}
      <footer className="w-full border-t border-white/5 py-4 px-4 text-center text-[11px] text-slate-500">
        <p>OmniFeed • Unified Stream Aggregator</p>
      </footer>
    </div>
  );
}
