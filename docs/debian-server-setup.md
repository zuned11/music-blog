# Debian Server Deployment Guide

## System Requirements
- Debian 12 (bookworm) or compatible
- 2GB+ RAM (4GB+ recommended)
- 10GB+ disk space
- Domain name pointing to server IP

## Phase 1: Package Installation

### Update system and install required packages
```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install web server and security packages
sudo apt install -y nginx certbot python3-certbot-nginx fail2ban ufw ffmpeg

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
nginx -v
certbot --version  
fail2ban-server --version
ufw --version
ffmpeg -version
node --version
npm --version
```

## Phase 2: User Setup

### Create dedicated web user
```bash
# Create musicblog user
sudo adduser --system --group --home /var/www/musicblog --shell /bin/bash musicblog

# Add to www-data group
sudo usermod -a -G www-data musicblog

# Create necessary directories
sudo mkdir -p /var/www/musicblog/{source,public,logs}
sudo chown -R musicblog:www-data /var/www/musicblog
sudo chmod -R 755 /var/www/musicblog
```

## Phase 3: Security Configuration

### Configure UFW (Uncomplicated Firewall)
```bash
# Enable UFW
sudo ufw enable

# Allow SSH (adjust port if needed)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status verbose
```

### Configure fail2ban
```bash
# Copy default configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Enable and start fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl status fail2ban
```

## Phase 4: Nginx Configuration

### Basic virtual host setup
```bash
# Create site configuration
sudo tee /etc/nginx/sites-available/musicblog << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/musicblog/public;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        try_files $uri $uri/ =404;
    }

    # Serve FLAC files
    location /music/ {
        alias /var/www/musicblog/music-files/;
        add_header Content-Disposition "attachment";
    }

    # Logs
    access_log /var/www/musicblog/logs/access.log;
    error_log /var/www/musicblog/logs/error.log;
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/musicblog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL/HTTPS Setup
```bash
# Obtain SSL certificate (after DNS is configured)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## Phase 5: Build Environment

### Set up Node.js project
```bash
# Switch to web user
sudo -u musicblog -i

# Navigate to source directory
cd /var/www/musicblog/source

# Initialize project (copy package.json from development)
# npm install will be run after file sync

# Create build script
cat > build.sh << 'EOF'
#!/bin/bash
cd /var/www/musicblog/source
npm install
npm run build
EOF

chmod +x build.sh
```

## Commands Summary for Quick Reference

```bash
# Package installation
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx fail2ban ufw ffmpeg nodejs npm

# User and directory setup  
sudo adduser --system --group --home /var/www/musicblog --shell /bin/bash musicblog
sudo mkdir -p /var/www/musicblog/{source,public,logs,music-files}
sudo chown -R musicblog:www-data /var/www/musicblog

# Security
sudo ufw enable && sudo ufw allow 22,80,443/tcp
sudo systemctl enable fail2ban && sudo systemctl start fail2ban

# SSL (after domain configuration)
sudo certbot --nginx -d your-domain.com
```

## Next Steps
1. Configure DNS to point domain to server IP
2. Run SSL certificate setup
3. Deploy project files via rsync
4. Set up automated build process