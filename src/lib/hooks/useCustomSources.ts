'use client';

import { useState, useEffect, useMemo } from 'react';
import { FeedSource } from '../types';
import { DEFAULT_FEED_SOURCES } from '../config/default-sources';

export function useCustomSources() {
  const [sources, setSources] = useState<FeedSource[]>(DEFAULT_FEED_SOURCES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedSources = localStorage.getItem('omnifeed_sources');
      if (savedSources) {
        const parsed = JSON.parse(savedSources);
        if (Array.isArray(parsed)) {
          setSources(parsed);
        }
      }
    } catch {}
    setMounted(true);
  }, []);

  const saveSources = (newSources: FeedSource[]) => {
    setSources(newSources);
    try {
      localStorage.setItem('omnifeed_sources', JSON.stringify(newSources));
    } catch {}
  };

  const addSource = (newSource: FeedSource) => {
    const updated = [newSource, ...sources];
    saveSources(updated);
  };

  const removeSource = (id: string) => {
    const updated = sources.filter((s) => s.id !== id);
    saveSources(updated);
  };

  const toggleSource = (id: string) => {
    const updated = sources.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    saveSources(updated);
  };

  const resetToDefault = () => {
    saveSources(DEFAULT_FEED_SOURCES);
  };

  const importSources = (newSources: FeedSource[]): number => {
    const existingUrls = new Set(sources.map((s) => s.url.toLowerCase().trim()));
    const toAdd = newSources.filter((s) => !existingUrls.has(s.url.toLowerCase().trim()));
    const updated = [...toAdd, ...sources];
    saveSources(updated);
    return toAdd.length;
  };

  const customOnly = useMemo(() => sources.filter((s) => s.isCustom), [sources]);

  return {
    sources,
    customOnly,
    addSource,
    importSources,
    removeSource,
    toggleSource,
    resetToDefault,
    mounted,
  };
}
