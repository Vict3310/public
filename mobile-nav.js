// Mobile Navigation Handler
class MobileNavigation {
    constructor() {
        this.init();
    }

    init() {
        this.createMobileHeader();
        this.setupEventListeners();
        this.handleResize();
    }

    createMobileHeader() {
        // Only create if not exists and on mobile
        if (window.innerWidth <= 768 && !document.querySelector('.mobile-header')) {
            const header = document.createElement('div');
            header.className = 'mobile-header';
            header.innerHTML = `
                <button class="mobile-menu-btn" id="mobileMenuBtn">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="mobile-title">${document.title.split(' - ')[0]}</div>
            `;
            
            document.body.insertBefore(header, document.body.firstChild);
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            overlay.id = 'sidebarOverlay';
            document.body.appendChild(overlay);
        }
    }

    setupEventListeners() {
        // Mobile menu toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('#mobileMenuBtn')) {
                this.toggleSidebar();
            }
            
            if (e.target.closest('#sidebarOverlay')) {
                this.closeSidebar();
            }
        });

        // Close sidebar when clicking nav links on mobile
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link') && window.innerWidth <= 768) {
                this.closeSidebar();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
        }
    }

    closeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        }
    }

    handleResize() {
        if (window.innerWidth > 768) {
            this.closeSidebar();
            // Remove mobile header on desktop
            const mobileHeader = document.querySelector('.mobile-header');
            if (mobileHeader) {
                mobileHeader.remove();
            }
        } else {
            this.createMobileHeader();
        }
    }
}

// Initialize mobile navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MobileNavigation();
});

// Add swipe gesture support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 100;
    const sidebar = document.querySelector('.sidebar');
    
    if (!sidebar) return;
    
    // Swipe right to open sidebar (from left edge)
    if (touchEndX - touchStartX > swipeThreshold && touchStartX < 50) {
        sidebar.classList.add('open');
        document.querySelector('.sidebar-overlay')?.classList.add('show');
    }
    
    // Swipe left to close sidebar
    if (touchStartX - touchEndX > swipeThreshold && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        document.querySelector('.sidebar-overlay')?.classList.remove('show');
    }
}