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
import { FeedItem, FeedSource, ContentPlatform, MediaType, TimeRange } from '@/lib/types';
import { Bookmark, Loader2 } from 'lucide-react';

export default function HomePage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'feed' | 'bookmarks'>('feed');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [selectedPlatform, setSelectedPlatform] = useState<ContentPlatform | 'all'>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals & Drawers
  const [activeVideoItem, setActiveVideoItem] = useState<FeedItem | null>(null);
  const [activeReaderItem, setActiveReaderItem] = useState<FeedItem | null>(null);
  const [activePodcastItem, setActivePodcastItem] = useState<FeedItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);

  // Feed Data & Loading
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingSource, setSyncingSource] = useState<FeedSource | null>(null);
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

  const fetchAbortController = useRef<AbortController | null>(null);


  
  const handleAddSourceAndSync = async (newSource: FeedSource) => {
    setSyncingSource(newSource);
    setIsSyncing(true);

    try {
      const res = await fetch(`/api/cron/ingest?sourceId=${encodeURIComponent(newSource.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customSources: [newSource] }),
      });
      const data = await res.json();
      console.log(`[Targeted Ingest] Ingested ${data.ingested || 0} items for ${newSource.name}`);
      
      // Force refresh the frontend cache FIRST
      await fetchFeed(false, true, [newSource]);
      // Then add to state (triggers UI render)
      addSource(newSource);
    } catch (err) {
      console.error('Failed to ingest new source:', err);
      // Ensure source is added even if ingestion fails so user can try again
      addSource(newSource);
    } finally {
      setIsSyncing(false);
      setSyncingSource(null);
    }
  };

  // Sync Feeds (Background Ingestion)

  // Fetch Aggregated Feed Data (Only runs on mount, source changes, or manual refresh)
  const fetchFeed = useCallback(async (isLoadMore = false, forceRefresh = false, extraCustomSources: FeedSource[] = []) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      cursorRef.current = null;
      setHasMore(true);
      // We no longer clear setFeedItems([]) here to prevent UI flickering. 
      // The items will be replaced once the API request completes.
    }
    
    setError(null);
    setFailedSources([]);

    // Cancel any in-flight request to prevent race conditions (only if not loading more)
    if (!isLoadMore && fetchAbortController.current) {
      fetchAbortController.current.abort();
    }
    const abortController = new AbortController();
    if (!isLoadMore) fetchAbortController.current = abortController;

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

      // Pass enabled custom sources (merge with any extra sources passed explicitly)
      const allCustomSources = [
        ...customOnly.filter((s) => s.enabled),
        ...extraCustomSources.filter((s) => s.enabled && !customOnly.some((c) => c.id === s.id)),
      ];
      if (allCustomSources.length > 0) {
        params.set('customSources', JSON.stringify(allCustomSources));
      }
      
      if (selectedPlatform !== 'all') {
        params.set('platform', selectedPlatform);
      }
      if (selectedMediaType !== 'all') {
        params.set('mediaType', selectedMediaType);
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }
      
      if (isLoadMore && cursorRef.current) {
        params.set('cursor', cursorRef.current);
      }
      if (forceRefresh) {
        params.set('forceRefresh', 'true');
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
      if (!isLoadMore && abortController.signal.aborted) return;

      if (data.success && Array.isArray(data.items)) {
        if (isLoadMore) {
          setFeedItems(prev => [...prev, ...data.items]);
        } else {
          setFeedItems(data.items);
        }
        cursorRef.current = data.nextCursor || null;
        setHasMore(!!data.nextCursor);
        setFailedSources(data.failedSources || []);
      } else {
        setError('Unable to load feed streams.');
        if (!isLoadMore) setFeedItems([]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Fetch error:', err);
      setError(err?.message ? `Connection interrupted: ${err.message}` : 'Connection interrupted. Serving cached items.');
      if (!isLoadMore) setFeedItems((current) => (current.length > 0 ? current : []));
    } finally {
      if (!isLoadMore && !abortController.signal.aborted) {
        setIsLoading(false);
      } else if (isLoadMore) {
        setIsLoadingMore(false);
      }
    }
  }, [customOnly, sources, selectedPlatform, selectedMediaType, debouncedSearch]);

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
            merged.sort((a, b) => {
              const tA = new Date(a.publishedAt).getTime();
              const tB = new Date(b.publishedAt).getTime();
              const validA = isNaN(tA) ? 0 : tA;
              const validB = isNaN(tB) ? 0 : tB;
              return validB - validA;
            });
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
  };

  const handleOpenPodcast = (item: FeedItem) => {
    markAsRead(item.id);
    setActiveVideoItem(null);
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

      return true;
    });

    return filtered;
  }, [
    activeTab,
    feedItems,
    bookmarks,
    searchQuery,
    selectedPlatform,
    selectedMediaType,
  ]);

  
  const hasActivePodcastPlayer = Boolean(activePodcastItem);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-cyan-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bookmarkCount={bookmarks.length}
        sourcesCount={mounted ? sources.filter((s) => s.enabled).length : null}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSourcesModal={() => setIsSourcesModalOpen(true)}
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
          viewMode={viewMode}
          setViewMode={setViewMode}
          isLoading={isLoading || isSyncing}
        />

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Feed Cards Grid / List View */}
        {isSyncing && (
          <div className="mb-6 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-3 text-cyan-200 shadow-lg shadow-cyan-950/20 animate-in fade-in duration-300">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            </div>
            <div className="space-y-0.5">
               <p className="text-sm font-semibold text-cyan-300">
                 {syncingSource ? `Loading content from ${syncingSource.name}...` : 'Scraping Live Data...'}
               </p>
               <p className="text-xs opacity-90">
                 {syncingSource
                   ? `Connecting to ${syncingSource.platform === 'rss' ? 'RSS/Podcast' : syncingSource.platform} and loading recent posts into your timeline.`
                   : 'Please wait while we connect to social platforms and fetch the latest content. This can take up to 30 seconds for heavy sources like Instagram.'}
               </p>
            </div>
          </div>
        )}

        <FeedGrid
          items={displayedItems}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={() => fetchFeed(true)}
          viewMode={viewMode}
          isBookmarked={isBookmarked}
          onToggleBookmark={toggleBookmark}
          onOpenVideo={handleOpenVideo}
          onOpenReader={handleOpenReader}
          onOpenPodcast={handleOpenPodcast}
          onResetFilters={() => {
            setSearchQuery('');
            setSelectedPlatform('all');
            setSelectedMediaType('all');
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
        onPlayPodcast={handleOpenPodcast}
      />

      <BottomAudioPlayer
        item={activePodcastItem}
        isOpen={Boolean(activePodcastItem)}
        onClose={() => setActivePodcastItem(null)}
      />

      {/* Add Custom Feed Modal */}
      <AddFeedModal
        existingSources={sources}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSource={(source) => {
          handleAddSourceAndSync(source);
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
