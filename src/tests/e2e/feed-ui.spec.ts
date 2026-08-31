import { test, expect } from '@playwright/test';

test.describe('Feed UI Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the feed API to return some items
    await page.route('/api/feed**', async (route) => {
      const url = new URL(route.request().url());
      const cursor = url.searchParams.get('cursor');

      const mockItems = [
        {
          id: cursor ? `item-page2-${Date.now()}` : `item-page1-${Date.now()}`,
          platform: 'rss',
          mediaType: 'article',
          title: cursor ? 'Loaded More Item' : 'Initial Item',
          url: 'https://example.com',
          author: { name: 'Test Author', avatarUrl: 'https://example.com/avatar.jpg' },
          publishedAt: new Date().toISOString(),
          thumbnailUrl: 'https://example.com/thumb.jpg',
          sourceName: 'Test Source',
          sourceId: 'src1'
        }
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          items: mockItems,
          nextCursor: cursor ? null : new Date().toISOString(), // Only one load more possible
          sourcesCount: 1,
          failedSources: []
        })
      });
    });
  });

  test('should render the feed and handle infinite scroll Load More correctly', async ({ page }) => {
    // Go to home page
    await page.goto('/');

    // Verify initial load
    await expect(page.locator('text=Initial Item').first()).toBeVisible();

    // Scroll down to trigger load more or click the button
    const loadMoreButton = page.locator('button', { hasText: /Load More/i });
    if (await loadMoreButton.isVisible()) {
       await loadMoreButton.click();
    } else {
       // Simulate scrolling down
       await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }

    // Verify loaded more item
    await expect(page.locator('text=Loaded More Item').first()).toBeVisible();
  });

  test('should display loading skeleton initially', async ({ page }) => {
    // Delay the API response to check skeleton
    await page.route('/api/feed**', async (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.goto('/');
    
    // Look for generic loading state - adjust selector based on app's actual skeleton classes
    const loadingIndicators = page.locator('.animate-pulse');
    await expect(loadingIndicators.first()).toBeVisible({ timeout: 2000 });
  });

  test('should render platform empty state correctly', async ({ page }) => {
    // Mock empty response for Reddit
    await page.route('/api/feed?platform=reddit**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          items: [],
          nextCursor: null,
          sourcesCount: 0,
          failedSources: []
        })
      });
    });

    await page.goto('/');
    
    // Click Reddit tab
    const redditTab = page.locator('button', { hasText: 'Reddit' });
    if (await redditTab.isVisible()) {
      await redditTab.click();
      
      // Look for empty state text
      await expect(page.locator('text=No sources found for this platform')).toBeVisible();
    }
  });
});
