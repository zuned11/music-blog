const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const yaml = require("yaml");
const rssPlugin = require("@11ty/eleventy-plugin-rss");

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