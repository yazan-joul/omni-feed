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
        setSources(JSON.parse(savedSources));
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

  const customOnly = useMemo(() => sources.filter((s) => s.isCustom), [sources]);

  return {
    sources,
    customOnly,
    addSource,
    removeSource,
    toggleSource,
    resetToDefault,
    mounted,
  };
}
