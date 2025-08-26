# Music Blog Deployment Workflow

This document outlines the complete workflow from development to production deployment.

## Development Workflow (Raspberry Pi)

### 1. Content Creation

**Blog Posts:**
- Write in Obsidian using markdown
- Save to local sync directory
- Use standard frontmatter format

**Music Content:**
1. Place FLAC files in `music-files/` directory
2. Run metadata extraction: `npm run extract-music`
3. Review and edit generated markdown files in `src/content/music/`
4. Build and test locally: `npm run dev`

### 2. Local Development Commands

```bash
# Start development server
npm run dev

# Extract metadata from all FLAC files
npm run extract-music

# Extract metadata from single file
npm run extract-single path/to/song.flac

# Build for production
npm run build

# Clean build directory
npm run clean
```

### 3. Testing

```bash
# Build and verify no errors
npm run build

# Check generated files
ls -la public/

# Test local server
npm start
# Visit http://localhost:8080
```

## Deployment to Debian Server

### 1. Server Preparation (One-time setup)

Follow the [Debian Server Setup Guide](./debian-server-setup.md) to:
- Install required packages
- Configure nginx, SSL, security
- Set up web user and directories

### 2. File Synchronization

**From Development Machine to Server:**

```bash
# Sync source files (exclude node_modules and build files)
rsync -av --exclude='node_modules' --exclude='public' --exclude='.git' \
  /path/to/local/music-blog/ user@server:/var/www/musicblog/source/

# Sync FLAC files separately (if needed)
rsync -av /path/to/local/music-blog/music-files/ \
  user@server:/var/www/musicblog/music-files/
```

**Automated sync script (create on local machine):**

```bash
#!/bin/bash
# deploy.sh

SERVER="your-server.com"
USER="musicblog"
LOCAL_DIR="/path/to/music-blog"
REMOTE_DIR="/var/www/musicblog/source"

echo "Syncing files to $SERVER..."

# Sync source files
rsync -av --delete \
  --exclude='node_modules' \
  --exclude='public' \
  --exclude='.git' \
  --exclude='*.log' \
  $LOCAL_DIR/ $USER@$SERVER:$REMOTE_DIR/

# Sync music files (no delete to preserve existing files)
rsync -av \
  $LOCAL_DIR/music-files/ $USER@$SERVER:/var/www/musicblog/music-files/

echo "Build and deploy on server..."
ssh $USER@$SERVER 'cd /var/www/musicblog/source && npm ci && npm run build'

echo "Deployment complete!"
```

### 3. Server-side Build Process

**SSH to server and build:**

```bash
# SSH to server
ssh musicblog@your-server.com

# Navigate to source directory
cd /var/www/musicblog/source

# Install/update dependencies
npm ci

# Build site
npm run build

# Copy built files to web root
cp -r public/* /var/www/musicblog/public/

# Set correct permissions
sudo chown -R musicblog:www-data /var/www/musicblog/public
sudo chmod -R 755 /var/www/musicblog/public
```

### 4. Automated Server Build Script

**Create on server: `/var/www/musicblog/build.sh`**

```bash
#!/bin/bash
# build.sh - Server build script

cd /var/www/musicblog/source

echo "Installing dependencies..."
npm ci

echo "Building site..."
npm run build

echo "Copying files to web directory..."
cp -r public/* /var/www/musicblog/public/

echo "Setting permissions..."
chown -R musicblog:www-data /var/www/musicblog/public
chmod -R 755 /var/www/musicblog/public

echo "Reloading nginx..."
sudo systemctl reload nginx

echo "Build complete! Site updated."
```

Make executable: `chmod +x /var/www/musicblog/build.sh`

## File Watching and Auto-rebuild (Optional)

**Install file watcher on server:**

```bash
# Install inotify-tools
sudo apt install inotify-tools

# Create watch script: /var/www/musicblog/watch.sh
#!/bin/bash
while inotifywait -r -e modify,create,delete /var/www/musicblog/source/src; do
    echo "Changes detected, rebuilding..."
    /var/www/musicblog/build.sh
done
```

**Create systemd service for auto-rebuild:**

```bash
# /etc/systemd/system/musicblog-watch.service
[Unit]
Description=Music Blog Auto-rebuild
After=network.target

[Service]
Type=simple
User=musicblog
WorkingDirectory=/var/www/musicblog
ExecStart=/var/www/musicblog/watch.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable: `sudo systemctl enable musicblog-watch && sudo systemctl start musicblog-watch`

## Content Management Workflow

### Adding New Music

1. **Local Development:**
   - Add FLAC file to `music-files/`
   - Run `npm run extract-music`
   - Edit generated markdown in `src/content/music/`
   - Test with `npm run dev`

2. **Deploy:**
   - Run deployment script
   - Verify on live site

### Adding Blog Posts

1. **Write in Obsidian**
2. **Copy to `src/content/blog/`**
3. **Test locally**
4. **Deploy**

### Maintenance Tasks

**Weekly:**
- Check server logs: `tail -f /var/www/musicblog/logs/access.log`
- Verify SSL certificate: `sudo certbot certificates`
- Update dependencies: `npm audit && npm update`

**Monthly:**
- Server updates: `sudo apt update && sudo apt upgrade`
- Backup content: `rsync -av server:/var/www/musicblog/source/ ./backup/`

## Troubleshooting

**Build fails:**
- Check Node.js version: `node --version`
- Clear npm cache: `npm cache clean --force`
- Remove and reinstall: `rm -rf node_modules && npm install`

**Audio files not loading:**
- Check file permissions: `ls -la /var/www/musicblog/music-files/`
- Verify nginx config for music file serving
- Check browser developer tools for errors

**Site not updating:**
- Verify files synced: `ls -la /var/www/musicblog/source/`
- Check build output: `npm run build`
- Restart nginx: `sudo systemctl restart nginx`

## Security Notes

- Never commit FLAC files to git (large files)
- Use SSH keys for server access
- Keep server packages updated
- Monitor access logs for suspicious activity
- Regularly backup both source files and music files