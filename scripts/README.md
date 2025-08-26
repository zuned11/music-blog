# Deployment Scripts

This directory contains bash scripts for deploying content to your music blog server. All scripts use the `blog-box` SSH alias to connect to your remote server.

## Prerequisites

1. **SSH Configuration**: Set up an SSH alias called `blog-box` in your `~/.ssh/config`:
   ```
   Host blog-box
       HostName your-server.com
       User blog
       Port 22
       IdentityFile ~/.ssh/your-key
   ```

2. **SSH Key Authentication**: Ensure passwordless SSH authentication is configured.

3. **Remote Setup**: The target server should have the music blog project at `/home/blog/music-blog/`.

## Scripts Overview

### 🚀 deploy-file.sh - Universal File Deployment
Deploy any single file to the appropriate location based on file type.

```bash
./deploy-file.sh <file-path> [--dry-run]
```

**Examples:**
```bash
./deploy-file.sh ~/my-post.md                    # Deploy blog post
./deploy-file.sh ~/my-track.flac                 # Deploy music file
./deploy-file.sh ~/my-post.md --dry-run          # Preview deployment
```

**File Routing:**
- `*.flac` → `music-files/` directory
- `*.md` (blog content) → `src/content/blog/`
- `*.md` (music content) → `src/content/music/` (auto-detected)
- Other files → project root

### 🎵 upload-music.sh - FLAC File Upload
Specialized script for uploading FLAC music files with validation and optional metadata extraction.

```bash
./upload-music.sh <flac-file-path> [--extract] [--dry-run]
```

**Examples:**
```bash
./upload-music.sh ~/track.flac                   # Upload FLAC file
./upload-music.sh ~/track.flac --extract         # Upload and extract metadata
./upload-music.sh ~/track.flac --dry-run         # Preview upload
```

**Features:**
- Validates FLAC file format
- Shows file size warnings for large files
- Optional automatic metadata extraction
- Checks for existing files before overwriting

### 📝 upload-blog.sh - Blog Post Upload
Upload markdown blog posts with automatic content type detection.

```bash
./upload-blog.sh <markdown-file-path> [--music] [--dry-run]
```

**Examples:**
```bash
./upload-blog.sh ~/post.md                       # Upload as blog post
./upload-blog.sh ~/review.md --music             # Upload as music content
./upload-blog.sh ~/post.md --dry-run             # Preview upload
```

**Features:**
- Validates markdown frontmatter
- Auto-detects music content vs blog posts
- Shows title and date from frontmatter
- Manual override with `--music` flag

### 🔧 rebuild.sh - Remote Site Management
Execute build commands on the remote server.

```bash
./rebuild.sh [command] [options]
```

**Commands:**
```bash
./rebuild.sh                          # Build site (default)
./rebuild.sh build                     # Build site
./rebuild.sh extract-music             # Process all FLAC files
./rebuild.sh extract-single song.flac  # Process single FLAC file
./rebuild.sh clean                     # Clean build directory
./rebuild.sh status                    # Show site status
./rebuild.sh dev                       # Start dev server (use with caution)
```

**Features:**
- Automatic dependency installation check
- Build timing and size reporting
- Content file counting
- Development server management

### 📦 bulk-deploy.sh - Multiple File Deployment
Deploy multiple files at once with automatic categorization.

```bash
./bulk-deploy.sh <file1> [file2] [...] [--extract] [--dry-run]
```

**Examples:**
```bash
./bulk-deploy.sh post1.md post2.md track.flac     # Deploy multiple files
./bulk-deploy.sh *.md                             # Deploy all markdown files
./bulk-deploy.sh ~/music/*.flac --extract         # Deploy FLAC files with extraction
./bulk-deploy.sh file1.md file2.flac --dry-run    # Preview deployment
```

**Features:**
- Automatic file categorization
- Batch rsync for efficiency
- Optional metadata extraction for FLAC files
- Deployment summary reporting

## Common Workflows

### Publishing a New Blog Post
```bash
# Option 1: Single script
./upload-blog.sh ~/my-new-post.md
./rebuild.sh build

# Option 2: Universal script
./deploy-file.sh ~/my-new-post.md
./rebuild.sh build
```

### Adding New Music
```bash
# Upload and process FLAC file
./upload-music.sh ~/new-track.flac --extract

# Edit the generated markdown file (locally or on server)
# Then build the site
./rebuild.sh build
```

### Bulk Content Update
```bash
# Deploy multiple files at once
./bulk-deploy.sh ~/content/*.md ~/music/*.flac --extract
./rebuild.sh build
```

### Development Workflow
```bash
# Check current site status
./rebuild.sh status

# Deploy changes
./deploy-file.sh ~/updated-post.md

# Rebuild and check
./rebuild.sh build
./rebuild.sh status
```

## Script Options

All scripts support these common options:

- `--dry-run`: Preview what would be done without making changes
- `--help` or `-h`: Show usage information

### Security Features

- **Connection Testing**: All scripts test SSH connectivity before proceeding
- **File Validation**: Content validation for FLAC and markdown files  
- **Confirmation Prompts**: Ask before overwriting existing files
- **Error Handling**: Graceful failure handling with helpful error messages

### Logging and Feedback

Scripts provide colored output for easy reading:
- 🔵 **INFO**: General information and progress
- 🟢 **SUCCESS**: Successful operations
- 🟡 **WARN**: Warnings and non-critical issues
- 🔴 **ERROR**: Errors and failures

## Troubleshooting

### SSH Connection Issues
```bash
# Test your SSH configuration
ssh blog-box 'echo "Connection successful"'

# Check your SSH config
cat ~/.ssh/config | grep -A 5 "Host blog-box"
```

### Permission Issues
```bash
# Ensure scripts are executable
chmod +x scripts/*.sh

# Check remote directory permissions
ssh blog-box 'ls -la /home/blog/music-blog'
```

### Build Issues
```bash
# Check remote status and logs
./rebuild.sh status

# Clean and rebuild
./rebuild.sh clean
./rebuild.sh build
```

### File Transfer Issues
```bash
# Use dry-run to test without transferring
./deploy-file.sh ~/file.md --dry-run

# Check remote disk space
ssh blog-box 'df -h'
```

## Integration with Local Development

These scripts are designed to work from any machine with the proper SSH setup. You can:

1. Clone the repository to your local development machine
2. Set up the `blog-box` SSH alias
3. Use the scripts to deploy content to your server
4. Keep your local copy in sync with git

The scripts complement the existing local development workflow while providing seamless deployment capabilities.