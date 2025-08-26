const { DateTime } = require('luxon');

// Mock eleventy config object
const mockEleventyConfig = {
  addPlugin: jest.fn(),
  addPassthroughCopy: jest.fn(),
  addWatchTarget: jest.fn(),
  addFilter: jest.fn(),
  addCollection: jest.fn(),
  setLibrary: jest.fn(),
  addDataExtension: jest.fn(),
  getFilter: jest.fn(() => (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
};

// Import the config function
const eleventyConfig = require('../../.eleventy.js');

describe('Eleventy Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Plugin and Asset Configuration', () => {
    it('should configure plugins and assets correctly', () => {
      eleventyConfig(mockEleventyConfig);
      
      expect(mockEleventyConfig.addPlugin).toHaveBeenCalledWith(
        expect.any(Function) // RSS plugin
      );
      expect(mockEleventyConfig.addPassthroughCopy).toHaveBeenCalledWith('src/assets');
      expect(mockEleventyConfig.addPassthroughCopy).toHaveBeenCalledWith('music-files');
      expect(mockEleventyConfig.addWatchTarget).toHaveBeenCalledWith('src/assets/');
    });
  });

  describe('Custom Filters', () => {
    let addedFilters;

    beforeEach(() => {
      eleventyConfig(mockEleventyConfig);
      addedFilters = mockEleventyConfig.addFilter.mock.calls.reduce((acc, call) => {
        acc[call[0]] = call[1];
        return acc;
      }, {});
    });

    describe('readableDate filter', () => {
      it('should format date correctly', () => {
        const testDate = new Date('2024-08-26T12:00:00Z');
        const result = addedFilters.readableDate(testDate);
        
        expect(result).toBe('26 Aug 2024');
      });
    });

    describe('htmlDateString filter', () => {
      it('should format date for HTML datetime attribute', () => {
        const testDate = new Date('2024-08-26T12:00:00Z');
        const result = addedFilters.htmlDateString(testDate);
        
        expect(result).toBe('2024-08-26');
      });
    });

    describe('formatDuration filter', () => {
      it('should format duration in seconds to MM:SS', () => {
        expect(addedFilters.formatDuration(125)).toBe('2:05');
        expect(addedFilters.formatDuration(61)).toBe('1:01');
        expect(addedFilters.formatDuration(7)).toBe('0:07');
        expect(addedFilters.formatDuration(3661)).toBe('61:01'); // Over 60 minutes
      });

      it('should handle edge cases', () => {
        expect(addedFilters.formatDuration(null)).toBe('Unknown');
        expect(addedFilters.formatDuration(undefined)).toBe('Unknown');
        expect(addedFilters.formatDuration('')).toBe('Unknown');
        expect(addedFilters.formatDuration(0)).toBe('0:00'); // 0 is valid duration
      });
    });

    describe('formatFileSize filter', () => {
      it('should format bytes to MB', () => {
        expect(addedFilters.formatFileSize(1048576)).toBe('1.0 MB'); // 1 MB
        expect(addedFilters.formatFileSize(5242880)).toBe('5.0 MB'); // 5 MB
        expect(addedFilters.formatFileSize(1572864)).toBe('1.5 MB'); // 1.5 MB
      });

      it('should handle edge cases', () => {
        expect(addedFilters.formatFileSize(0)).toBe('Unknown');
        expect(addedFilters.formatFileSize(null)).toBe('Unknown');
        expect(addedFilters.formatFileSize(undefined)).toBe('Unknown');
      });
    });

    describe('truncate filter', () => {
      it('should truncate long strings', () => {
        const longString = 'This is a very long string that should be truncated because it exceeds the default length limit of 150 characters and we want to test the truncation functionality.';
        const result = addedFilters.truncate(longString);
        
        expect(result.length).toBeLessThanOrEqual(154); // 150 + "..."
        expect(result.endsWith('...')).toBe(true);
      });

      it('should not truncate short strings', () => {
        const shortString = 'This is short.';
        const result = addedFilters.truncate(shortString);
        
        expect(result).toBe(shortString);
      });

      it('should handle custom length', () => {
        const testString = 'This is a test string for custom length truncation.';
        const result = addedFilters.truncate(testString, 20);
        
        expect(result).toBe('This is a test strin...');
      });

      it('should handle edge cases', () => {
        expect(addedFilters.truncate('')).toBe('');
        expect(addedFilters.truncate(null)).toBe('');
        expect(addedFilters.truncate(undefined)).toBe('');
      });
    });

    describe('absoluteUrl filter', () => {
      it('should create absolute URLs', () => {
        const result = addedFilters.absoluteUrl('/blog/post', 'https://example.com');
        expect(result).toBe('https://example.com/blog/post');
      });

      it('should handle relative URLs', () => {
        const result = addedFilters.absoluteUrl('blog/post', 'https://example.com/');
        expect(result).toBe('https://example.com/blog/post');
      });
    });
  });

  describe('Collections', () => {
    let addedCollections;

    beforeEach(() => {
      eleventyConfig(mockEleventyConfig);
      addedCollections = mockEleventyConfig.addCollection.mock.calls.reduce((acc, call) => {
        acc[call[0]] = call[1];
        return acc;
      }, {});
    });

    it('should configure blog collection', () => {
      const mockCollectionApi = {
        getFilteredByGlob: jest.fn().mockReturnValue([
          { date: new Date('2024-01-01') },
          { date: new Date('2024-02-01') },
          { date: new Date('2024-03-01') }
        ])
      };

      const blogCollection = addedCollections.blog(mockCollectionApi);
      
      expect(mockCollectionApi.getFilteredByGlob).toHaveBeenCalledWith('src/content/blog/*.md');
      expect(blogCollection).toHaveLength(3);
    });

    it('should configure music collection', () => {
      const mockCollectionApi = {
        getFilteredByGlob: jest.fn().mockReturnValue([
          { date: new Date('2024-01-01') },
          { date: new Date('2024-02-01') }
        ])
      };

      const musicCollection = addedCollections.music(mockCollectionApi);
      
      expect(mockCollectionApi.getFilteredByGlob).toHaveBeenCalledWith('src/content/music/*.md');
      expect(musicCollection).toHaveLength(2);
    });
  });

  describe('Return Configuration', () => {
    it('should return correct configuration object', () => {
      const config = eleventyConfig(mockEleventyConfig);
      
      expect(config).toEqual({
        templateFormats: ['md', 'njk', 'html'],
        markdownTemplateEngine: 'njk',
        htmlTemplateEngine: 'njk',
        dir: {
          input: 'src',
          includes: '_includes',
          data: '_data',
          output: 'public'
        }
      });
    });
  });
});