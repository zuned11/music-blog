#!/bin/bash

# Universal file deployment script for music blog
# Usage: ./deploy-file.sh <file-path> [--dry-run]

set -e

# Configuration
REMOTE_HOST="blog-box"
REMOTE_BASE="/home/blog/music-blog"
BLOG_DIR="src/content/blog"
MUSIC_DIR="src/content/music" 
MUSIC_FILES_DIR="music-files"

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
    echo "Universal File Deployment Script"
    echo ""
    echo "Usage: $0 <file-path> [--dry-run]"
    echo ""
    echo "Arguments:"
    echo "  file-path    Path to the file to deploy"
    echo "  --dry-run    Show what would be transferred without actually doing it"
    echo ""
    echo "Examples:"
    echo "  $0 ~/my-post.md                    # Deploy blog post"
    echo "  $0 ~/my-track.flac                 # Deploy music file"
    echo "  $0 ~/my-post.md --dry-run          # Preview deployment"
    echo ""
    echo "File Types:"
    echo "  *.md         -> Deployed to blog or music content based on location"
    echo "  *.flac       -> Deployed to music-files directory"
    echo "  Other files  -> Deployed to project root"
}

# Function to determine target directory based on file type and name
get_target_dir() {
    local file_path="$1"
    local filename=$(basename "$file_path")
    local extension="${filename##*.}"
    
    case "$extension" in
        "flac")
            echo "$MUSIC_FILES_DIR"
            ;;
        "md")
            # Check if it's in a music-related directory or has music keywords
            if [[ "$file_path" == *"music"* ]] || [[ "$filename" == *"track"* ]] || [[ "$filename" == *"song"* ]]; then
                echo "$MUSIC_DIR"
            else
                echo "$BLOG_DIR"
            fi
            ;;
        *)
            # For other files, deploy to project root
            echo ""
            ;;
    esac
}

# Function to deploy file
deploy_file() {
    local source_file="$1"
    local dry_run="$2"
    
    # Validate source file exists
    if [[ ! -f "$source_file" ]]; then
        log_error "File does not exist: $source_file"
        return 1
    fi
    
    # Get absolute path
    source_file=$(realpath "$source_file")
    local filename=$(basename "$source_file")
    
    # Determine target directory
    local target_dir=$(get_target_dir "$source_file")
    local remote_path="$REMOTE_HOST:$REMOTE_BASE"
    
    if [[ -n "$target_dir" ]]; then
        remote_path="$remote_path/$target_dir"
        log_info "Target directory: $target_dir"
    else
        log_info "Target directory: project root"
    fi
    
    # Prepare rsync command
    local rsync_opts="-avz --progress"
    if [[ "$dry_run" == "true" ]]; then
        rsync_opts="$rsync_opts --dry-run"
        log_warn "DRY RUN - No files will be transferred"
    fi
    
    # Show what will be deployed
    log_info "Source: $source_file"
    log_info "Target: $remote_path/"
    log_info "File: $filename"
    
    # Execute rsync
    echo ""
    log_info "Starting deployment..."
    
    if rsync $rsync_opts "$source_file" "$remote_path/"; then
        if [[ "$dry_run" == "true" ]]; then
            log_success "Dry run completed successfully"
        else
            log_success "File deployed successfully: $filename"
            
            # Suggest next steps based on file type
            local extension="${filename##*.}"
            case "$extension" in
                "flac")
                    echo ""
                    log_info "Next steps:"
                    echo "  1. Run metadata extraction: ./rebuild.sh extract-music"
                    echo "  2. Rebuild site: ./rebuild.sh build"
                    ;;
                "md")
                    echo ""
                    log_info "Next steps:"
                    echo "  1. Rebuild site: ./rebuild.sh build"
                    ;;
            esac
        fi
    else
        log_error "Deployment failed"
        return 1
    fi
}

# Main script
main() {
    local source_file=""
    local dry_run="false"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                dry_run="true"
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                if [[ -z "$source_file" ]]; then
                    source_file="$1"
                else
                    log_error "Multiple files specified. Use bulk-deploy.sh for multiple files."
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Check if file is provided
    if [[ -z "$source_file" ]]; then
        log_error "No file specified"
        show_usage
        exit 1
    fi
    
    # Test SSH connection
    log_info "Testing connection to $REMOTE_HOST..."
    if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$REMOTE_HOST" "echo 'Connection successful'" >/dev/null 2>&1; then
        log_error "Cannot connect to $REMOTE_HOST"
        log_error "Please ensure:"
        log_error "  1. SSH alias 'blog-box' is configured in ~/.ssh/config"
        log_error "  2. SSH keys are set up for passwordless authentication"
        log_error "  3. The remote server is accessible"
        exit 1
    fi
    
    # Deploy the file
    deploy_file "$source_file" "$dry_run"
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi