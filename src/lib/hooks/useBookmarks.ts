'use client';

import { useState, useEffect } from 'react';
import { FeedItem } from '../types';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<FeedItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('omnifeed_bookmarks');
      if (saved) setBookmarks(JSON.parse(saved));
      
      const savedRead = localStorage.getItem('omnifeed_read_ids');
      if (savedRead) setReadIds(JSON.parse(savedRead));
    } catch {
      // Ignore storage read errors
    }
    setMounted(true);
  }, []);

  const toggleBookmark = (item: FeedItem) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === item.id);
      let updated: FeedItem[];
      if (exists) {
        updated = prev.filter((b) => b.id !== item.id);
      } else {
        updated = [item, ...prev];
      }
      try {
        localStorage.setItem('omnifeed_bookmarks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isBookmarked = (id: string): boolean => {
    return bookmarks.some((b) => b.id === id);
  };

  const markAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const updated = [...readIds, id];
    setReadIds(updated);
    try {
      localStorage.setItem('omnifeed_read_ids', JSON.stringify(updated));
    } catch {}
  };

  const isRead = (id: string): boolean => {
    return readIds.includes(id);
  };

  return {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    markAsRead,
    isRead,
    mounted,
  };
}
