import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollHeader } from './useScrollHeader';

describe('useScrollHeader', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize as visible when scrollY is 0', () => {
    const { result } = renderHook(() => useScrollHeader());
    expect(result.current.isVisible).toBe(true);
  });

  it('should hide header when scrolling down beyond threshold', () => {
    const { result } = renderHook(() => useScrollHeader({ threshold: 5, minScroll: 20 }));

    act(() => {
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('should show header when scrolling up', () => {
    const { result } = renderHook(() => useScrollHeader({ threshold: 5, minScroll: 20 }));

    act(() => {
      window.scrollY = 150;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.isVisible).toBe(false);

    act(() => {
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.isVisible).toBe(true);
  });

  it('should remain visible when near the top of the page', () => {
    const { result } = renderHook(() => useScrollHeader({ threshold: 5, minScroll: 50 }));

    act(() => {
      window.scrollY = 30;
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current.isVisible).toBe(true);
  });
});
