const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test('should display main layout elements', async ({ page }) => {
    await page.goto('/');
    
    // Check header
    await expect(page.locator('header.header')).toBeVisible();
    await expect(page.locator('.nav-logo')).toHaveText('Music Blog');
    
    // Check navigation links
    await expect(page.locator('nav a[href="/"]')).toHaveText('Home');
    await expect(page.locator('nav a[href="/blog/"]')).toHaveText('Blog');
    await expect(page.locator('nav a[href="/music/"]')).toHaveText('Music');
    
    // Check main content
    await expect(page.locator('h1')).toHaveText('Welcome to My Music Blog');
    await expect(page.locator('.page-intro p')).toContainText('Personal music blog');
    
    // Check footer
    await expect(page.locator('footer.footer')).toBeVisible();
    await expect(page.locator('footer')).toContainText('zuned11');
  });

  test('should display sidebar with music and blog sections', async ({ page }) => {
    await page.goto('/');
    
    // Check sidebar exists
    await expect(page.locator('.sidebar')).toBeVisible();
    
    // Check newest song releases section
    await expect(page.locator('.sidebar h3').first()).toContainText('Newest Song Releases');
    await expect(page.locator('.music-mini-card').first()).toBeVisible();
    
    // Check all blog entries section
    await expect(page.locator('.sidebar h3').nth(1)).toContainText('All Blog Entries');
    await expect(page.locator('.blog-mini-card').first()).toBeVisible();
    
    // Check view all links
    await expect(page.locator('a[href="/music/"]').filter({ hasText: 'View all music' })).toBeVisible();
    await expect(page.locator('a[href="/blog/"]').filter({ hasText: 'View all posts' })).toBeVisible();
  });

  test('should display blog feed in main content area', async ({ page }) => {
    await page.goto('/');
    
    // Check blog feed section
    await expect(page.locator('.blog-feed h2')).toHaveText('Latest Blog Posts');
    await expect(page.locator('.blog-feed .post-card').first()).toBeVisible();
    
    // Check post card content
    const firstPost = page.locator('.blog-feed .post-card').first();
    await expect(firstPost.locator('h3 a')).toBeVisible();
    await expect(firstPost.locator('.post-meta')).toBeVisible();
    await expect(firstPost.locator('.read-more')).toContainText('Read more');
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Test blog navigation
    await page.click('nav a[href="/blog/"]');
    await expect(page).toHaveURL('/blog/');
    
    // Go back to home
    await page.click('nav a[href="/"]');
    await expect(page).toHaveURL('/');
    
    // Test music navigation
    await page.click('nav a[href="/music/"]');
    await expect(page).toHaveURL('/music/');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('/');
    
    // Check that sidebar appears above content on mobile
    const sidebar = page.locator('.sidebar');
    const contentFeed = page.locator('.content-feed');
    
    await expect(sidebar).toBeVisible();
    await expect(contentFeed).toBeVisible();
    
    // Check navigation is still functional
    await expect(page.locator('.nav-links a')).toHaveCount(3);
  });

  test('should have proper meta tags and SEO elements', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle('Music Blog');
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', 'Personal music blog and portfolio');
    
    // Check that main heading is h1
    await expect(page.locator('h1')).toHaveText('Welcome to My Music Blog');
  });

  test('should load CSS and be properly styled', async ({ page }) => {
    await page.goto('/');
    
    // Check that header has expected background color (from CSS)
    const header = page.locator('header.header');
    await expect(header).toHaveCSS('background-color', 'rgb(44, 62, 80)');
    
    // Check sidebar styling
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toHaveCSS('background-color', 'rgb(248, 249, 250)');
    
    // Check that content is properly laid out
    const homepageLayout = page.locator('.homepage-layout');
    await expect(homepageLayout).toHaveCSS('display', 'grid');
  });
});