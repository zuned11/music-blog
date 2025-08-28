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

  test('search returns results for music content', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    const searchResults = page.locator('#search-results');

    // Search for music-related content
    await searchInput.fill('synthwave');
    await page.waitForTimeout(500); // Wait for debounced search

    // Check that results appear
    await expect(searchResults).toBeVisible();
    const results = page.locator('.search-result');
    await expect(results.first().locator('.search-result-title')).toContainText('accidentally synthwave');
    await expect(results.first().locator('.search-result-type')).toContainText('music');
    await expect(results.first().locator('.search-result-artist')).toContainText('by zuned11');
  });

  test('search highlights matching terms', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    
    await searchInput.fill('synthwave');
    await page.waitForTimeout(500);

    // Check for highlighted search terms
    const highlightedTerm = page.locator('.search-results mark');
    await expect(highlightedTerm).toBeVisible();
    await expect(highlightedTerm).toContainText('synthwave');
  });

  test('search shows no results message for non-existent terms', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    const searchResults = page.locator('#search-results');

    await searchInput.fill('nonexistentterm123');
    await page.waitForTimeout(500);

    await expect(searchResults).toBeVisible();
    await expect(searchResults.locator('.search-no-results')).toContainText('No results found');
  });

  test('search results can be clicked to navigate', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    
    await searchInput.fill('synthwave');
    await page.waitForTimeout(500);

    const firstResult = page.locator('.search-result-link').first();
    await firstResult.click();

    // Should navigate to the music page since individual track pages are disabled
    await expect(page).toHaveURL(/.*music.*/);
    await expect(page.locator('h1')).toContainText('Music');
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