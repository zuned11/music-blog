const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const yaml = require("yaml");
const rssPlugin = require("@11ty/eleventy-plugin-rss");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

module.exports = function(eleventyConfig) {
  
  // Add RSS plugin
  eleventyConfig.addPlugin(rssPlugin);
  
  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("music-files");
  
  // Watch for changes in assets
  eleventyConfig.addWatchTarget("src/assets/");
  
  // Date filters
  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd LLL yyyy");
  });
  
  eleventyConfig.addFilter("htmlDateString", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addFilter("sidebarDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd-MM-yy");
  });
  
  // Music-specific filters
  eleventyConfig.addFilter("formatDuration", duration => {
    if (duration === null || duration === undefined || duration === "") return "Unknown";
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });
  
  eleventyConfig.addFilter("formatFileSize", bytes => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  });
  
  // Text truncation filter
  eleventyConfig.addFilter("truncate", (str, length = 150) => {
    if (!str) return "";
    if (str.length <= length) return str;
    return str.substring(0, length).trim() + "...";
  });
  
  // Absolute URL filter for RSS feeds
  eleventyConfig.addFilter("absoluteUrl", (url, base) => {
    return new URL(url, base).href;
  });
  
  // Array head filter
  eleventyConfig.addFilter("head", (array, limit) => {
    if (!Array.isArray(array)) return [];
    return array.slice(0, limit);
  });
  
  // RSS content stability filter
  eleventyConfig.addFilter("stableRSSDate", (collection) => {
    if (!collection || !Array.isArray(collection) || collection.length === 0) {
      return new Date().toUTCString();
    }
    
    // Create hash of all content in collection for change detection
    const contentHash = collection
      .map(item => `${item.url}:${item.date}:${item.data.title}`)
      .sort()
      .join('|');
    
    const hash = crypto.createHash('md5').update(contentHash).digest('hex');
    const cacheFile = path.join(__dirname, '.rss-cache.json');
    
    let cache = {};
    try {
      if (fs.existsSync(cacheFile)) {
        cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      }
    } catch (error) {
      // If cache read fails, treat as new content
      cache = {};
    }
    
    const collectionName = collection[0]?.data?.tags?.includes('music') ? 'music' : 
                          collection[0]?.data?.tags?.includes('blog') ? 'blog' : 'combined';
    
    // Check if content has changed
    if (cache[collectionName]?.hash !== hash) {
      // Content changed, update cache
      cache[collectionName] = {
        hash: hash,
        lastUpdate: new Date().toISOString()
      };
      
      try {
        fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
      } catch (error) {
        console.warn('Warning: Could not write RSS cache file:', error.message);
      }
    }
    
    // Return the last actual content change date
    const lastUpdate = cache[collectionName]?.lastUpdate || new Date().toISOString();
    return DateTime.fromISO(lastUpdate).toRFC2822();
  });
  
  // Collections
  eleventyConfig.addCollection("blog", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/blog/*.md").reverse();
  });
  
  eleventyConfig.addCollection("music", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/music/*.md").reverse();
  });

  // Music pagination collection
  eleventyConfig.addCollection("musicPaginated", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/music/*.md").reverse();
  });

  // Combined collection for RSS feed
  eleventyConfig.addCollection("combined", function(collectionApi) {
    const blog = collectionApi.getFilteredByGlob("src/content/blog/*.md");
    const music = collectionApi.getFilteredByGlob("src/content/music/*.md");
    return [...blog, ...music].sort((a, b) => b.date - a.date);
  });
  
  // Markdown configuration
  const markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      placement: "after",
      class: "direct-link",
      symbol: "#"
    }),
    level: [1,2,3,4],
    slugify: eleventyConfig.getFilter("slug")
  });
  
  eleventyConfig.setLibrary("md", markdownLibrary);
  
  // Custom data extension for YAML files
  eleventyConfig.addDataExtension("yaml", contents => yaml.parse(contents));
  eleventyConfig.addDataExtension("yml", contents => yaml.parse(contents));
  
  return {
    templateFormats: [
      "md",
      "njk",
      "html"
    ],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: "src",
      includes: "_includes", 
      data: "_data",
      output: "public"
    }
  };
};