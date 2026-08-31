'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeedItem } from '../types';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<FeedItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('omnifeed_bookmarks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setBookmarks(parsed);
      }
      
      const savedRead = localStorage.getItem('omnifeed_read_ids');
      if (savedRead) {
        const parsedRead = JSON.parse(savedRead);
        if (Array.isArray(parsedRead)) setReadIds(parsedRead);
      }
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

  const isBookmarked = useCallback((id: string): boolean => {
    return bookmarks.some((b) => b.id === id);
  }, [bookmarks]);

  const markAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const updated = [...readIds, id].slice(-2000); // keep last 2000
    setReadIds(updated);
    try {
      localStorage.setItem('omnifeed_read_ids', JSON.stringify(updated));
    } catch {}
  };

  const markAsUnread = (id: string) => {
    const updated = readIds.filter((readId) => readId !== id);
    setReadIds(updated);
    try {
      localStorage.setItem('omnifeed_read_ids', JSON.stringify(updated));
    } catch {}
  };

  const toggleRead = (id: string) => {
    if (readIds.includes(id)) {
      markAsUnread(id);
    } else {
      markAsRead(id);
    }
  };

  const markAllAsRead = (ids: string[]) => {
    const combined = Array.from(new Set([...readIds, ...ids]));
    setReadIds(combined);
    try {
      localStorage.setItem('omnifeed_read_ids', JSON.stringify(combined));
    } catch {}
  };

  const clearReadHistory = () => {
    setReadIds([]);
    try {
      localStorage.removeItem('omnifeed_read_ids');
    } catch {}
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
