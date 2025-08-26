const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { extractFLACMetadata, generateMarkdownFile, processFiles } = require('../../scripts/extract-metadata');

// Mock fs for file operations
jest.mock('fs');

describe('FLAC Metadata Extraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    execSync.mockReturnValue(JSON.stringify(global.mockFLACMetadata));
  });

  describe('extractFLACMetadata', () => {
    it('should extract basic metadata from FLAC file', () => {
      const result = extractFLACMetadata('/path/to/test.flac');
      
      expect(result).toMatchObject({
        filename: 'test.flac',
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        date: '2024',
        genre: ['Electronic'],
        duration: 247.5,
        fileSize: 12345678,
        sampleRate: 44100,
        channels: 2,
        bitDepth: 16
      });
    });

    it('should handle missing metadata gracefully', () => {
      const incompleteMetadata = {
        format: { tags: {} },
        streams: [{}]
      };
      execSync.mockReturnValue(JSON.stringify(incompleteMetadata));
      
      const result = extractFLACMetadata('/path/to/incomplete.flac');
      
      expect(result.title).toBe('incomplete'); // Uses filename without extension as fallback
      expect(result.artist).toBe('Unknown Artist');
      expect(result.genre).toEqual(['Unknown']);
    });

    it('should handle multiple genres correctly', () => {
      const multiGenreMetadata = {
        ...global.mockFLACMetadata,
        format: {
          ...global.mockFLACMetadata.format,
          tags: {
            ...global.mockFLACMetadata.format.tags,
            GENRE: 'Electronic, Ambient, Experimental'
          }
        }
      };
      execSync.mockReturnValue(JSON.stringify(multiGenreMetadata));
      
      const result = extractFLACMetadata('/path/to/multi-genre.flac');
      
      expect(result.genre).toEqual(['Electronic', 'Ambient', 'Experimental']);
    });

    it('should handle ffprobe errors gracefully', () => {
      execSync.mockImplementation(() => {
        throw new Error('ffprobe command failed');
      });
      
      const result = extractFLACMetadata('/path/to/invalid.flac');
      
      expect(result).toBeNull();
    });

    it('should normalize tag case correctly', () => {
      const mixedCaseMetadata = {
        format: {
          tags: {
            Title: 'Mixed Case Title',
            ARTIST: 'UPPERCASE ARTIST',
            album: 'lowercase album'
          }
        },
        streams: [{}]
      };
      execSync.mockReturnValue(JSON.stringify(mixedCaseMetadata));
      
      const result = extractFLACMetadata('/path/to/mixed.flac');
      
      expect(result.title).toBe('Mixed Case Title');
      expect(result.artist).toBe('UPPERCASE ARTIST');
      expect(result.album).toBe('lowercase album');
    });
  });

  describe('generateMarkdownFile', () => {
    const mockMetadata = {
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      date: '2024',
      genre: ['Electronic'],
      duration: 247,
      fileSize: 12345678,
      filename: 'test-song.flac',
      sampleRate: 44100,
      bitDepth: 16,
      channels: 2,
      comment: 'A test song for unit testing'
    };

    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
      fs.mkdirSync.mockReturnValue(undefined);
      fs.writeFileSync.mockReturnValue(undefined);
    });

    it('should generate valid markdown with frontmatter', () => {
      const outputPath = generateMarkdownFile(mockMetadata, '/output');
      
      expect(fs.writeFileSync).toHaveBeenCalled();
      const writtenContent = fs.writeFileSync.mock.calls[0][1];
      
      // Check YAML frontmatter structure
      expect(writtenContent).toContain('---');
      expect(writtenContent).toContain('title: Test Song');
      expect(writtenContent).toContain('artist: Test Artist');
      expect(writtenContent).toContain('layout: music');
      expect(writtenContent).toContain('genre:');
      expect(writtenContent).toContain('  - Electronic');
      
      // Check markdown content
      expect(writtenContent).toContain('# Test Song');
      expect(writtenContent).toContain('*by Test Artist*');
      expect(writtenContent).toContain('A test song for unit testing');
      expect(writtenContent).toContain('<audio controls');
    });

    it('should create output directory if it does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      generateMarkdownFile(mockMetadata, '/new-output');
      
      expect(fs.mkdirSync).toHaveBeenCalledWith('/new-output', { recursive: true });
    });

    it('should handle null metadata gracefully', () => {
      const result = generateMarkdownFile(null, '/output');
      
      expect(result).toBeNull();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should generate proper slug from title', () => {
      const metadataWithSpecialChars = {
        ...mockMetadata,
        title: 'Song Title: With Special Characters! & Symbols'
      };
      
      generateMarkdownFile(metadataWithSpecialChars, '/output');
      
      const filePath = fs.writeFileSync.mock.calls[0][0];
      expect(filePath).toContain('song-title-with-special-characters-symbols.md');
    });
  });

  describe('processFiles', () => {
    beforeEach(() => {
      fs.statSync.mockReturnValue({ isDirectory: () => false });
      fs.existsSync.mockReturnValue(true);
    });

    it('should process single FLAC file', () => {
      processFiles('/path/to/single.flac', '/output');
      
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('ffprobe'),
        expect.any(Object)
      );
    });

    it('should process directory of FLAC files', () => {
      fs.statSync.mockReturnValue({ isDirectory: () => true });
      fs.readdirSync.mockReturnValue(['song1.flac', 'song2.flac', 'readme.txt']);
      
      processFiles('/path/to/directory', '/output');
      
      // Should call ffprobe twice (once for each FLAC file)
      expect(execSync).toHaveBeenCalledTimes(2);
    });

    it('should filter out non-FLAC files from directory', () => {
      fs.statSync.mockReturnValue({ isDirectory: () => true });
      fs.readdirSync.mockReturnValue(['song.flac', 'cover.jpg', 'Song.FLAC', 'info.txt']);
      
      processFiles('/path/to/directory', '/output');
      
      // Should process both .flac and .FLAC files (case insensitive)
      expect(execSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('Helper Functions', () => {
    // Test the helper functions that are used within the main module
    it('should format duration correctly', () => {
      // Since formatDuration is not exported, we test it indirectly
      const metadata = { ...global.mockFLACMetadata.format.tags, duration: 125.7 };
      execSync.mockReturnValue(JSON.stringify({
        format: { ...global.mockFLACMetadata.format, duration: "125.7" },
        streams: global.mockFLACMetadata.streams
      }));
      
      const result = extractFLACMetadata('/path/to/test.flac');
      expect(result.duration).toBe(125.7);
    });

    it('should format file size correctly', () => {
      const metadata = { ...global.mockFLACMetadata.format.tags };
      execSync.mockReturnValue(JSON.stringify({
        format: { ...global.mockFLACMetadata.format, size: "5242880" }, // 5MB
        streams: global.mockFLACMetadata.streams
      }));
      
      const result = extractFLACMetadata('/path/to/test.flac');
      expect(result.fileSize).toBe(5242880);
    });
  });
});