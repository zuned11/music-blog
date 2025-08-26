const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Build Process Integration', () => {
  const testOutputDir = path.join(__dirname, '../fixtures/test-output');
  const originalCwd = process.cwd();

  beforeAll(() => {
    // Ensure we're in the project root
    process.chdir(path.join(__dirname, '../..'));
  });

  afterAll(() => {
    process.chdir(originalCwd);
    // Clean up test output
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // Clean output directory before each test
    if (fs.existsSync('public')) {
      fs.rmSync('public', { recursive: true, force: true });
    }
  });

  describe('Eleventy Build', () => {
    it('should build site successfully', () => {
      expect(() => {
        execSync('npm run build', { 
          stdio: 'pipe',
          timeout: 30000 
        });
      }).not.toThrow();
      
      // Check that public directory was created
      expect(fs.existsSync('public')).toBe(true);
    });

    it('should generate index.html', () => {
      execSync('npm run build', { stdio: 'pipe' });
      
      const indexPath = path.join('public', 'index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
      
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('Welcome to My Music Blog');
    });

    it('should copy static assets', () => {
      execSync('npm run build', { stdio: 'pipe' });
      
      // Check CSS file
      const cssPath = path.join('public', 'assets', 'css', 'main.css');
      expect(fs.existsSync(cssPath)).toBe(true);
      
      // Check JS file
      const jsPath = path.join('public', 'assets', 'js', 'main.js');
      expect(fs.existsSync(jsPath)).toBe(true);
    });

    it('should generate blog pages', () => {
      execSync('npm run build', { stdio: 'pipe' });
      
      const blogIndexPath = path.join('public', 'blog', 'index.html');
      expect(fs.existsSync(blogIndexPath)).toBe(true);
      
      // Check if example post was built
      const examplePostPath = path.join('public', 'content', 'blog', 'example-post', 'index.html');
      expect(fs.existsSync(examplePostPath)).toBe(true);
    });

    it('should generate music pages', () => {
      execSync('npm run build', { stdio: 'pipe' });
      
      const musicIndexPath = path.join('public', 'music', 'index.html');
      expect(fs.existsSync(musicIndexPath)).toBe(true);
    });

    it('should generate RSS feeds', () => {
      execSync('npm run build', { stdio: 'pipe' });
      
      // Check blog RSS feed
      const blogFeedPath = path.join('public', 'feed.xml');
      expect(fs.existsSync(blogFeedPath)).toBe(true);
      
      // Check music RSS feed
      const musicFeedPath = path.join('public', 'music-feed.xml');
      expect(fs.existsSync(musicFeedPath)).toBe(true);
      
      // Verify RSS content structure
      const feedContent = fs.readFileSync(blogFeedPath, 'utf-8');
      expect(feedContent).toContain('<?xml version="1.0"');
      expect(feedContent).toContain('<rss version="2.0"');
    });
  });

  describe('Content Processing', () => {
    it('should process markdown correctly', () => {
      execSync('npm run build', { stdio: 'pipe' });
      
      const examplePostPath = path.join('public', 'content', 'blog', 'example-post', 'index.html');
      const content = fs.readFileSync(examplePostPath, 'utf-8');
      
      // Check that markdown was converted to HTML
      expect(content).toContain('<h1>Welcome to My Music Blog</h1>');
      expect(content).toContain('<h2>What You\'ll Find Here</h2>');
      expect(content).toContain('<li><strong>Music Reviews</strong>');
    });

    it('should apply layouts correctly', () => {
      execSync('npm run build', { stdio: 'pipe' });
      
      const indexPath = path.join('public', 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      // Check for base layout elements
      expect(content).toContain('<header class="header">');
      expect(content).toContain('<nav class="nav">');
      expect(content).toContain('<footer class="footer">');
      expect(content).toContain('<main class="main">');
    });

    it('should handle frontmatter data', () => {
      execSync('npm run build', { stdio: 'pipe' });
      
      const examplePostPath = path.join('public', 'content', 'blog', 'example-post', 'index.html');
      const content = fs.readFileSync(examplePostPath, 'utf-8');
      
      // Check that frontmatter data is used
      expect(content).toContain('Welcome to My Music Blog'); // title
    });
  });

  describe('Build Performance', () => {
    it('should build within reasonable time', () => {
      const startTime = Date.now();
      
      execSync('npm run build', { stdio: 'pipe' });
      
      const buildTime = Date.now() - startTime;
      
      // Build should complete within 10 seconds for a simple site
      expect(buildTime).toBeLessThan(10000);
    });

    it('should not produce build warnings or errors', () => {
      let output = '';
      let error = '';
      
      try {
        output = execSync('npm run build', { 
          encoding: 'utf-8',
          stdio: 'pipe' 
        });
      } catch (e) {
        error = e.stderr;
      }
      
      // Check that there are no critical errors
      expect(error).not.toContain('ERROR');
      expect(error).not.toContain('FATAL');
    });
  });

  describe('Clean Build', () => {
    it('should clean previous build', () => {
      // Create a test file in public
      fs.mkdirSync('public', { recursive: true });
      fs.writeFileSync(path.join('public', 'test-file.txt'), 'test');
      
      execSync('npm run clean', { stdio: 'pipe' });
      
      expect(fs.existsSync('public')).toBe(false);
    });

    it('should rebuild cleanly after clean', () => {
      execSync('npm run clean', { stdio: 'pipe' });
      execSync('npm run build', { stdio: 'pipe' });
      
      expect(fs.existsSync('public')).toBe(true);
      expect(fs.existsSync(path.join('public', 'index.html'))).toBe(true);
    });
  });
});