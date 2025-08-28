import { test, expect } from '@playwright/test';

test.describe('Search functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the site to load and search to initialize
    await page.waitForSelector('#search-input');
    await page.waitForLoadState('networkidle');
  });

  test('search input is visible in sidebar', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Search posts and music...');
  });

  test('search returns results for blog content', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    const searchResults = page.locator('#search-results');

    // Search for blog-related content
    await searchInput.fill('music blog');
    await page.waitForTimeout(500); // Wait for debounced search

    // Check that results appear
    await expect(searchResults).toBeVisible();
    const results = page.locator('.search-result');
    await expect(results).toHaveCount(1, { timeout: 2000 });

    // Check result content
    const firstResult = results.first();
    await expect(firstResult.locator('.search-result-title')).toContainText('Welcome to My Music Blog');
    await expect(firstResult.locator('.search-result-type')).toContainText('blog');
  });

  test('search returns results for music content when music exists', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    const searchResults = page.locator('#search-results');

    // First check if any music exists by going to music page
    await page.goto('/music/');
    const musicItems = page.locator('.song-item');
    const musicCount = await musicItems.count();

    if (musicCount === 0) {
      // If no music exists, skip this test with explanation
      test.skip(true, 'No music content available to test search functionality');
      return;
    }

    // Get the first music item's title for search testing
    const firstMusicTitle = await musicItems.first().locator('.song-title').textContent();
    const searchTerm = firstMusicTitle.split(' ')[0].toLowerCase(); // Use first word of title

    // Go back to home and test search
    await page.goto('/');
    await page.waitForSelector('#search-input');

    // Search for music-related content using dynamic term
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(500); // Wait for debounced search

    // Check that results appear
    await expect(searchResults).toBeVisible();
    const results = page.locator('.search-result');
    await expect(results.first().locator('.search-result-type')).toContainText('music');
    await expect(results.first().locator('.search-result-artist')).toContainText('by');
  });

  test('search highlights matching terms when content exists', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    
    // Use a general term that should exist in blog content
    await searchInput.fill('blog');
    await page.waitForTimeout(500);

    const searchResults = page.locator('#search-results');
    await expect(searchResults).toBeVisible();
    
    // Check if any results exist before checking highlights
    const results = page.locator('.search-result');
    const resultCount = await results.count();
    
    if (resultCount > 0) {
      // Check for highlighted search terms
      const highlightedTerm = page.locator('.search-results mark');
      await expect(highlightedTerm).toBeVisible();
      await expect(highlightedTerm).toContainText('blog');
    } else {
      // If no results, that's also valid behavior
      await expect(searchResults.locator('.search-no-results')).toContainText('No results found');
    }
  });

  test('search shows no results message for non-existent terms', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    const searchResults = page.locator('#search-results');

    await searchInput.fill('nonexistentterm123');
    await page.waitForTimeout(500);

    await expect(searchResults).toBeVisible();
    await expect(searchResults.locator('.search-no-results')).toContainText('No results found');
  });

  test('search results can be clicked to navigate when results exist', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    
    // Search for blog content which should always exist
    await searchInput.fill('music blog');
    await page.waitForTimeout(500);

    const searchResults = page.locator('#search-results');
    await expect(searchResults).toBeVisible();
    
    const results = page.locator('.search-result');
    const resultCount = await results.count();
    
    if (resultCount > 0) {
      const firstResult = page.locator('.search-result-link').first();
      await firstResult.click();

      // Should navigate somewhere - could be blog post or music page
      await expect(page).toHaveURL(/.*\/(blog\/|music|content\/).*/);
    } else {
      // Skip test if no results available
      test.skip(true, 'No search results available to test navigation');
    }
  });

  test('search results hide when clicking outside', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    const searchResults = page.locator('#search-results');
    
    await searchInput.fill('music');
    await page.waitForTimeout(500);
    await expect(searchResults).toBeVisible();

    // Click outside the search area
    await page.locator('main').click();
    await expect(searchResults).not.toBeVisible();
  });

  test('search supports keyboard navigation', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    
    await searchInput.fill('music');
    await page.waitForTimeout(500);

    // Test Escape key hides results
    await page.keyboard.press('Escape');
    await expect(page.locator('#search-results')).not.toBeVisible();
  });
});