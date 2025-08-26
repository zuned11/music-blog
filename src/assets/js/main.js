// Main JavaScript for music blog

document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile navigation toggle
    const navToggle = document.createElement('button');
    navToggle.classList.add('nav-toggle');
    navToggle.innerHTML = '☰';
    navToggle.style.display = 'none';
    
    const nav = document.querySelector('.nav');
    const navLinks = document.querySelector('.nav-links');
    
    if (nav && navLinks) {
        nav.insertBefore(navToggle, navLinks);
        
        navToggle.addEventListener('click', function() {
            navLinks.classList.toggle('nav-open');
        });
    }
    
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
    
});

// Add mobile nav styles
const mobileNavStyles = `
@media (max-width: 768px) {
    .nav-toggle {
        display: block !important;
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.5rem;
    }
    
    .nav-links {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background-color: #2c3e50;
        flex-direction: column;
        padding: 1rem 2rem;
        gap: 1rem;
    }
    
    .nav-links.nav-open {
        display: flex;
    }
}
`;

// Inject mobile styles
const styleSheet = document.createElement('style');
styleSheet.textContent = mobileNavStyles;
document.head.appendChild(styleSheet);