// Main JavaScript for music blog

document.addEventListener('DOMContentLoaded', function() {
    
    // Sidebar functionality
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const homepageContent = document.querySelector('.homepage-content');
    const body = document.body;
    
    // Sidebar state management - purely responsive
    let sidebarOpen = false;
    let isDesktop = false;
    let isLargeDesktop = false;
    
    // Screen size detection
    function updateScreenSize() {
        const width = window.innerWidth;
        isLargeDesktop = width >= 1400;
        isDesktop = width >= 1024;
        return { isLargeDesktop, isDesktop, width };
    }
    
    
    
    // Open sidebar
    function openSidebar(skipFocus = false) {
        if (sidebarOpen) return;
        
        sidebarOpen = true;
        sidebar.classList.add('open');
        body.classList.add('sidebar-open');
        
        // Add desktop auto-open class for large screens
        if (isLargeDesktop) {
            sidebar.classList.add('desktop-auto-open');
        } else {
            // Only show overlay on smaller screens
            sidebarOverlay.classList.add('active');
        }
        
        // Update toggle button state
        sidebarToggle.classList.add('active');
        sidebarToggle.setAttribute('aria-expanded', 'true');
        
        
        // Focus management for accessibility (skip on auto-open)
        if (!skipFocus && !isLargeDesktop) {
            sidebar.focus();
        }
    }
    
    // Close sidebar
    function closeSidebar(skipFocus = false) {
        if (!sidebarOpen) return;
        
        sidebarOpen = false;
        sidebar.classList.remove('open', 'desktop-auto-open');
        sidebarOverlay.classList.remove('active');
        body.classList.remove('sidebar-open');
        
        // Update toggle button state
        sidebarToggle.classList.remove('active');
        sidebarToggle.setAttribute('aria-expanded', 'false');
        
        
        // Return focus to toggle button (skip on auto-close)
        if (!skipFocus && !isLargeDesktop) {
            sidebarToggle.focus();
        }
    }
    
    // Toggle sidebar
    function toggleSidebar() {
        if (sidebarOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }
    
    // Event listeners
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebarOpen) {
            closeSidebar();
        }
        
        // Tab trapping in sidebar
        if (sidebarOpen && e.key === 'Tab') {
            const focusableElements = sidebar.querySelectorAll(
                'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
    
    // Active page highlighting
    function setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = sidebar.querySelectorAll('.sidebar-nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if (href === currentPath || 
                (currentPath === '/' && href === '/') ||
                (currentPath.startsWith('/blog/') && href === '/blog/') ||
                (currentPath.startsWith('/music/') && href === '/music/')) {
                link.classList.add('active');
            }
        });
    }
    
    // Initialize screen size and sidebar state
    function initializeSidebar() {
        updateScreenSize();
        
        // Auto-show sidebar only when screen is wide enough
        if (isLargeDesktop) {
            openSidebar(true); // Skip focus on auto-open
        }
        
        setActiveNavLink();
    }
    
    // Handle window resize with smooth transitions
    function handleResize() {
        const oldIsLargeDesktop = isLargeDesktop;
        const oldIsDesktop = isDesktop;
        
        updateScreenSize();
        
        // Handle transitions between screen sizes
        if (oldIsLargeDesktop !== isLargeDesktop || oldIsDesktop !== isDesktop) {
            handleScreenSizeTransition(oldIsLargeDesktop, oldIsDesktop);
        }
        
        // Update sidebar behavior based on current screen size
        if (isLargeDesktop && sidebarOpen) {
            // Large desktop: no overlay, add desktop class
            sidebarOverlay.classList.remove('active');
            sidebar.classList.add('desktop-auto-open');
        } else if (sidebarOpen) {
            // Other sizes: use overlay if open
            sidebarOverlay.classList.add('active');
            sidebar.classList.remove('desktop-auto-open');
        }
    }
    
    // Handle transitions between screen sizes
    function handleScreenSizeTransition(oldIsLargeDesktop, oldIsDesktop) {
        // Transitioning TO large desktop - auto-show sidebar
        if (!oldIsLargeDesktop && isLargeDesktop) {
            openSidebar(true);
        }
        
        // Transitioning FROM large desktop - auto-hide sidebar
        if (oldIsLargeDesktop && !isLargeDesktop) {
            if (sidebarOpen) {
                closeSidebar(true);
            }
        }
    }
    
    // Debounced resize handler for better performance
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 150);
    });
    
    // Initialize everything
    initializeSidebar();
    
    // Search functionality
    initializeSearch();
    
    // Global audio manager
    initializeAudioManager();
    
    // Audio player enhancements
    const audioPlayers = document.querySelectorAll('audio');
    audioPlayers.forEach(function(audio) {
        audio.addEventListener('loadedmetadata', function() {
            console.log('Audio loaded:', audio.src);
        });
        
        audio.addEventListener('error', function() {
            console.warn('Audio failed to load:', audio.src);
        });
    });
    
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Close sidebar when navigating to internal links (but not on large desktop)
    const internalLinks = sidebar.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Only auto-close on mobile/tablet, not desktop
            if (!isLargeDesktop) {
                closeSidebar();
            }
        });
    });
});

// Touch gesture support for mobile sidebar
if ('ontouchstart' in window) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        
        const sidebar = document.getElementById('sidebar');
        const sidebarOpen = sidebar && sidebar.classList.contains('open');
        
        // Swipe right from left edge to open sidebar
        if (!sidebarOpen && touchStartX < 50 && touchEndX - touchStartX > 100 && Math.abs(touchEndY - touchStartY) < 150) {
            const openEvent = new Event('click');
            const sidebarToggle = document.getElementById('sidebar-toggle');
            if (sidebarToggle) {
                sidebarToggle.dispatchEvent(openEvent);
            }
        }
        
        // Swipe left to close sidebar
        if (sidebarOpen && touchStartX - touchEndX > 100 && Math.abs(touchEndY - touchStartY) < 150) {
            const closeEvent = new Event('click');
            const sidebarOverlay = document.getElementById('sidebar-overlay');
            if (sidebarOverlay) {
                sidebarOverlay.dispatchEvent(closeEvent);
            }
        }
    });
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) return;
    
    let searchIndex = null;
    let searchDocuments = [];
    let searchTimeout = null;
    
    // Load search index
    async function loadSearchIndex() {
        try {
            const response = await fetch('/search.json');
            const data = await response.json();
            searchDocuments = data.documents;
            
            // Create Lunr index from the documents
            searchIndex = lunr(function() {
                this.ref('id');
                this.field('title', { boost: 10 });
                this.field('content');
                this.field('tags', { boost: 5 });
                this.field('excerpt', { boost: 3 });
                this.field('artist');
                this.field('genre');
                
                searchDocuments.forEach(doc => {
                    this.add(doc);
                });
            });
        } catch (error) {
            console.error('Failed to load search index:', error);
        }
    }
    
    // Perform search
    function performSearch(query) {
        if (!searchIndex || !query.trim()) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            return;
        }
        
        try {
            const results = searchIndex.search(query);
            displaySearchResults(results, query);
        } catch (error) {
            console.error('Search error:', error);
            searchResults.innerHTML = '<div class="search-error">Search error occurred</div>';
            searchResults.style.display = 'block';
        }
    }
    
    // Display search results
    function displaySearchResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
            searchResults.style.display = 'block';
            return;
        }
        
        const resultsHtml = results.slice(0, 8).map(result => {
            const doc = searchDocuments.find(d => d.id === result.ref);
            if (!doc) return '';
            
            const title = highlightSearchTerms(doc.title, query);
            const excerpt = highlightSearchTerms(
                doc.excerpt || doc.content.substring(0, 150) + '...', 
                query
            );
            const typeIcon = doc.type === 'music' ? '♪' : '📝';
            
            return `
                <div class="search-result">
                    <a href="${doc.url}" class="search-result-link">
                        <div class="search-result-header">
                            <span class="search-result-icon">${typeIcon}</span>
                            <span class="search-result-title">${title}</span>
                            <span class="search-result-type">${doc.type}</span>
                        </div>
                        <div class="search-result-excerpt">${excerpt}</div>
                        ${doc.artist ? `<div class="search-result-artist">by ${doc.artist}</div>` : ''}
                    </a>
                </div>
            `;
        }).join('');
        
        searchResults.innerHTML = resultsHtml;
        searchResults.style.display = 'block';
    }
    
    // Highlight search terms in text
    function highlightSearchTerms(text, query) {
        if (!text || !query) return text;
        
        const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        let highlightedText = text;
        
        words.forEach(word => {
            const regex = new RegExp(`(${escapeRegex(word)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
    }
    
    // Escape special regex characters
    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Handle search input
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value;
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        // Debounce search
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
    
    // Show results when focusing search input (if there's content)
    searchInput.addEventListener('focus', function() {
        if (searchInput.value.trim() && searchResults.innerHTML) {
            searchResults.style.display = 'block';
        }
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
        const resultLinks = searchResults.querySelectorAll('.search-result-link');
        let currentIndex = -1;
        
        // Find currently focused result
        for (let i = 0; i < resultLinks.length; i++) {
            if (document.activeElement === resultLinks[i]) {
                currentIndex = i;
                break;
            }
        }
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < resultLinks.length - 1) {
                    resultLinks[currentIndex + 1].focus();
                } else if (resultLinks.length > 0) {
                    resultLinks[0].focus();
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    resultLinks[currentIndex - 1].focus();
                } else if (resultLinks.length > 0) {
                    resultLinks[resultLinks.length - 1].focus();
                }
                break;
                
            case 'Escape':
                searchInput.blur();
                searchResults.style.display = 'none';
                break;
        }
    });
    
    // Load search index on initialization
    loadSearchIndex();
}

// Global Audio Manager for single-track playback
function initializeAudioManager() {
    let currentPlayer = null;
    let playerInstances = new Map();
    
    // Find all audio players on the page
    const audioPlayers = document.querySelectorAll('.music-audio-player');
    
    if (audioPlayers.length === 0) {
        return; // No audio players on this page
    }
    
    // Initialize each audio player
    audioPlayers.forEach((audio, index) => {
        const filename = audio.getAttribute('data-filename') || `audio-${index}`;
        const playerInstance = new AudioPlayerInstance(audio, filename);
        playerInstances.set(filename, playerInstance);
        
        // Add play event listener
        audio.addEventListener('play', function() {
            handleAudioPlay(playerInstance);
        });
        
        // Add pause/ended event listeners
        audio.addEventListener('pause', function() {
            handleAudioPause(playerInstance);
        });
        
        audio.addEventListener('ended', function() {
            handleAudioEnded(playerInstance);
        });
        
        // Add error handling
        audio.addEventListener('error', function() {
            console.warn('Audio player error:', filename, audio.error);
        });
    });
    
    // Global play handler - pause other players when one starts
    function handleAudioPlay(playingInstance) {
        if (currentPlayer && currentPlayer !== playingInstance) {
            currentPlayer.pause();
        }
        currentPlayer = playingInstance;
        updatePlayerStates();
    }
    
    function handleAudioPause(pausedInstance) {
        if (currentPlayer === pausedInstance) {
            currentPlayer = null;
        }
        updatePlayerStates();
    }
    
    function handleAudioEnded(endedInstance) {
        if (currentPlayer === endedInstance) {
            currentPlayer = null;
        }
        updatePlayerStates();
    }
    
    function updatePlayerStates() {
        playerInstances.forEach(instance => {
            instance.updateState(instance === currentPlayer);
        });
    }
    
    // Expose global interface for external control
    window.MusicBlog = window.MusicBlog || {};
    window.MusicBlog.AudioManager = {
        getCurrentPlayer: () => currentPlayer,
        getAllPlayers: () => playerInstances,
        pauseAll: () => {
            playerInstances.forEach(instance => instance.pause());
            currentPlayer = null;
            updatePlayerStates();
        },
        playTrack: (filename) => {
            const instance = playerInstances.get(filename);
            if (instance) {
                instance.play();
            }
        }
    };
}

// Audio Player Instance wrapper
class AudioPlayerInstance {
    constructor(audioElement, filename) {
        this.audio = audioElement;
        this.filename = filename;
        this.isActive = false;
        
        // Find associated player container
        this.container = audioElement.closest('.music-player');
        
        // Add visual enhancements
        this.enhancePlayerUI();
    }
    
    play() {
        try {
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('Audio play failed:', this.filename, error);
                });
            }
        } catch (error) {
            console.warn('Audio play error:', this.filename, error);
        }
    }
    
    pause() {
        try {
            this.audio.pause();
        } catch (error) {
            console.warn('Audio pause error:', this.filename, error);
        }
    }
    
    updateState(isActive) {
        this.isActive = isActive;
        
        if (this.container) {
            if (isActive) {
                this.container.classList.add('playing');
            } else {
                this.container.classList.remove('playing');
            }
        }
    }
    
    enhancePlayerUI() {
        if (!this.container) return;
        
        // Find UI elements
        this.playButton = this.container.querySelector('.play-button');
        this.volumeButton = this.container.querySelector('.volume-button');
        this.volumeSlider = this.container.querySelector('.volume-slider');
        this.progressBar = this.container.querySelector('.progress-bar');
        this.progressFill = this.container.querySelector('.progress-fill');
        this.currentTimeDisplay = this.container.querySelector('.current-time');
        this.durationDisplay = this.container.querySelector('.duration');
        
        // Connect play button
        if (this.playButton) {
            this.playButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePlayPause();
            });
        }
        
        // Connect volume controls
        if (this.volumeButton) {
            this.volumeButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMute();
            });
        }
        
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', (e) => {
                this.setVolume(parseFloat(e.target.value));
            });
            
            // Set initial volume
            this.setVolume(parseFloat(this.volumeSlider.value));
        }
        
        // Connect progress bar
        if (this.progressBar) {
            this.progressBar.addEventListener('click', (e) => {
                this.seekToPosition(e);
            });
        }
        
        // Add loading state handling
        this.audio.addEventListener('loadstart', () => {
            this.container.classList.add('loading');
        });
        
        this.audio.addEventListener('canplay', () => {
            this.container.classList.remove('loading');
            this.updateDurationDisplay();
        });
        
        // Add time updates for progress display
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
            this.updateTimeDisplay();
        });
        
        // Update button state when audio state changes
        this.audio.addEventListener('play', () => {
            this.updatePlayButtonState(true);
        });
        
        this.audio.addEventListener('pause', () => {
            this.updatePlayButtonState(false);
        });
        
        this.audio.addEventListener('ended', () => {
            this.updatePlayButtonState(false);
        });
    }
    
    togglePlayPause() {
        if (this.audio.paused) {
            this.play();
        } else {
            this.pause();
        }
    }
    
    updatePlayButtonState(isPlaying) {
        if (!this.playButton) return;
        
        if (isPlaying) {
            this.playButton.classList.add('playing');
        } else {
            this.playButton.classList.remove('playing');
        }
    }
    
    toggleMute() {
        if (this.audio.muted) {
            this.audio.muted = false;
            this.updateVolumeButton(false);
            if (this.volumeSlider) {
                this.audio.volume = parseFloat(this.volumeSlider.value);
            }
        } else {
            this.audio.muted = true;
            this.updateVolumeButton(true);
        }
    }
    
    updateVolumeButton(isMuted) {
        if (!this.volumeButton) return;
        
        if (isMuted) {
            this.volumeButton.textContent = '🔇';
            this.volumeButton.title = 'Unmute';
        } else {
            this.volumeButton.textContent = '🔊';
            this.volumeButton.title = 'Mute';
        }
    }
    
    setVolume(volume) {
        this.audio.volume = Math.max(0, Math.min(1, volume));
        this.audio.muted = false;
        this.updateVolumeButton(false);
    }
    
    seekToPosition(e) {
        if (!this.audio.duration) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * this.audio.duration;
        
        this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, newTime));
    }
    
    updateProgress() {
        const progress = this.audio.currentTime / this.audio.duration;
        this.lastProgress = progress || 0;
        
        // Update visual progress bar
        if (this.progressFill && !isNaN(progress)) {
            this.progressFill.style.width = `${Math.round(progress * 100)}%`;
        }
    }
    
    updateTimeDisplay() {
        if (this.currentTimeDisplay) {
            this.currentTimeDisplay.textContent = this.formatTime(this.audio.currentTime || 0);
        }
    }
    
    updateDurationDisplay() {
        if (this.durationDisplay && this.audio.duration) {
            this.durationDisplay.textContent = this.formatTime(this.audio.duration);
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    getCurrentTime() {
        return this.audio.currentTime || 0;
    }
    
    getDuration() {
        return this.audio.duration || 0;
    }
    
    getProgress() {
        return this.lastProgress || 0;
    }
}

// Global Audio Manager for centralized music playback
class GlobalAudioManager {
    constructor() {
        this.currentPlayer = null;
        this.bottomPlayer = null;
        this.globalAudio = null;
        this.tracks = [];
        this.currentTrackIndex = -1;
        
        this.init();
    }
    
    init() {
        // Initialize bottom player elements
        this.bottomPlayer = document.getElementById('bottom-player');
        this.globalAudio = document.getElementById('global-audio');
        
        if (!this.bottomPlayer || !this.globalAudio) return;
        
        // Get bottom player controls
        this.playButton = document.getElementById('global-play-button');
        this.volumeButton = this.bottomPlayer.querySelector('.player-volume-button');
        this.volumeSlider = this.bottomPlayer.querySelector('.player-volume-slider');
        this.volumeFill = this.bottomPlayer.querySelector('.player-volume-fill');
        this.progressBar = this.bottomPlayer.querySelector('.player-progress-bar');
        this.progressFill = this.bottomPlayer.querySelector('.player-progress-fill');
        this.currentTimeDisplay = this.bottomPlayer.querySelector('.player-current-time');
        this.durationDisplay = this.bottomPlayer.querySelector('.player-duration');
        this.titleDisplay = this.bottomPlayer.querySelector('.player-title');
        this.artistDisplay = this.bottomPlayer.querySelector('.player-artist');
        
        // Collect all tracks from the page
        this.collectTracks();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize volume
        this.setVolume(0.8);
    }
    
    collectTracks() {
        const songItems = document.querySelectorAll('.song-item[data-filename]');
        this.tracks = Array.from(songItems).map((item, index) => ({
            element: item,
            filename: item.dataset.filename,
            title: item.querySelector('.song-title')?.textContent || 'Unknown',
            artist: item.querySelector('.song-artist')?.textContent || 'Unknown',
            index: index
        }));
    }
    
    setupEventListeners() {
        // Play button
        if (this.playButton) {
            this.playButton.addEventListener('click', () => this.togglePlayback());
        }
        
        // Volume controls
        if (this.volumeButton) {
            this.volumeButton.addEventListener('click', () => this.toggleMute());
        }
        
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('click', (e) => this.handleVolumeClick(e));
        }
        
        // Progress bar
        if (this.progressBar) {
            this.progressBar.addEventListener('click', (e) => this.seekToPosition(e));
        }
        
        // Audio events
        if (this.globalAudio) {
            this.globalAudio.addEventListener('loadedmetadata', () => this.updateDurationDisplay());
            this.globalAudio.addEventListener('timeupdate', () => this.updateProgress());
            this.globalAudio.addEventListener('play', () => this.onPlay());
            this.globalAudio.addEventListener('pause', () => this.onPause());
            this.globalAudio.addEventListener('ended', () => this.onEnded());
        }
        
        // Track selection
        this.tracks.forEach((track, index) => {
            // Add click listener to entire song item
            track.element.addEventListener('click', () => this.selectTrack(index));
            
            // Add click listener to play button
            const playBtn = track.element.querySelector('.play-track-btn');
            if (playBtn) {
                playBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectTrack(index);
                });
            }
        });
    }
    
    selectTrack(index) {
        if (index < 0 || index >= this.tracks.length) return;
        
        const track = this.tracks[index];
        this.currentTrackIndex = index;
        
        // Stop current playback
        if (this.globalAudio) {
            this.globalAudio.pause();
            this.globalAudio.currentTime = 0;
        }
        
        // Load new track
        const audioSrc = `/music-files/${track.filename}`;
        this.globalAudio.src = audioSrc;
        
        // Update player display
        this.titleDisplay.textContent = track.title;
        this.artistDisplay.textContent = track.artist;
        
        // Show bottom player
        this.bottomPlayer.style.display = 'block';
        
        // Enable play button
        this.playButton.disabled = false;
        
        // Update track visual states
        this.updateTrackStates();
        
        // Auto-play the track
        this.globalAudio.play().catch(e => {
            console.warn('Autoplay prevented:', e);
        });
    }
    
    updateTrackStates() {
        this.tracks.forEach((track, index) => {
            const playBtn = track.element.querySelector('.play-track-btn');
            if (playBtn) {
                if (index === this.currentTrackIndex && !this.globalAudio.paused) {
                    playBtn.innerHTML = '<span class="play-icon">⏸</span>';
                    track.element.classList.add('playing');
                } else {
                    playBtn.innerHTML = '<span class="play-icon">▶</span>';
                    track.element.classList.remove('playing');
                }
            }
        });
    }
    
    togglePlayback() {
        if (!this.globalAudio || this.currentTrackIndex === -1) return;
        
        if (this.globalAudio.paused) {
            this.globalAudio.play();
        } else {
            this.globalAudio.pause();
        }
    }
    
    onPlay() {
        this.playButton.classList.add('playing');
        this.updateTrackStates();
    }
    
    onPause() {
        this.playButton.classList.remove('playing');
        this.updateTrackStates();
    }
    
    onEnded() {
        this.playButton.classList.remove('playing');
        this.updateTrackStates();
        // Could implement auto-next here
    }
    
    toggleMute() {
        if (!this.globalAudio) return;
        
        this.globalAudio.muted = !this.globalAudio.muted;
        this.updateVolumeButton();
    }
    
    handleVolumeClick(e) {
        const rect = this.volumeSlider.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        
        this.setVolume(percentage);
    }
    
    setVolume(volume) {
        if (!this.globalAudio) return;
        
        this.globalAudio.volume = Math.max(0, Math.min(1, volume));
        this.globalAudio.muted = false;
        
        // Update volume fill
        if (this.volumeFill) {
            this.volumeFill.style.width = `${volume * 100}%`;
        }
        
        this.updateVolumeButton();
    }
    
    updateVolumeButton() {
        if (!this.volumeButton || !this.globalAudio) return;
        
        if (this.globalAudio.muted || this.globalAudio.volume === 0) {
            this.volumeButton.textContent = '🔇';
            this.volumeButton.title = 'Unmute';
        } else {
            this.volumeButton.textContent = '🔊';
            this.volumeButton.title = 'Mute';
        }
    }
    
    seekToPosition(e) {
        if (!this.globalAudio || !this.globalAudio.duration) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * this.globalAudio.duration;
        
        this.globalAudio.currentTime = Math.max(0, Math.min(this.globalAudio.duration, newTime));
    }
    
    updateProgress() {
        if (!this.globalAudio || !this.progressFill) return;
        
        const progress = this.globalAudio.currentTime / this.globalAudio.duration;
        if (!isNaN(progress)) {
            this.progressFill.style.width = `${(progress * 100).toFixed(2)}%`;
        }
        
        this.updateTimeDisplay();
    }
    
    updateTimeDisplay() {
        if (this.currentTimeDisplay) {
            this.currentTimeDisplay.textContent = this.formatTime(this.globalAudio.currentTime || 0);
        }
    }
    
    updateDurationDisplay() {
        if (this.durationDisplay && this.globalAudio.duration) {
            this.durationDisplay.textContent = this.formatTime(this.globalAudio.duration);
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize Global Audio Manager on music pages
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a music page
    if (document.querySelector('.music-list-compact')) {
        window.globalAudioManager = new GlobalAudioManager();
    }
});