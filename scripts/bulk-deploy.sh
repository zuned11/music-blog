#!/bin/bash

# Bulk deployment script for multiple files
# Usage: ./bulk-deploy.sh <file1> <file2> ... [--dry-run] [--extract]

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
    echo "Bulk Deployment Script"
    echo ""
    echo "Usage: $0 <file1> [file2] [...] [options]"
    echo ""
    echo "Arguments:"
    echo "  file1, file2, ...    Paths to files to deploy"
    echo ""
    echo "Options:"
    echo "  --extract            Run metadata extraction after audio uploads"
    echo "  --dry-run            Show what would be transferred without actually doing it"
    echo "  --help, -h           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 post1.md post2.md track.flac     # Deploy multiple files"
    echo "  $0 *.md                             # Deploy all markdown files"
    echo "  $0 ~/music/*.mp3 --extract          # Deploy MP3 files with extraction"
    echo "  $0 ~/music/*.flac --extract         # Deploy FLAC files with extraction"
    echo "  $0 file1.md file2.wav --dry-run     # Preview deployment"
    echo ""
    echo "File Types:"
    echo "  *.md                     -> Routed to blog or music content directories"
    echo "  *.flac,*.mp3,*.wav,etc   -> Routed to music-files directory"
    echo "  Others                   -> Routed to project root"
    echo ""
    echo "Supported audio formats: FLAC, MP3, WAV, AIF/AIFF, OGG, M4A, AAC"
}

# Function to categorize files
categorize_files() {
    local files=("$@")
    local blog_files=()
    local music_files=()
    local audio_files=()
    local other_files=()
    
    for file in "${files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_warn "File not found, skipping: $file"
            continue
        fi
        
        local filename=$(basename "$file")
        local extension="${filename##*.}"
        
        case "${extension,,}" in
            "flac"|"mp3"|"wav"|"aif"|"aiff"|"ogg"|"m4a"|"aac")
                audio_files+=("$file")
                ;;
            "md")
                # Determine if it's blog or music content
                if [[ "$file" == *"music"* ]] || [[ "$filename" == *"track"* ]] || [[ "$filename" == *"song"* ]]; then
                    music_files+=("$file")
                else
                    # Check file content for music indicators
                    if grep -q "layout: music\|tags:.*music" "$file" 2>/dev/null; then
                        music_files+=("$file")
                    else
                        blog_files+=("$file")
                    fi
                fi
                ;;
            *)
                other_files+=("$file")
                ;;
        esac
    done
    
    # Return results via global arrays
    BLOG_FILES=("${blog_files[@]}")
    MUSIC_FILES=("${music_files[@]}")
    AUDIO_FILES=("${audio_files[@]}")
    OTHER_FILES=("${other_files[@]}")
}

# Function to deploy files to a specific directory
deploy_files_to_dir() {
    local target_dir="$1"
    local description="$2"
    local dry_run="$3"
    shift 3
    local files=("$@")
    
    if [[ ${#files[@]} -eq 0 ]]; then
        return 0
    fi
    
    log_info "Deploying ${#files[@]} file(s) to $description"
    
    local remote_path="$REMOTE_HOST:$REMOTE_BASE"
    if [[ -n "$target_dir" ]]; then
        remote_path="$remote_path/$target_dir"
    fi
    
    # Prepare rsync command
    local rsync_opts="-avz --progress"
    if [[ "$dry_run" == "true" ]]; then
        rsync_opts="$rsync_opts --dry-run"
    fi
    
    # Show files being deployed
    for file in "${files[@]}"; do
        local filename=$(basename "$file")
        echo "  → $filename"
    done
    
    # Execute rsync
    echo ""
    if rsync $rsync_opts "${files[@]}" "$remote_path/"; then
        log_success "Deployed ${#files[@]} file(s) to $description"
        return 0
    else
        log_error "Failed to deploy files to $description"
        return 1
    fi
}

# Function to show deployment summary
show_deployment_summary() {
    local blog_count=$1
    local music_count=$2
    local audio_count=$3
    local other_count=$4
    local dry_run=$5
    
    echo ""
    log_info "=== Deployment Summary ==="
    
    if [[ "$dry_run" == "true" ]]; then
        echo "DRY RUN - No files were actually transferred"
    fi
    
    echo "Files processed:"
    echo "  Blog posts: $blog_count"
    echo "  Music content: $music_count"
    echo "  Audio files: $audio_count"
    echo "  Other files: $other_count"
    echo "  Total: $((blog_count + music_count + audio_count + other_count))"
    
    if [[ "$dry_run" != "true" ]]; then
        echo ""
        log_info "Next steps:"
        if [[ $audio_count -gt 0 ]]; then
            echo "  1. Extract metadata: ./rebuild.sh extract-music"
            echo "  2. Edit generated markdown files in src/content/music/"
            echo "  3. Rebuild site: ./rebuild.sh build"
        else
            echo "  1. Rebuild site: ./rebuild.sh build"
        fi
    fi
}

# Main script
main() {
    local files=()
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
                files+=("$1")
                shift
                ;;
        esac
    done
    
    # Check if files are provided
    if [[ ${#files[@]} -eq 0 ]]; then
        log_error "No files specified"
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
    if ! ssh "$REMOTE_HOST" "mkdir -p '$REMOTE_BASE/src/content/blog' '$REMOTE_BASE/src/content/music' '$REMOTE_BASE/music-files'"; then
        log_error "Failed to create remote directories"
        exit 1
    fi
    
    # Categorize files
    log_info "Categorizing ${#files[@]} file(s)..."
    categorize_files "${files[@]}"
    
    if [[ "$dry_run" == "true" ]]; then
        log_warn "DRY RUN - No files will be transferred"
    fi
    
    # Deploy files by category
    local success=true
    
    # Deploy blog posts
    if [[ ${#BLOG_FILES[@]} -gt 0 ]]; then
        echo ""
        if ! deploy_files_to_dir "src/content/blog" "blog content" "$dry_run" "${BLOG_FILES[@]}"; then
            success=false
        fi
    fi
    
    # Deploy music content
    if [[ ${#MUSIC_FILES[@]} -gt 0 ]]; then
        echo ""
        if ! deploy_files_to_dir "src/content/music" "music content" "$dry_run" "${MUSIC_FILES[@]}"; then
            success=false
        fi
    fi
    
    # Deploy audio files
    if [[ ${#AUDIO_FILES[@]} -gt 0 ]]; then
        echo ""
        if ! deploy_files_to_dir "music-files" "audio files" "$dry_run" "${AUDIO_FILES[@]}"; then
            success=false
        fi
    fi
    
    # Deploy other files
    if [[ ${#OTHER_FILES[@]} -gt 0 ]]; then
        echo ""
        if ! deploy_files_to_dir "" "project root" "$dry_run" "${OTHER_FILES[@]}"; then
            success=false
        fi
    fi
    
    # Run metadata extraction if requested and successful
    if [[ "$success" == "true" && "$dry_run" != "true" && "$extract" == "true" && ${#AUDIO_FILES[@]} -gt 0 ]]; then
        echo ""
        log_info "Running metadata extraction for audio files..."
        if ssh "$REMOTE_HOST" "cd '$REMOTE_BASE' && npm run extract-music"; then
            log_success "Metadata extraction completed"
        else
            log_error "Metadata extraction failed"
            success=false
        fi
    fi
    
    # Show summary
    show_deployment_summary "${#BLOG_FILES[@]}" "${#MUSIC_FILES[@]}" "${#AUDIO_FILES[@]}" "${#OTHER_FILES[@]}" "$dry_run"
    
    if [[ "$success" == "true" ]]; then
        echo ""
        log_success "Bulk deployment completed successfully"
        exit 0
    else
        echo ""
        log_error "Some deployments failed"
        exit 1
    fi
}

# Global arrays for file categorization
declare -a BLOG_FILES
declare -a MUSIC_FILES
declare -a AUDIO_FILES
declare -a OTHER_FILES

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi