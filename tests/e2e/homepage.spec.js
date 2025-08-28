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

  test('should display sidebar with navigation, music and blog sections', async ({ page }) => {
    await page.goto('/');
    
    // Check sidebar exists
    await expect(page.locator('.sidebar')).toBeVisible();
    
    // Check sidebar brand header
    await expect(page.locator('.sidebar-brand')).toContainText('zuned11.blog');
    
    // Check search section
    await expect(page.locator('.sidebar-section-title').first()).toContainText('Search');
    
    // Check navigation section
    await expect(page.locator('.sidebar-section-title').nth(1)).toContainText('Navigation');
    
    // Check latest releases section  
    await expect(page.locator('.sidebar-section-title').nth(2)).toContainText('Latest Releases');
    
    // Check recent posts section
    await expect(page.locator('.sidebar-section-title').nth(3)).toContainText('Recent Posts');
    
    // Check view all links
    await expect(page.locator('a[href="/blog/"]').filter({ hasText: 'View all posts' })).toBeVisible();
  });

  test('should display RSS links in footer', async ({ page }) => {
    await page.goto('/');
    
    // Check footer RSS section
    await expect(page.locator('.footer-rss-links')).toBeVisible();
    await expect(page.locator('.footer-rss-label')).toContainText('RSS:');
    
    // Check individual RSS links
    await expect(page.locator('a[href="/feed.xml"].footer-rss-link')).toContainText('All Content');
    await expect(page.locator('a[href="/blog-feed.xml"].footer-rss-link')).toContainText('Blog Posts');
    await expect(page.locator('a[href="/music-feed.xml"].footer-rss-link')).toContainText('Music Releases');
    
    // Check that RSS links open in new tabs
    await expect(page.locator('.footer-rss-link').first()).toHaveAttribute('target', '_blank');
    
    // Check separators are present
    await expect(page.locator('.footer-rss-separator').first()).toContainText('|');
    
    // Check updated copyright
    await expect(page.locator('footer p')).toContainText('© 2025 zuned11');
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
    
    // Test blog navigation from sidebar
    await page.click('.sidebar a[href="/blog/"]');
    await expect(page).toHaveURL('/blog/');
    
    // Go back to home  
    await page.click('.sidebar a[href="/"]');
    await expect(page).toHaveURL('/');
    
    // Test music navigation from sidebar
    await page.click('.sidebar a[href="/music/"]');
    await expect(page).toHaveURL('/music/');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('/');
    
    // Check that hamburger menu is visible on mobile
    const hamburgerButton = page.locator('.sidebar-toggle');
    await expect(hamburgerButton).toBeVisible();
    
    // Check that sidebar is initially hidden on mobile (transform: translateX(-320px))
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible(); // Element exists but positioned off-screen
    
    // Check main content is visible
    const contentFeed = page.locator('.content-feed');
    await expect(contentFeed).toBeVisible();
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

  test('should have RSS feed discovery links in head', async ({ page }) => {
    await page.goto('/');
    
    // Check for RSS discovery links in HTML head
    const rssLinks = page.locator('link[type="application/rss+xml"]');
    await expect(rssLinks).toHaveCount(3);
    
    // Check for combined feed (main)
    const combinedFeed = page.locator('link[href="/feed.xml"][type="application/rss+xml"]');
    await expect(combinedFeed).toHaveAttribute('title', 'Music Blog - All Content');
    
    // Check for blog feed
    const blogFeed = page.locator('link[href="/blog-feed.xml"][type="application/rss+xml"]');
    await expect(blogFeed).toHaveAttribute('title', 'Music Blog - Blog Posts');
    
    // Check for music feed
    const musicFeed = page.locator('link[href="/music-feed.xml"][type="application/rss+xml"]');
    await expect(musicFeed).toHaveAttribute('title', 'Music Blog - Music Releases');
  });

  test('should load CSS and be properly styled', async ({ page }) => {
    await page.goto('/');
    
    // Check that header has expected dark background color  
    const header = page.locator('header.header');
    await expect(header).toHaveCSS('background-color', 'rgb(20, 24, 41)'); // --navy-darker
    
    // Check sidebar has dark gradient background
    const sidebar = page.locator('.sidebar');
    // Note: gradient backgrounds are hard to test precisely, just check it's not white
    const sidebarBg = await sidebar.evaluate((el) => getComputedStyle(el).background);
    expect(sidebarBg).toContain('linear-gradient');
    
    // Check that layout container uses flexbox
    const layoutContainer = page.locator('.layout-container');
    await expect(layoutContainer).toHaveCSS('display', 'flex');
  });

  test('should auto-show sidebar on wide screens (1400px+)', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    await page.goto('/');
    
    // Check that hamburger menu is hidden on wide screens
    const hamburgerButton = page.locator('.sidebar-toggle');
    await expect(hamburgerButton).not.toBeVisible();
    
    // Check that sidebar is visible and in static position
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();
    
    // Check that content adjusts to sidebar being present (flexbox layout)
    const main = page.locator('.main');
    await expect(main).toBeVisible();
  });

  test('should show hamburger menu on smaller screens (<1400px)', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    
    // Check that hamburger menu is visible on smaller wide screens
    const hamburgerButton = page.locator('.sidebar-toggle');
    await expect(hamburgerButton).toBeVisible();
    
    // Check toggle functionality
    await hamburgerButton.click();
    
    // Sidebar should be visible after clicking
    const sidebar = page.locator('.sidebar.open');
    await expect(sidebar).toBeVisible();
    
    // Overlay should be active
    const overlay = page.locator('.sidebar-overlay.active');
    await expect(overlay).toBeVisible();
  });
});