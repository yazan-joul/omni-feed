'use client';

import { useState, useEffect, useRef } from 'react';

interface UseScrollHeaderOptions {
  threshold?: number;
  minScroll?: number;
}

export function useScrollHeader(options: UseScrollHeaderOptions = {}) {
  const { threshold = 10, minScroll = 60 } = options;
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      // Always show when near the very top of the page
      if (currentScrollY <= minScroll) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Scrolling Down significantly -> Hide header
      if (diff > threshold) {
        setIsVisible(false);
        lastScrollY.current = currentScrollY;
      }
      // Scrolling Up significantly -> Show header
      else if (diff < -threshold) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold, minScroll]);

  return { isVisible };
}
