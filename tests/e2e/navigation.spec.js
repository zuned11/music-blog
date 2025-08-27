const { test, expect } = require('@playwright/test');

test.describe('Site Navigation', () => {
  test('should navigate between all main pages', async ({ page }) => {
    // Start at homepage
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Welcome to My Music Blog');
    
    // Navigate to blog using sidebar navigation
    await page.click('.sidebar a[href="/blog/"]');
    await expect(page).toHaveURL(/.*\/blog\//);
    
    // Navigate to music
    await page.click('.sidebar a[href="/music/"]');
    await expect(page).toHaveURL(/.*\/music\//);
    
    // Navigate back home
    await page.click('.sidebar a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('should navigate to individual blog posts', async ({ page }) => {
    await page.goto('/');
    
    // Click on first blog post in feed
    const firstPostLink = page.locator('.blog-feed .post-card h3 a').first();
    await firstPostLink.click();
    
    // Should navigate to post page
    await expect(page).toHaveURL(/.*\/content\/blog\/.*/);
  });

  test('should navigate using sidebar links', async ({ page }) => {
    await page.goto('/');
    
    // Test view all music link
    await page.click('.sidebar a[href="/music/"]');
    await expect(page).toHaveURL(/.*\/music\//);
    
    // Go back home
    await page.goto('/');
    
    // Test view all posts link
    await page.click('.sidebar a[href="/blog/"]');
    await expect(page).toHaveURL(/.*\/blog\//);
  });

  test('should show active navigation state', async ({ page }) => {
    await page.goto('/');
    
    // Check that home link has active styling in sidebar
    const homeLink = page.locator('.sidebar a[href="/"]');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveClass(/active/);
    
    // Navigate to blog and check if blog link gets active styling
    await page.click('.sidebar a[href="/blog/"]');
    const blogLink = page.locator('.sidebar a[href="/blog/"]');
    await expect(blogLink).toHaveClass(/active/);
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    // Try to navigate to non-existent page
    const response = await page.goto('/non-existent-page');
    
    // Should return 404 status
    expect(response.status()).toBe(404);
  });

  test('should have proper link accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Check that all sidebar navigation links are keyboard accessible
    const navLinks = page.locator('.sidebar-nav a');
    const linkCount = await navLinks.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i);
      await expect(link).toBeVisible();
      
      // Check that link has proper text or aria-label
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  });
});