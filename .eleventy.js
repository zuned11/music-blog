const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const yaml = require("yaml");

module.exports = function(eleventyConfig) {
  
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
  
  // Music-specific filters
  eleventyConfig.addFilter("formatDuration", duration => {
    if (!duration) return "Unknown";
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });
  
  eleventyConfig.addFilter("formatFileSize", bytes => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  });
  
  // Collections
  eleventyConfig.addCollection("blog", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/blog/*.md").reverse();
  });
  
  eleventyConfig.addCollection("music", function(collectionApi) {
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
      "html"
    ],
    markdownTemplateEngine: "html",
    htmlTemplateEngine: "html",
    dir: {
      input: "src",
      includes: "includes", 
      data: "data",
      output: "public"
    }
  };
};