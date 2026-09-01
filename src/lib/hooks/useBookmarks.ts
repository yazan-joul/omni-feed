'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeedItem } from '../types';
import { useAuth } from './useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { dbClient } from '../firebase/client';
import { trackEvent } from '../analytics';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<FeedItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (user && dbClient) {
          const userRef = doc(dbClient, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.bookmarks) setBookmarks(data.bookmarks);
            if (data.readIds) setReadIds(data.readIds);
          }
        } else {
          const saved = localStorage.getItem('omnifeed_bookmarks');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setBookmarks(parsed);
            } else {
              setBookmarks([]);
            }
          } else {
            setBookmarks([]);
          }
          const savedRead = localStorage.getItem('omnifeed_read_ids');
          if (savedRead) {
            const parsedRead = JSON.parse(savedRead);
            if (Array.isArray(parsedRead)) {
              setReadIds(parsedRead);
            } else {
              setReadIds([]);
            }
          } else {
            setReadIds([]);
          }
        }
      } catch (e) {
        console.error("Error loading bookmarks/read state", e);
      }
      setMounted(true);
    };
    loadData();
  }, [user]);

  // Sync to appropriate storage
  const syncBookmarks = async (newBookmarks: FeedItem[]) => {
    if (user && dbClient) {
      try {
        const userRef = doc(dbClient, 'users', user.uid);
        await setDoc(userRef, { bookmarks: newBookmarks }, { merge: true });
      } catch (e: any) {
        console.error("Error syncing bookmarks:", e);
        if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota')) {
          alert("Firebase daily quota reached! Bookmark saved locally.");
        }
      }
    } else {
      localStorage.setItem('omnifeed_bookmarks', JSON.stringify(newBookmarks));
    }
  };

  const syncReadIds = async (newReadIds: string[]) => {
    if (user && dbClient) {
      try {
        const userRef = doc(dbClient, 'users', user.uid);
        await setDoc(userRef, { readIds: newReadIds }, { merge: true });
      } catch (e: any) {
        console.error("Error syncing read status:", e);
      }
    } else {
      localStorage.setItem('omnifeed_read_ids', JSON.stringify(newReadIds));
    }
  };

  const toggleBookmark = (item: FeedItem) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === item.id);
      let updated: FeedItem[];
      if (exists) {
        updated = prev.filter((b) => b.id !== item.id);
        trackEvent('bookmark_removed', {
          item_id: item.id,
          platform: item.platform,
        });
      } else {
        updated = [item, ...prev];
        trackEvent('bookmark_added', {
          item_id: item.id,
          platform: item.platform,
          media_type: item.mediaType,
        });
      }
      syncBookmarks(updated);
      return updated;
    });
  };

  const isBookmarked = useCallback((id: string): boolean => {
    return bookmarks.some((b) => b.id === id);
  }, [bookmarks]);

  const markAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const updated = [...readIds, id].slice(-2000); // keep last 2000
    setReadIds(updated);
    syncReadIds(updated);
  };

  const markAsUnread = (id: string) => {
    const updated = readIds.filter((readId) => readId !== id);
    setReadIds(updated);
    syncReadIds(updated);
  };

  const toggleRead = (id: string) => {
    if (readIds.includes(id)) {
      markAsUnread(id);
    } else {
      markAsRead(id);
    }
  };

  const markAllAsRead = (ids: string[]) => {
    const combined = Array.from(new Set([...readIds, ...ids])).slice(-2000);
    setReadIds(combined);
    syncReadIds(combined);
  };

  const clearReadHistory = () => {
    setReadIds([]);
    syncReadIds([]);
  };

  const isRead = useCallback((id: string): boolean => {
    return readIds.includes(id);
  }, [readIds]);

  return {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    markAsRead,
    markAsUnread,
    toggleRead,
    markAllAsRead,
    clearReadHistory,
    isRead,
    readCount: readIds.length,
    mounted,
  };
}
