const fs = require('fs');
const path = require('path');

describe('Search functionality', () => {
  let searchData;
  
  beforeAll(() => {
    // Read the generated search.json file
    const searchPath = path.join(__dirname, '../../public/search.json');
    if (fs.existsSync(searchPath)) {
      const searchContent = fs.readFileSync(searchPath, 'utf8');
      searchData = JSON.parse(searchContent);
    }
  });
  
  test('search.json file exists and has correct structure', () => {
    expect(searchData).toBeDefined();
    expect(searchData.documents).toBeInstanceOf(Array);
    expect(searchData.documents.length).toBeGreaterThan(0);
  });
  
  test('search documents contain required fields', () => {
    searchData.documents.forEach(doc => {
      expect(doc).toHaveProperty('id');
      expect(doc).toHaveProperty('title');
      expect(doc).toHaveProperty('content');
      expect(doc).toHaveProperty('tags');
      expect(doc).toHaveProperty('type');
      expect(doc).toHaveProperty('url');
      expect(doc).toHaveProperty('excerpt');
      
      expect(['blog', 'music']).toContain(doc.type);
    });
  });
  
  test('search documents include both blog and music content', () => {
    const blogPosts = searchData.documents.filter(doc => doc.type === 'blog');
    const musicTracks = searchData.documents.filter(doc => doc.type === 'music');
    
    expect(blogPosts.length).toBeGreaterThan(0);
    expect(musicTracks.length).toBeGreaterThan(0);
  });
  
  test('music documents have additional music-specific fields', () => {
    const musicTracks = searchData.documents.filter(doc => doc.type === 'music');
    
    musicTracks.forEach(track => {
      expect(track).toHaveProperty('artist');
      expect(track).toHaveProperty('genre');
    });
  });
  
  test('document content is properly stripped of HTML', () => {
    searchData.documents.forEach(doc => {
      // Check that content doesn't contain HTML tags
      expect(doc.content).not.toMatch(/<[^>]*>/);
      expect(doc.excerpt).not.toMatch(/<[^>]*>/);
    });
  });
});