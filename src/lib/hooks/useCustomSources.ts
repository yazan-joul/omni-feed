'use client';

import { useState, useEffect, useMemo } from 'react';
import { FeedSource } from '../types';
import { DEFAULT_FEED_SOURCES } from '../config/default-sources';
import { useAuth } from './useAuth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { dbClient } from '../firebase/client';

export function useCustomSources() {
  const { user, loading: authLoading } = useAuth();
  const [sources, setSources] = useState<FeedSource[]>(DEFAULT_FEED_SOURCES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Don't attempt to load sources until Firebase Auth finishes its initial check
    if (authLoading) return;

    let unsubscribe: (() => void) | undefined;

    const loadData = () => {
      try {
        if (user && dbClient) {
          const userRef = doc(dbClient, 'users', user.uid);
          unsubscribe = onSnapshot(userRef, (snap) => {
            if (snap.exists() && snap.data().sources) {
              setSources(snap.data().sources);
            }
            setMounted(true);
          }, (err) => {
            console.error("Error listening to sources", err);
            setMounted(true);
          });
        } else {
          const savedSources = localStorage.getItem('omnifeed_sources');
          if (savedSources) {
            const parsed = JSON.parse(savedSources);
            if (Array.isArray(parsed)) {
              setSources(parsed);
            }
          }
          setMounted(true);
        }
      } catch (e) {
        console.error("Error loading sources", e);
        setMounted(true);
      }
    };
    
    loadData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, authLoading]);

  // Use a helper function that takes the updated sources so we can save to Firestore
  const persistSources = async (newSources: FeedSource[]) => {
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
    setSources(prev => {
      const updated = [newSource, ...prev];
      persistSources(updated);
      return updated;
    });
  };

  const removeSource = (id: string) => {
    setSources(prev => {
      const updated = prev.filter((s) => s.id !== id);
      persistSources(updated);
      return updated;
    });
  };

  const toggleSource = (id: string) => {
    setSources(prev => {
      const updated = prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
      persistSources(updated);
      return updated;
    });
  };

  const resetToDefault = () => {
    setSources(DEFAULT_FEED_SOURCES);
    persistSources(DEFAULT_FEED_SOURCES);
  };

  const importSources = (newSources: FeedSource[]): number => {
    let addedCount = 0;
    setSources(prev => {
      const existingUrls = new Set(prev.map((s) => s.url.toLowerCase().trim()));
      const toAdd = newSources.filter((s) => !existingUrls.has(s.url.toLowerCase().trim()));
      addedCount = toAdd.length;
      const updated = [...toAdd, ...prev];
      persistSources(updated);
      return updated;
    });
    return addedCount;
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
