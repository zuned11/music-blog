# Music Blog

A static site generator-based music blog and portfolio built with 11ty (Eleventy). Features dual content types for both blog posts and music releases with FLAC metadata extraction.

## Features

- **Dual Content Types**: Blog posts and music releases
- **FLAC Metadata Extraction**: Automatic metadata extraction from FLAC files using ffprobe
- **Responsive Design**: Mobile-friendly CSS with clean, minimal design
- **Static Site Generation**: Fast, secure static HTML output
- **High-Quality Audio**: FLAC downloads and HTML5 audio players
- **Markdown-based**: Write content in Obsidian or any markdown editor

## Quick Start

```bash
# Clone and install dependencies
git clone <repository-url>
cd music-blog
npm install

# Start development server
npm run dev

# Add FLAC files to music-files/ directory
# Extract metadata and generate music pages
npm run extract-music

# Build for production
npm run build
```

## Project Structure

```
├── src/
│   ├── content/
│   │   ├── blog/          # Blog post markdown files
│   │   └── music/         # Music release markdown files
│   ├── assets/
│   │   ├── css/           # Stylesheets
│   │   └── js/            # JavaScript files
│   └── index.html         # Homepage
├── music-files/           # FLAC audio files (not in git)
├── scripts/
│   └── extract-metadata.js # FLAC metadata extraction script
├── docs/                  # Documentation
└── public/                # Generated site (build output)
```

## Available Scripts

- `npm run dev` - Start development server with file watching
- `npm run build` - Build site for production
- `npm run extract-music` - Extract metadata from all FLAC files in music-files/
- `npm run extract-single <file>` - Extract metadata from single FLAC file
- `npm run clean` - Clean build directory

## Content Creation

### Blog Posts

Create markdown files in `src/content/blog/`:

```markdown
---
title: "Post Title"
date: 2024-08-26
tags: ["music", "blog"]
description: "Post description"
---

# Post Content

Your blog post content here...
```

### Music Releases

1. Add FLAC files to `music-files/` directory
2. Run `npm run extract-music` to generate markdown files
3. Edit generated files in `src/content/music/` to add descriptions

The metadata extraction script automatically generates:
- Audio player with controls
- Download links for FLAC files
- Technical information (sample rate, bit depth, etc.)
- Track information (duration, file size, etc.)

## Deployment

See detailed deployment documentation:
- [Debian Server Setup](./docs/debian-server-setup.md)
- [Deployment Workflow](./docs/deployment-workflow.md)

### Quick Deployment Summary

1. Set up Debian server with nginx, SSL, Node.js
2. Sync files to server using rsync
3. Build on server: `npm ci && npm run build`
4. Configure nginx to serve generated files

## Requirements

- Node.js 16+ and npm
- ffmpeg/ffprobe (for FLAC metadata extraction)
- For deployment: Debian-based server with nginx

## Architecture

- **Static Site Generator**: 11ty (Eleventy)
- **Content Format**: Markdown with YAML frontmatter
- **Styling**: Pure CSS, no frameworks
- **Audio Format**: FLAC with HTML5 audio player fallback
- **Build Process**: Server-side generation with rsync deployment

## License

MIT License - see LICENSE file for details
