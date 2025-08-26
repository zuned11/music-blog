# Music Blog - Claude Code Project

This document provides comprehensive information about the music blog project architecture, current state, and future improvement opportunities.

## Project Overview

A static site generator-based music blog and portfolio built with 11ty (Eleventy) that features dual content types for both traditional blog posts and music releases with automatic FLAC metadata extraction.

## Architecture

### Frontend
- **Static Site Generator**: 11ty (Eleventy) v2.0.1
- **Template Engine**: Pure HTML with markdown content
- **Styling**: Vanilla CSS with responsive design
- **JavaScript**: Vanilla JS for enhanced UX (mobile nav, audio player improvements)
- **Content Format**: Markdown files with YAML frontmatter
- **Audio Support**: HTML5 audio players with FLAC file serving

### Backend
- **Build Process**: Node.js-based static site generation
- **Content Processing**: Custom JavaScript scripts for FLAC metadata extraction
- **Data Sources**: 
  - Markdown files for blog content
  - FLAC files with embedded metadata
  - YAML data files for structured content
- **Build Tools**: 
  - ffprobe for audio metadata extraction
  - Custom Node.js scripts for automation

### Server Infrastructure
- **Web Server**: Nginx on Debian 12 (bookworm)
- **SSL/TLS**: Let's Encrypt certificates via Certbot
- **Security**: 
  - UFW firewall configuration
  - fail2ban for intrusion prevention
  - Dedicated web user with limited privileges
- **Deployment**: rsync-based file synchronization with server-side builds
- **File Storage**: Static file serving for audio content
- **Monitoring**: Basic access logging and uptime monitoring

### Development Environment:
- **Platform**: Raspberry Pi 5 (8GB RAM) running Raspbian
- **Package Management**: npm for JavaScript dependencies
- **Version Control**: Git with feature branch workflow
- **Content Creation**: Obsidian → Markdown workflow
- **Root Perms**: You will be running as root. The user that should be used for serving the site is named 'blog' and does not have sudo permissions for security reasons.
- **Opt for simple solutions**: bash scripts are a useful utility, and do not need to be overengineered.


### Repository Instructions
- **Master Branch**: Not to be committed to, only merged into from other branches.
- **Branch per Task**: Make sure work on a new task is started on another branch. Checkout Master, create a new branch, and commit work early and often. When a task for a feature is completed, merge it into master.
- **Small Atomic Features**: Make sure branches and merges are minimal in size to ensure commits are not overwhelming and changes can be isolated in case of breaking changes.
- **Rebuild After Changes**: After a successful git merge into the master branch, run what is needed to regenerate the static site so that I can monitor changes periodically. Inform me of rebuilds.
- **Testing**: Include tests for new features. Run these tests after building a feature to ensure the feature is implemented correctly, and return to the feature's branch if a failure is encountered to fix said error.

## Current Objectives

### Core Features ✅
- [x] Dual content structure (blog posts + music releases)
- [x] Automatic FLAC metadata extraction using ffprobe
- [x] Responsive design for mobile and desktop
- [x] HTML5 audio players with download links
- [x] Static site generation with fast build times
- [x] Comprehensive deployment documentation

### Infrastructure ✅
- [x] Complete Debian server setup guide
- [x] Security hardening (firewall, fail2ban, SSL)
- [x] Automated deployment workflow
- [x] Server-side build automation
- [x] Git-based version control with proper branching

### Content Management ✅
- [x] Markdown-based content creation
- [x] YAML frontmatter for metadata
- [x] Automated music file processing
- [x] Integration with Obsidian workflow

## Potential Improvements

### Short-term Enhancements
1. **Content Management**
   - [ ] RSS feed generation for blog posts and music releases
   - [ ] Tag-based content filtering and navigation
   - [ ] Search functionality (client-side with Lunr.js)
   - [ ] Related posts/tracks recommendations

2. **Audio Features**
   - [ ] Waveform visualization for tracks
   - [ ] Playlist functionality for multiple tracks
   - [ ] Audio streaming optimization (progressive download)
   - [ ] Support for additional audio formats (MP3, OGG)

3. **User Experience**
   - [ ] Dark mode toggle
   - [ ] Improved mobile navigation
   - [ ] Loading states and progressive enhancement
   - [ ] Social sharing buttons

### Medium-term Improvements
1. **Performance Optimization**
   - [ ] Image optimization and WebP support
   - [ ] CSS/JS minification and bundling
   - [ ] Service worker for offline functionality
   - [ ] CDN integration for static assets

2. **Analytics and Monitoring**
   - [ ] Privacy-focused analytics (Plausible, GoatCounter)
   - [ ] Server monitoring dashboard
   - [ ] Error tracking and alerting
   - [ ] Performance monitoring (Core Web Vitals)

3. **Content Enhancement**
   - [ ] Comments system (staticman or similar)
   - [ ] Newsletter signup integration
   - [ ] Music release calendar/timeline
   - [ ] Artist collaboration features

### Long-term Considerations
1. **Advanced Features**
   - [ ] Admin interface for content management
   - [ ] Automated social media posting
   - [ ] Integration with music streaming platforms
   - [ ] E-commerce integration for music sales

2. **Infrastructure Scaling**
   - [ ] Multi-server deployment
   - [ ] Database integration for dynamic content
   - [ ] API development for mobile app
   - [ ] Advanced caching strategies

3. **Community Features**
   - [ ] User accounts and profiles
   - [ ] Music submission portal
   - [ ] Collaborative playlists
   - [ ] Event calendar integration

## Technical Debt and Maintenance

### Current Technical Debt
- [ ] Limited error handling in metadata extraction script
- [ ] No automated testing suite
- [ ] Basic SEO optimization (could be enhanced)
- [ ] Manual deployment process (could be automated)

### Maintenance Tasks
- [ ] Regular dependency updates
- [ ] Security patch management
- [ ] Backup strategy implementation
- [ ] Log rotation and cleanup
- [ ] SSL certificate renewal monitoring

## Development Workflow Improvements

### Testing
- [ ] Unit tests for metadata extraction
- [ ] Integration tests for build process
- [ ] End-to-end testing for user workflows
- [ ] Performance regression testing

### Automation
- [ ] GitHub Actions for CI/CD
- [ ] Automated security scanning
- [ ] Dependency vulnerability checking
- [ ] Automated backup verification

### Documentation
- [ ] API documentation for scripts
- [ ] Contributor guidelines
- [ ] Troubleshooting guide expansion
- [ ] Video tutorials for setup

## Architecture Benefits

### Current Strengths
1. **Performance**: Static site generation provides excellent loading speeds
2. **Security**: Minimal attack surface with static files and proper server hardening
3. **Scalability**: Can handle high traffic with simple CDN integration
4. **Maintainability**: Simple architecture with clear separation of concerns
5. **Cost-Effective**: Low server resource requirements
6. **SEO-Friendly**: Static HTML with proper meta tags and structure

### Flexibility for Growth
- Modular design allows for incremental improvements
- Static generation enables easy migration to different hosting platforms
- Content-focused architecture supports various content types
- Clear documentation facilitates team collaboration

## Conclusion

This music blog project successfully implements a robust, secure, and performant static site generation workflow with unique features for music content management. The architecture provides a solid foundation for both personal use and potential scaling to a larger music community platform.

The combination of modern web technologies, comprehensive deployment automation, and thoughtful content management creates a sustainable platform for long-term music blogging and portfolio showcase needs.
