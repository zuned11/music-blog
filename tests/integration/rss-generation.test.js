const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const EleventyClass = require('@11ty/eleventy');

describe('RSS Feed Generation Integration', () => {
  const testOutputDir = path.join(__dirname, '../fixtures/rss-test-output');
  const originalCwd = process.cwd();
  let eleventy;

  beforeAll(() => {
    // Ensure we're in the project root
    process.chdir(path.join(__dirname, '../..'));
    
    // Create test output directory
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testOutputDir, { recursive: true });
  });

  afterAll(() => {
    process.chdir(originalCwd);
    // Clean up test output
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    eleventy = new EleventyClass('src', testOutputDir);
  });

  describe('11ty RSS Collections', () => {
    test('should build site successfully and create collections', async () => {
      // Build the site first
      await eleventy.write();
      
      // Verify the output directory exists and has expected files
      expect(fs.existsSync(testOutputDir)).toBe(true);
      
      // Check that RSS files were generated (indicates collections worked)
      const feedFiles = ['feed.xml', 'blog-feed.xml', 'music-feed.xml'];
      for (const filename of feedFiles) {
        const feedPath = path.join(testOutputDir, filename);
        expect(fs.existsSync(feedPath)).toBe(true);
      }
    });

    test('should verify collections are configured in 11ty config', () => {
      const config = require('../../.eleventy.js');
      const mockEleventyConfig = {
        addPlugin: jest.fn(),
        addFilter: jest.fn(),
        addCollection: jest.fn(),
        addPassthroughCopy: jest.fn(),
        addWatchTarget: jest.fn(),
        setLibrary: jest.fn(),
        addDataExtension: jest.fn()
      };
      
      config(mockEleventyConfig);
      
      // Check that RSS collections are added
      const collectionCalls = mockEleventyConfig.addCollection.mock.calls;
      const collectionNames = collectionCalls.map(call => call[0]);
      
      expect(collectionNames).toContain('blog');
      expect(collectionNames).toContain('music');
      expect(collectionNames).toContain('combined');
    });

    test('combined collection should merge content from both blog and music', async () => {
      await eleventy.write();
      
      // Check generated feeds to verify content merging
      const combinedFeedPath = path.join(testOutputDir, 'feed.xml');
      const blogFeedPath = path.join(testOutputDir, 'blog-feed.xml');
      const musicFeedPath = path.join(testOutputDir, 'music-feed.xml');
      
      const combinedContent = fs.readFileSync(combinedFeedPath, 'utf-8');
      const blogContent = fs.readFileSync(blogFeedPath, 'utf-8');
      const musicContent = fs.readFileSync(musicFeedPath, 'utf-8');
      
      // Count items in each feed
      const combinedItems = (combinedContent.match(/<item>/g) || []).length;
      const blogItems = (blogContent.match(/<item>/g) || []).length;
      const musicItems = (musicContent.match(/<item>/g) || []).length;
      
      // Combined feed should equal sum of individual feeds
      expect(combinedItems).toBe(blogItems + musicItems);
    });
  });

  describe('RSS Template Processing', () => {
    test('should process RSS feed templates successfully', async () => {
      await eleventy.write();
      
      // Check that RSS files were generated
      const feedFiles = ['feed.xml', 'blog-feed.xml', 'music-feed.xml'];
      
      for (const filename of feedFiles) {
        const feedPath = path.join(testOutputDir, filename);
        expect(fs.existsSync(feedPath)).toBe(true);
        
        const content = fs.readFileSync(feedPath, 'utf-8');
        expect(content).toContain('<?xml version="1.0" encoding="utf-8"?>');
        expect(content).toContain('<rss version="2.0"');
      }
    });

    test('RSS templates should use correct RSS plugin filters', async () => {
      await eleventy.write();
      
      const feedPath = path.join(testOutputDir, 'feed.xml');
      const content = fs.readFileSync(feedPath, 'utf-8');
      
      // Check for RSS plugin filter outputs
      if (content.includes('<lastBuildDate>')) {
        const buildDateMatch = content.match(/<lastBuildDate>(.*?)<\/lastBuildDate>/);
        if (buildDateMatch) {
          const dateString = buildDateMatch[1];
          // Should be RFC 822 format
          expect(dateString).toMatch(/\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} [+-]\d{4}/);
        }
      }
      
      // Check for absolute URLs
      expect(content).toMatch(/https?:\/\//);
    });

    test('RSS templates should handle empty collections gracefully', async () => {
      await eleventy.write();
      
      // Even with no content, RSS feeds should be valid XML
      const feedFiles = ['feed.xml', 'blog-feed.xml', 'music-feed.xml'];
      
      for (const filename of feedFiles) {
        const feedPath = path.join(testOutputDir, filename);
        const content = fs.readFileSync(feedPath, 'utf-8');
        
        expect(content).toContain('<channel>');
        expect(content).toContain('</channel>');
        expect(content).toContain('</rss>');
        
        // Should not contain malformed XML
        expect(content).not.toContain('<item></item>');
        expect(content).not.toContain('undefined');
        expect(content).not.toContain('null');
      }
    });

    test('RSS feeds should contain proper metadata', async () => {
      await eleventy.write();
      
      const feedTests = [
        {
          file: 'feed.xml',
          titleContains: 'Music Blog',
          descriptionContains: 'Blog posts and music releases'
        },
        {
          file: 'blog-feed.xml',
          titleContains: 'Music Blog - Blog Posts',
          descriptionContains: 'Blog posts from'
        },
        {
          file: 'music-feed.xml',
          titleContains: 'Music Blog - Music Releases',
          descriptionContains: 'Latest music releases'
        }
      ];
      
      for (const test of feedTests) {
        const feedPath = path.join(testOutputDir, test.file);
        const content = fs.readFileSync(feedPath, 'utf-8');
        
        expect(content).toContain(`<title>${test.titleContains}`);
        expect(content).toContain(test.descriptionContains);
        expect(content).toContain('<language>en</language>');
        expect(content).toContain('atom:link');
        expect(content).toContain('rel="self"');
      }
    });
  });

  describe('RSS Content Generation', () => {
    test('blog feed should contain blog post items with correct structure', async () => {
      await eleventy.write();
      
      const blogFeedPath = path.join(testOutputDir, 'blog-feed.xml');
      const content = fs.readFileSync(blogFeedPath, 'utf-8');
      
      // Check if blog items exist
      if (content.includes('<item>')) {
        // Should contain required RSS item elements
        expect(content).toMatch(/<title>.*<\/title>/);
        expect(content).toMatch(/<link>https?:\/\/.*<\/link>/);
        expect(content).toMatch(/<description>.*<\/description>/);
        expect(content).toMatch(/<pubDate>.*<\/pubDate>/);
        expect(content).toMatch(/<guid.*>.*<\/guid>/);
        
        // Blog items should have blog category
        expect(content).toContain('<category>blog</category>');
      }
    });

    test('music feed should contain music items with audio enclosures', async () => {
      await eleventy.write();
      
      const musicFeedPath = path.join(testOutputDir, 'music-feed.xml');
      const content = fs.readFileSync(musicFeedPath, 'utf-8');
      
      // Check if music items exist
      if (content.includes('<item>')) {
        // Should contain music category
        expect(content).toContain('<category>music</category>');
        
        // Should contain enclosure for audio files (if filename exists)
        if (content.includes('filename')) {
          expect(content).toMatch(/<enclosure.*type="audio\/flac"/);
        }
      }
    });

    test('combined feed should merge and order content correctly', async () => {
      await eleventy.write();
      
      const combinedFeedPath = path.join(testOutputDir, 'feed.xml');
      const blogFeedPath = path.join(testOutputDir, 'blog-feed.xml');
      const musicFeedPath = path.join(testOutputDir, 'music-feed.xml');
      
      const combinedContent = fs.readFileSync(combinedFeedPath, 'utf-8');
      const blogContent = fs.readFileSync(blogFeedPath, 'utf-8');
      const musicContent = fs.readFileSync(musicFeedPath, 'utf-8');
      
      // Count items in each feed
      const combinedItems = (combinedContent.match(/<item>/g) || []).length;
      const blogItems = (blogContent.match(/<item>/g) || []).length;
      const musicItems = (musicContent.match(/<item>/g) || []).length;
      
      expect(combinedItems).toBe(blogItems + musicItems);
      
      // If there are items, check they're properly differentiated
      if (combinedItems > 0) {
        if (blogItems > 0 && musicItems > 0) {
          expect(combinedContent).toContain('<category>blog</category>');
          expect(combinedContent).toContain('<category>music</category>');
        }
      }
    });

    test('RSS feeds should properly escape content', async () => {
      await eleventy.write();
      
      const feedPath = path.join(testOutputDir, 'feed.xml');
      const content = fs.readFileSync(feedPath, 'utf-8');
      
      // Check that HTML entities are properly escaped in descriptions
      if (content.includes('<description>')) {
        const descriptions = content.match(/<description>(.*?)<\/description>/gs);
        if (descriptions) {
          for (const desc of descriptions) {
            const descContent = desc.replace(/<\/?description>/g, '');
            // Should not contain unescaped HTML (unless in CDATA)
            if (!descContent.includes('<![CDATA[')) {
              expect(descContent).not.toMatch(/<(?!\/?(description|!\[CDATA\[)).*?>/);
            }
          }
        }
      }
    });

    test('RSS feeds should limit items to 20 entries', async () => {
      await eleventy.write();
      
      const feedFiles = ['feed.xml', 'blog-feed.xml', 'music-feed.xml'];
      
      for (const filename of feedFiles) {
        const feedPath = path.join(testOutputDir, filename);
        const content = fs.readFileSync(feedPath, 'utf-8');
        
        const itemCount = (content.match(/<item>/g) || []).length;
        expect(itemCount).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('RSS Plugin Integration', () => {
    test('should have RSS plugin available with required filters', () => {
      const config = require('../../.eleventy.js');
      const mockEleventyConfig = {
        addPlugin: jest.fn(),
        addFilter: jest.fn(),
        addCollection: jest.fn(),
        addPassthroughCopy: jest.fn(),
        addWatchTarget: jest.fn(),
        setLibrary: jest.fn(),
        addDataExtension: jest.fn()
      };
      
      config(mockEleventyConfig);
      
      // RSS plugin should be added
      expect(mockEleventyConfig.addPlugin).toHaveBeenCalled();
      
      // Check that RSS-related filters are available
      const filterCalls = mockEleventyConfig.addFilter.mock.calls;
      const filterNames = filterCalls.map(call => call[0]);
      
      // Should include date formatting filters
      expect(filterNames).toContain('readableDate');
      expect(filterNames).toContain('htmlDateString');
    });
  });
});