#!/bin/bash

# Remote rebuild script for music blog
# Usage: ./rebuild.sh [build|extract-music|extract-single|clean|status] [file]

set -e

# Configuration
REMOTE_HOST="blog-box"
REMOTE_BASE="/home/blog/music-blog"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to show usage
show_usage() {
    echo "Remote Rebuild Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  build                    Build the static site (default)"
    echo "  extract-music           Extract metadata from all FLAC files"
    echo "  extract-single <file>   Extract metadata from single FLAC file"
    echo "  clean                   Clean build directory"
    echo "  status                  Show site build status and info"
    echo "  dev                     Start development server (use with caution)"
    echo ""
    echo "Examples:"
    echo "  $0                          # Build site"
    echo "  $0 build                    # Build site"
    echo "  $0 extract-music            # Process all FLAC files"
    echo "  $0 extract-single song.flac # Process single FLAC file"
    echo "  $0 clean                    # Clean build directory"
    echo "  $0 status                   # Show build status"
}

# Function to run remote command
run_remote_command() {
    local command="$1"
    local description="$2"
    
    log_info "$description"
    echo ""
    
    if ssh "$REMOTE_HOST" "cd '$REMOTE_BASE' && $command"; then
        echo ""
        log_success "Command completed successfully"
        return 0
    else
        echo ""
        log_error "Command failed"
        return 1
    fi
}

# Function to check remote status
check_remote_status() {
    log_info "Checking remote server status..."
    
    # Check if directory exists
    if ! ssh "$REMOTE_HOST" "test -d '$REMOTE_BASE'"; then
        log_error "Remote project directory not found: $REMOTE_BASE"
        return 1
    fi
    
    # Get basic project info
    echo ""
    log_info "=== Remote Project Status ==="
    
    # Check if node_modules exists
    if ssh "$REMOTE_HOST" "test -d '$REMOTE_BASE/node_modules'"; then
        log_success "Dependencies installed"
    else
        log_warn "Dependencies not installed (no node_modules directory)"
    fi
    
    # Check if public directory exists
    if ssh "$REMOTE_HOST" "test -d '$REMOTE_BASE/public'"; then
        log_success "Build directory exists"
        
        # Get last build time
        local build_time
        build_time=$(ssh "$REMOTE_HOST" "stat -f '%Sm' '$REMOTE_BASE/public' 2>/dev/null || stat -c '%y' '$REMOTE_BASE/public' 2>/dev/null || echo 'Unknown'")
        log_info "Last build: $build_time"
    else
        log_warn "No build directory found (site not built yet)"
    fi
    
    # Count content files
    local blog_count music_count flac_count
    blog_count=$(ssh "$REMOTE_HOST" "find '$REMOTE_BASE/src/content/blog' -name '*.md' 2>/dev/null | wc -l || echo 0")
    music_count=$(ssh "$REMOTE_HOST" "find '$REMOTE_BASE/src/content/music' -name '*.md' 2>/dev/null | wc -l || echo 0")
    flac_count=$(ssh "$REMOTE_HOST" "find '$REMOTE_BASE/music-files' -name '*.flac' 2>/dev/null | wc -l || echo 0")
    
    echo ""
    log_info "Content summary:"
    echo "  Blog posts: $blog_count"
    echo "  Music releases: $music_count"
    echo "  FLAC files: $flac_count"
    
    # Check package.json scripts
    echo ""
    log_info "Available npm scripts:"
    ssh "$REMOTE_HOST" "cd '$REMOTE_BASE' && npm run 2>/dev/null | grep -E '^  [a-z]' | sed 's/^  /    /' || echo '    Unable to fetch scripts'"
}

# Function to build site
build_site() {
    local start_time=$(date +%s)
    
    log_info "Building static site on remote server..."
    
    # Check if dependencies are installed
    if ! ssh "$REMOTE_HOST" "test -d '$REMOTE_BASE/node_modules'"; then
        log_warn "Dependencies not found, installing..."
        if ! run_remote_command "npm ci" "Installing dependencies"; then
            log_error "Failed to install dependencies"
            return 1
        fi
    fi
    
    # Run the build
    if run_remote_command "npm run build" "Building site"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        echo ""
        log_success "Site built successfully in ${duration} seconds"
        
        # Get build info
        local build_size
        build_size=$(ssh "$REMOTE_HOST" "du -sh '$REMOTE_BASE/public' 2>/dev/null | cut -f1 || echo 'Unknown'")
        log_info "Build size: $build_size"
        
        return 0
    else
        return 1
    fi
}

# Function to extract music metadata
extract_music_metadata() {
    local file="$1"
    
    if [[ -n "$file" ]]; then
        # Extract single file
        log_info "Extracting metadata from single file: $file"
        run_remote_command "npm run extract-single '$file'" "Processing $file"
    else
        # Extract all files
        log_info "Extracting metadata from all FLAC files..."
        run_remote_command "npm run extract-music" "Processing all FLAC files"
    fi
}

# Function to clean build
clean_build() {
    log_info "Cleaning build directory..."
    run_remote_command "npm run clean" "Cleaning build directory"
}

# Function to start dev server (with warning)
start_dev_server() {
    log_warn "Starting development server on remote machine"
    log_warn "This will keep running until you stop it with Ctrl+C"
    log_warn "The server will be accessible on the remote machine only"
    echo ""
    echo "Press Enter to continue or Ctrl+C to cancel..."
    read -r
    
    log_info "Starting development server (use Ctrl+C to stop)..."
    ssh -t "$REMOTE_HOST" "cd '$REMOTE_BASE' && npm run dev"
}

# Main script
main() {
    local command="build"
    local file=""
    
    # Parse arguments
    if [[ $# -gt 0 ]]; then
        command="$1"
        shift
    fi
    
    if [[ $# -gt 0 ]]; then
        file="$1"
    fi
    
    case "$command" in
        --help|-h|help)
            show_usage
            exit 0
            ;;
        build)
            ;;
        extract-music)
            ;;
        extract-single)
            if [[ -z "$file" ]]; then
                log_error "extract-single requires a filename"
                echo ""
                show_usage
                exit 1
            fi
            ;;
        clean)
            ;;
        status)
            ;;
        dev)
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
    
    # Test SSH connection
    log_info "Testing connection to $REMOTE_HOST..."
    if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$REMOTE_HOST" "echo 'Connection successful'" >/dev/null 2>&1; then
        log_error "Cannot connect to $REMOTE_HOST"
        log_error "Please ensure SSH alias 'blog-box' is configured and accessible"
        exit 1
    fi
    
    # Execute command
    case "$command" in
        build)
            build_site
            ;;
        extract-music)
            extract_music_metadata
            ;;
        extract-single)
            extract_music_metadata "$file"
            ;;
        clean)
            clean_build
            ;;
        status)
            check_remote_status
            ;;
        dev)
            start_dev_server
            ;;
    esac
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi