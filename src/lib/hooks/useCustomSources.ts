'use client';

import { useState, useEffect, useMemo } from 'react';
import { FeedSource } from '../types';
import { DEFAULT_FEED_SOURCES } from '../config/default-sources';
import { useAuth } from './useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { dbClient } from '../firebase/client';

export function useCustomSources() {
  const { user } = useAuth();
  const [sources, setSources] = useState<FeedSource[]>(DEFAULT_FEED_SOURCES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user && dbClient) {
          const userRef = doc(dbClient, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists() && snap.data().sources) {
            setSources(snap.data().sources);
          }
        } else {
          const savedSources = localStorage.getItem('omnifeed_sources');
          if (savedSources) {
            const parsed = JSON.parse(savedSources);
            if (Array.isArray(parsed)) {
              setSources(parsed);
            }
          }
        }
      } catch (e) {
        console.error("Error loading sources", e);
      }
      setMounted(true);
    };
    loadData();
  }, [user]);

  const saveSources = async (newSources: FeedSource[]) => {
    setSources(newSources);
    try {
      if (user && dbClient) {
        const userRef = doc(dbClient, 'users', user.uid);
        await setDoc(userRef, { sources: newSources }, { merge: true });
      } else {
        localStorage.setItem('omnifeed_sources', JSON.stringify(newSources));
      }
    } catch (e: any) {
      console.error("Error saving sources", e);
      if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota')) {
        alert("Firebase daily quota reached! Data will be saved locally and won't sync to the cloud until tomorrow.");
      } else if (!user) {
        alert("Local storage is full. Please login to save more sources to the cloud.");
      }
    }
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
