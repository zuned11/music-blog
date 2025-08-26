#!/bin/bash

# Local deployment script for music blog (for Claude to use)
# This combines sync + rebuild operations locally
# Usage: ./local-deploy.sh [--build-only] [--status]

set -e

# Configuration
PROJECT_BASE="/home/blog/music-blog"

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
    echo "Local Deployment Script (for Claude)"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --build-only    Only build the site locally (no git operations)"
    echo "  --status       Show project status"
    echo "  --help         Show this help message"
    echo ""
    echo "Default behavior:"
    echo "  1. Build the site locally"
    echo "  2. Show deployment instructions"
    echo ""
    echo "Examples:"
    echo "  $0                 # Build site and show next steps"
    echo "  $0 --build-only    # Just build the site"
    echo "  $0 --status        # Show project status"
}

# Function to build site locally
build_site_local() {
    log_info "Building site locally for deployment..."
    
    # Use the local rebuild script
    if [[ -f "$PROJECT_BASE/scripts/local-rebuild.sh" ]]; then
        "$PROJECT_BASE/scripts/local-rebuild.sh" build
    else
        log_error "Local rebuild script not found"
        return 1
    fi
}

# Function to show deployment next steps
show_deployment_steps() {
    echo ""
    log_info "=== Next Steps for Deployment ==="
    echo ""
    echo "The site has been built locally. To deploy to server:"
    echo ""
    echo "1. Sync files to server (user handles this):"
    echo "   rsync -avz --exclude=node_modules --exclude=.git . blog-box:/home/blog/music-blog/"
    echo ""
    echo "2. Rebuild on server:"
    echo "   scripts/rebuild.sh build"
    echo ""
    echo "OR use the remote rebuild script directly:"
    echo "   scripts/rebuild.sh build"
    echo ""
    log_success "Local build completed successfully"
}

# Function to show project status
show_project_status() {
    log_info "Showing project status..."
    
    if [[ -f "$PROJECT_BASE/scripts/local-rebuild.sh" ]]; then
        "$PROJECT_BASE/scripts/local-rebuild.sh" status
    else
        log_error "Local rebuild script not found"
        return 1
    fi
}

# Main script
main() {
    local build_only=false
    local show_status=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build-only)
                build_only=true
                shift
                ;;
            --status)
                show_status=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Execute based on options
    if [[ "$show_status" == true ]]; then
        show_project_status
    elif [[ "$build_only" == true ]]; then
        build_site_local
    else
        # Default: build and show next steps
        build_site_local && show_deployment_steps
    fi
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi