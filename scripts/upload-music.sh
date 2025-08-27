#!/bin/bash

# Music file upload script for FLAC files
# Usage: ./upload-music.sh <flac-file-path> [--extract] [--dry-run]

set -e

# Configuration
REMOTE_HOST="blog-box"
REMOTE_BASE="/home/blog/music-blog"
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
    echo "Music File Upload Script"
    echo ""
    echo "Usage: $0 <flac-file-path> [options]"
    echo ""
    echo "Arguments:"
    echo "  flac-file-path    Path to the FLAC file to upload"
    echo ""
    echo "Options:"
    echo "  --extract         Automatically run metadata extraction after upload"
    echo "  --dry-run         Show what would be transferred without actually doing it"
    echo "  --help, -h        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 ~/my-track.flac                    # Upload FLAC file"
    echo "  $0 ~/my-song.mp3                      # Upload MP3 file"
    echo "  $0 ~/my-track.wav --extract           # Upload WAV and extract metadata"
    echo "  $0 ~/my-track.flac --dry-run          # Preview upload"
    echo ""
    echo "Supported formats: FLAC, MP3, WAV, AIF/AIFF, OGG, M4A, AAC"
}

# Function to validate audio file
validate_audio_file() {
    local file_path="$1"
    
    # Check if file exists
    if [[ ! -f "$file_path" ]]; then
        log_error "File does not exist: $file_path"
        return 1
    fi
    
    # Check file extension
    local filename=$(basename "$file_path")
    local extension="${filename##*.}"
    
    case "${extension,,}" in
        flac|mp3|wav|aif|aiff|ogg|m4a|aac)
            log_info "Detected audio format: ${extension^^}"
            ;;
        *)
            log_error "Unsupported audio format: $filename"
            log_error "Supported formats: FLAC, MP3, WAV, AIF/AIFF, OGG, M4A, AAC"
            return 1
            ;;
    esac
    
    # Check file size (warn if too large)
    local file_size=$(stat -f%z "$file_path" 2>/dev/null || stat -c%s "$file_path" 2>/dev/null || echo "0")
    local size_mb=$((file_size / 1024 / 1024))
    
    if [[ $size_mb -gt 100 ]]; then
        log_warn "Large file detected: ${size_mb}MB"
        log_warn "Upload may take some time"
    fi
    
    # Try to get basic file info (if ffprobe is available)
    if command -v ffprobe >/dev/null 2>&1; then
        log_info "Validating audio file format..."
        if ! ffprobe -v quiet -print_format json -show_format "$file_path" >/dev/null 2>&1; then
            log_warn "File may be corrupted or not a valid audio file"
            log_warn "Proceeding anyway..."
        else
            log_success "Audio file validation passed"
        fi
    fi
    
    return 0
}

# Function to upload FLAC file
upload_flac() {
    local source_file="$1"
    local dry_run="$2"
    local extract="$3"
    
    # Validate file
    if ! validate_audio_file "$source_file"; then
        return 1
    fi
    
    # Get absolute path and filename
    source_file=$(realpath "$source_file")
    local filename=$(basename "$source_file")
    local remote_path="$REMOTE_HOST:$REMOTE_BASE/$MUSIC_FILES_DIR"
    
    # Prepare rsync command
    local rsync_opts="-avz --progress"
    if [[ "$dry_run" == "true" ]]; then
        rsync_opts="$rsync_opts --dry-run"
        log_warn "DRY RUN - No files will be transferred"
    fi
    
    # Show upload details
    log_info "Source file: $source_file"
    log_info "Target: $remote_path/"
    log_info "Filename: $filename"
    
    # Check if file already exists on remote (if not dry run)
    if [[ "$dry_run" != "true" ]]; then
        log_info "Checking if file already exists on remote..."
        if ssh "$REMOTE_HOST" "test -f '$REMOTE_BASE/$MUSIC_FILES_DIR/$filename'"; then
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
            log_success "FLAC file uploaded successfully: $filename"
            
            # Run metadata extraction if requested
            if [[ "$extract" == "true" ]]; then
                echo ""
                log_info "Running metadata extraction on remote server..."
                
                if ssh "$REMOTE_HOST" "cd '$REMOTE_BASE' && npm run extract-single '$MUSIC_FILES_DIR/$filename'"; then
                    log_success "Metadata extraction completed"
                    
                    echo ""
                    log_info "Next steps:"
                    echo "  1. Edit the generated markdown file in src/content/music/"
                    echo "  2. Add description and any additional information"
                    echo "  3. Run: ./rebuild.sh build"
                else
                    log_error "Metadata extraction failed"
                    log_info "You can run it manually later with:"
                    echo "  ssh blog-box 'cd $REMOTE_BASE && npm run extract-single $MUSIC_FILES_DIR/$filename'"
                fi
            else
                echo ""
                log_info "Next steps:"
                echo "  1. Extract metadata: ./rebuild.sh extract-music"
                echo "  2. Edit generated markdown in src/content/music/"
                echo "  3. Rebuild site: ./rebuild.sh build"
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
    local extract="false"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --extract)
                extract="true"
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
        log_error "No FLAC file specified"
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
    
    # Ensure remote directory exists
    log_info "Ensuring remote directory exists..."
    if ! ssh "$REMOTE_HOST" "mkdir -p '$REMOTE_BASE/$MUSIC_FILES_DIR'"; then
        log_error "Failed to create remote directory"
        exit 1
    fi
    
    # Upload the file
    upload_flac "$source_file" "$dry_run" "$extract"
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi