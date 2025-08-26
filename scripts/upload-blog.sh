#!/bin/bash

# Blog post upload script for Markdown files
# Usage: ./upload-blog.sh <markdown-file-path> [--music] [--dry-run]

set -e

# Configuration
REMOTE_HOST="blog-box"
REMOTE_BASE="/home/blog/music-blog"
BLOG_DIR="src/content/blog"
MUSIC_DIR="src/content/music"

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
    echo "Blog Post Upload Script"
    echo ""
    echo "Usage: $0 <markdown-file-path> [options]"
    echo ""
    echo "Arguments:"
    echo "  markdown-file-path    Path to the Markdown file to upload"
    echo ""
    echo "Options:"
    echo "  --music               Upload as music content (goes to src/content/music/)"
    echo "  --dry-run             Show what would be transferred without actually doing it"
    echo "  --help, -h            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 ~/my-post.md                      # Upload as blog post"
    echo "  $0 ~/track-review.md --music         # Upload as music content"
    echo "  $0 ~/my-post.md --dry-run            # Preview upload"
}

# Function to validate markdown file
validate_markdown_file() {
    local file_path="$1"
    
    # Check if file exists
    if [[ ! -f "$file_path" ]]; then
        log_error "File does not exist: $file_path"
        return 1
    fi
    
    # Check file extension
    local filename=$(basename "$file_path")
    local extension="${filename##*.}"
    
    if [[ "${extension,,}" != "md" ]]; then
        log_error "File is not a Markdown file: $filename"
        log_error "Only Markdown files are supported (.md extension required)"
        return 1
    fi
    
    # Check file content - should have frontmatter
    local content=$(head -20 "$file_path")
    if [[ ! "$content" =~ ^--- ]]; then
        log_warn "File doesn't appear to have YAML frontmatter"
        log_warn "Make sure your file starts with '---' and includes title, date, etc."
    else
        log_success "Markdown file validation passed"
        
        # Extract and show some frontmatter info
        local title=$(grep -E "^title:" "$file_path" | head -1 | sed 's/title: *//; s/"//g; s/'\''//g' || echo "")
        local date=$(grep -E "^date:" "$file_path" | head -1 | sed 's/date: *//' || echo "")
        
        if [[ -n "$title" ]]; then
            log_info "Title: $title"
        fi
        if [[ -n "$date" ]]; then
            log_info "Date: $date"
        fi
    fi
    
    return 0
}

# Function to determine target directory
get_target_directory() {
    local file_path="$1"
    local force_music="$2"
    
    if [[ "$force_music" == "true" ]]; then
        echo "$MUSIC_DIR"
        return
    fi
    
    # Auto-detect based on file content or path
    local filename=$(basename "$file_path")
    local file_content=$(cat "$file_path")
    
    # Check for music-related keywords in path or content
    if [[ "$file_path" == *"music"* ]] || \
       [[ "$filename" == *"track"* ]] || \
       [[ "$filename" == *"song"* ]] || \
       [[ "$filename" == *"album"* ]] || \
       [[ "$file_content" == *"layout: music"* ]] || \
       [[ "$file_content" == *"tags:"*"music"* ]]; then
        echo "$MUSIC_DIR"
    else
        echo "$BLOG_DIR"
    fi
}

# Function to upload markdown file
upload_markdown() {
    local source_file="$1"
    local dry_run="$2"
    local force_music="$3"
    
    # Validate file
    if ! validate_markdown_file "$source_file"; then
        return 1
    fi
    
    # Get absolute path and filename
    source_file=$(realpath "$source_file")
    local filename=$(basename "$source_file")
    
    # Determine target directory
    local target_dir=$(get_target_directory "$source_file" "$force_music")
    local remote_path="$REMOTE_HOST:$REMOTE_BASE/$target_dir"
    
    # Prepare rsync command
    local rsync_opts="-avz --progress"
    if [[ "$dry_run" == "true" ]]; then
        rsync_opts="$rsync_opts --dry-run"
        log_warn "DRY RUN - No files will be transferred"
    fi
    
    # Show upload details
    log_info "Source file: $source_file"
    log_info "Target directory: $target_dir"
    log_info "Remote path: $remote_path/"
    log_info "Filename: $filename"
    
    # Check if file already exists on remote (if not dry run)
    if [[ "$dry_run" != "true" ]]; then
        log_info "Checking if file already exists on remote..."
        if ssh "$REMOTE_HOST" "test -f '$REMOTE_BASE/$target_dir/$filename'"; then
            log_warn "File already exists on remote: $filename"
            echo -n "Overwrite? (y/N): "
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                log_info "Upload cancelled"
                return 0
            fi
        fi
    fi
    
    # Execute rsync
    echo ""
    log_info "Starting upload..."
    
    if rsync $rsync_opts "$source_file" "$remote_path/"; then
        if [[ "$dry_run" == "true" ]]; then
            log_success "Dry run completed successfully"
        else
            log_success "Markdown file uploaded successfully: $filename"
            
            echo ""
            if [[ "$target_dir" == "$MUSIC_DIR" ]]; then
                log_info "Uploaded as music content"
                log_info "Next steps:"
                echo "  1. Rebuild site: ./rebuild.sh build"
                echo "  2. Check the music section of your site"
            else
                log_info "Uploaded as blog post"
                log_info "Next steps:"
                echo "  1. Rebuild site: ./rebuild.sh build"
                echo "  2. Check the blog section of your site"
            fi
        fi
    else
        log_error "Upload failed"
        return 1
    fi
}

# Main script
main() {
    local source_file=""
    local dry_run="false"
    local force_music="false"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --music)
                force_music="true"
                shift
                ;;
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
                    log_error "Only one file can be specified"
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Check if file is provided
    if [[ -z "$source_file" ]]; then
        log_error "No Markdown file specified"
        show_usage
        exit 1
    fi
    
    # Test SSH connection
    log_info "Testing connection to $REMOTE_HOST..."
    if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$REMOTE_HOST" "echo 'Connection successful'" >/dev/null 2>&1; then
        log_error "Cannot connect to $REMOTE_HOST"
        log_error "Please ensure SSH alias 'blog-box' is configured and accessible"
        exit 1
    fi
    
    # Ensure remote directories exist
    log_info "Ensuring remote directories exist..."
    if ! ssh "$REMOTE_HOST" "mkdir -p '$REMOTE_BASE/$BLOG_DIR' '$REMOTE_BASE/$MUSIC_DIR'"; then
        log_error "Failed to create remote directories"
        exit 1
    fi
    
    # Upload the file
    upload_markdown "$source_file" "$dry_run" "$force_music"
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi