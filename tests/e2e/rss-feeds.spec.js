import { test, expect } from '@playwright/test';

test.describe('RSS Feed Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the site is built with RSS feeds
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('RSS Feed URLs', () => {
    test('combined RSS feed is accessible at /feed.xml', async ({ request }) => {
      const response = await request.get('/feed.xml');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('xml');
      
      const content = await response.text();
      expect(content).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(content).toContain('<rss version="2.0"');
      expect(content).toContain('<title>Music Blog</title>');
    });

    test('blog RSS feed is accessible at /blog-feed.xml', async ({ request }) => {
      const response = await request.get('/blog-feed.xml');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('xml');
      
      const content = await response.text();
      expect(content).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(content).toContain('<rss version="2.0"');
      expect(content).toContain('<title>Music Blog - Blog Posts</title>');
    });

    test('music RSS feed is accessible at /music-feed.xml', async ({ request }) => {
      const response = await request.get('/music-feed.xml');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('xml');
      
      const content = await response.text();
      expect(content).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(content).toContain('<rss version="2.0"');
      expect(content).toContain('<title>Music Blog - Music Releases</title>');
    });
  });

  test.describe('RSS Feed Content Validation', () => {
    test('combined feed contains valid RSS 2.0 structure', async ({ request }) => {
      const response = await request.get('/feed.xml');
      const content = await response.text();
      
      // Validate RSS 2.0 structure
      expect(content).toContain('<channel>');
      expect(content).toContain('<link>');
      expect(content).toContain('<description>');
      expect(content).toContain('<language>en</language>');
      expect(content).toContain('<lastBuildDate>');
      expect(content).toContain('</channel>');
      expect(content).toContain('</rss>');
      
      // Check for atom:link self-reference
      expect(content).toContain('atom:link');
      expect(content).toContain('rel="self"');
      expect(content).toContain('type="application/rss+xml"');
    });

    test('blog feed contains blog post items when available', async ({ request }) => {
      const response = await request.get('/blog-feed.xml');
      const content = await response.text();
      
      // Should contain blog-specific content
      expect(content).toContain('Blog posts from Music Blog');
      
      // Check if blog items exist
      if (content.includes('<item>')) {
        expect(content).toContain('<title>');
        expect(content).toContain('<link>');
        expect(content).toContain('<description>');
        expect(content).toContain('<pubDate>');
        expect(content).toContain('<guid');
      }
    });

    test('music feed has proper structure for music items', async ({ request }) => {
      const response = await request.get('/music-feed.xml');
      const content = await response.text();
      
      // Should contain music-specific content
      expect(content).toContain('Latest music releases and audio content');
      expect(content).toContain('/music/');
      
      // If music items exist, they should have enclosures
      if (content.includes('<item>')) {
        // Music items should potentially have enclosures for audio files
        expect(content).toMatch(/<enclosure|<\/item>/);
      }
    });

    test('combined feed merges content from both blog and music', async ({ request }) => {
      const combinedResponse = await request.get('/feed.xml');
      const blogResponse = await request.get('/blog-feed.xml');
      const musicResponse = await request.get('/music-feed.xml');
      
      const combinedContent = await combinedResponse.text();
      const blogContent = await blogResponse.text();
      const musicContent = await musicResponse.text();
      
      // Combined feed description should mention both content types
      expect(combinedContent).toContain('Blog posts and music releases');
      
      // Count items in each feed
      const combinedItems = (combinedContent.match(/<item>/g) || []).length;
      const blogItems = (blogContent.match(/<item>/g) || []).length;
      const musicItems = (musicContent.match(/<item>/g) || []).length;
      
      // Combined feed should have items from both sources
      expect(combinedItems).toBeGreaterThanOrEqual(0);
      expect(combinedItems).toBe(blogItems + musicItems);
    });
  });

  test.describe('RSS Discovery Links', () => {
    test('homepage contains RSS discovery meta tags', async ({ page }) => {
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

    test('RSS links are present in footer', async ({ page }) => {
      await page.goto('/');
      
      // Check for visible RSS section in footer
      await expect(page.locator('.footer-rss-links')).toBeVisible();
      await expect(page.locator('.footer-rss-label')).toContainText('RSS:');
      
      // Check for RSS feed links
      const allContentLink = page.locator('a[href="/feed.xml"].footer-rss-link');
      await expect(allContentLink).toBeVisible();
      await expect(allContentLink).toContainText('All Content');
      
      const blogLink = page.locator('a[href="/blog-feed.xml"].footer-rss-link');
      await expect(blogLink).toBeVisible();
      await expect(blogLink).toContainText('Blog Posts');
      
      const musicLink = page.locator('a[href="/music-feed.xml"].footer-rss-link');
      await expect(musicLink).toBeVisible();
      await expect(musicLink).toContainText('Music Releases');
    });

    test('RSS footer links open in new tabs', async ({ page }) => {
      await page.goto('/');
      
      // All RSS links should have target="_blank"
      const rssLinks = page.locator('.footer-rss-link');
      const count = await rssLinks.count();
      
      for (let i = 0; i < count; i++) {
        await expect(rssLinks.nth(i)).toHaveAttribute('target', '_blank');
      }
    });
  });

  test.describe('RSS Content Escaping and Formatting', () => {
    test('RSS feeds properly escape HTML content', async ({ request }) => {
      const response = await request.get('/feed.xml');
      const content = await response.text();
      
      // Check that content doesn't contain unescaped HTML
      if (content.includes('<item>')) {
        // Should not contain raw HTML tags in descriptions (except CDATA)
        const descriptionMatches = content.match(/<description>(.*?)<\/description>/gs);
        if (descriptionMatches) {
          for (const match of descriptionMatches) {
            // Should not contain unescaped < or > in content
            const innerContent = match.replace(/<description>|<\/description>/g, '');
            if (!innerContent.includes('<![CDATA[')) {
              expect(innerContent).not.toMatch(/<[^/].*?>/); // No unescaped HTML tags
            }
          }
        }
      }
    });

    test('RSS feeds have properly formatted dates', async ({ request }) => {
      const response = await request.get('/feed.xml');
      const content = await response.text();
      
      // Check for RFC 822 date format in pubDate
      if (content.includes('<pubDate>')) {
        const dateMatches = content.match(/<pubDate>(.*?)<\/pubDate>/g);
        if (dateMatches) {
          for (const dateMatch of dateMatches) {
            const dateString = dateMatch.replace(/<\/?pubDate>/g, '');
            // RFC 822 format: "Mon, 26 Aug 2024 00:00:00 +0000"
            expect(dateString).toMatch(/\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} [+-]\d{4}/);
          }
        }
      }
    });

    test('RSS feeds contain absolute URLs', async ({ request }) => {
      const response = await request.get('/feed.xml');
      const content = await response.text();
      
      // Check channel link is absolute
      expect(content).toMatch(/<link>https?:\/\//);
      
      // Check atom:link href is absolute
      expect(content).toMatch(/atom:link href="https?:\/\//);
      
      // Check item links are absolute (if items exist)
      if (content.includes('<item>')) {
        const itemLinkMatches = content.match(/<item>[\s\S]*?<link>(.*?)<\/link>/g);
        if (itemLinkMatches) {
          for (const linkMatch of itemLinkMatches) {
            const linkUrl = linkMatch.match(/<link>(.*?)<\/link>/)[1];
            expect(linkUrl).toMatch(/^https?:\/\//);
          }
        }
      }
    });
  });

  test.describe('RSS Feed Error Handling', () => {
    test('RSS feeds handle missing content gracefully', async ({ request }) => {
      // All feeds should be valid XML even with no content items
      const feeds = ['/feed.xml', '/blog-feed.xml', '/music-feed.xml'];
      
      for (const feedUrl of feeds) {
        const response = await request.get(feedUrl);
        expect(response.status()).toBe(200);
        
        const content = await response.text();
        expect(content).toContain('<?xml version="1.0" encoding="utf-8"?>');
        expect(content).toContain('<rss version="2.0"');
        expect(content).toContain('<channel>');
        expect(content).toContain('</channel>');
        expect(content).toContain('</rss>');
      }
    });
  });
});