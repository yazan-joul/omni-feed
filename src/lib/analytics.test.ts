import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackEvent } from './analytics';

describe('Analytics Utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should call window.gtag with correct event and params when gtag is available', () => {
    const mockGtag = vi.fn();
    (window as any).gtag = mockGtag;

    trackEvent('test_event', { platform: 'youtube' });

    expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', { platform: 'youtube' });
  });

  it('should gracefully handle missing window.gtag without throwing', () => {
    delete (window as any).gtag;

    expect(() => {
      trackEvent('test_event', { platform: 'youtube' });
    }).not.toThrow();
  });
});
