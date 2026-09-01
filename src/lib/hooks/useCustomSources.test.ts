import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomSources } from './useCustomSources';
import * as analytics from '../analytics';

// Mock useAuth
vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: null, loading: false })
}));

describe('useCustomSources Tracking', () => {
  let storage: Record<string, string> = {};

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storage[key]; }),
      clear: vi.fn(() => { storage = {}; }),
    });
    vi.restoreAllMocks();
  });

  it('should track stream_added event when a source is added', () => {
    const trackSpy = vi.spyOn(analytics, 'trackEvent');
    const { result } = renderHook(() => useCustomSources());

    act(() => {
      result.current.addSource({
        id: 'custom-yt-1',
        name: 'Tech Channel',
        platform: 'youtube',
        url: 'https://youtube.com/c/tech',
        enabled: true,
        isCustom: true,
      });
    });

    expect(trackSpy).toHaveBeenCalledWith('stream_added', expect.objectContaining({
      platform: 'youtube',
      stream_id: 'custom-yt-1',
      stream_name: 'Tech Channel',
      custom_streams_count: 1,
    }));
  });

  it('should track stream_removed event when a source is removed', () => {
    const trackSpy = vi.spyOn(analytics, 'trackEvent');
    const { result } = renderHook(() => useCustomSources());

    act(() => {
      result.current.addSource({
        id: 'custom-rss-1',
        name: 'Custom RSS',
        platform: 'rss',
        url: 'https://example.com/rss',
        enabled: true,
        isCustom: true,
      });
    });

    act(() => {
      result.current.removeSource('custom-rss-1');
    });

    expect(trackSpy).toHaveBeenCalledWith('stream_removed', expect.objectContaining({
      stream_id: 'custom-rss-1',
      platform: 'rss',
    }));
  });
});
