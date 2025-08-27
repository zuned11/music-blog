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