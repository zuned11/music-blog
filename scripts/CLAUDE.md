# Claude Scripts Memory

This document tracks script locations and usage for Claude Code operations.

## Script Locations & Usage

### Remote Scripts (require SSH to blog-box server)
- **`scripts/rebuild.sh`** - Remote rebuild script
  - Usage: `scripts/rebuild.sh [build|extract-music|clean|status]`
  - Connects to `blog-box` SSH alias to run commands remotely
  - Requires SSH connection to server

- **`scripts/deploy-file.sh`** - Individual file deployment  
  - Usage: `scripts/deploy-file.sh <file-path> [--dry-run]`
  - For deploying single files to remote server
  - Auto-detects file type and target directory

### Local Scripts (for Claude to use directly)
- **`scripts/local-rebuild.sh`** - Local version of rebuild operations ✨
  - Usage: `scripts/local-rebuild.sh [build|extract-music|clean|status]`
  - Runs all operations locally without SSH
  - Created: 2025-08-26

- **`scripts/local-deploy.sh`** - Local deployment workflow ✨  
  - Usage: `scripts/local-deploy.sh [--build-only] [--status]`
  - Builds locally and shows deployment next steps
  - Created: 2025-08-26

## Claude Usage Guidelines

### For Building/Testing Locally:
```bash
# Build the site locally
scripts/local-rebuild.sh build

# Check project status  
scripts/local-rebuild.sh status

# Clean build directory
scripts/local-rebuild.sh clean

# Start dev server
scripts/local-rebuild.sh dev
```

### For Deployment Workflow:
```bash
# Build and show deployment steps
scripts/local-deploy.sh

# Just build (no deployment instructions)
scripts/local-deploy.sh --build-only
```

### For Remote Operations (if SSH available):
```bash
# Remote build
scripts/rebuild.sh build

# Remote status check
scripts/rebuild.sh status
```

## Important Notes

- **User handles rsync**: Claude should NOT attempt to sync files to remote server
- **SSH limitations**: Remote scripts may not work if SSH agent/keys not configured
- **Local scripts preferred**: Use local versions when possible for reliable execution
- **Memory updated**: 2025-08-26 - Added local script variants for Claude usage

## File Permissions
All scripts are marked executable (`chmod +x`).