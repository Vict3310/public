// Ultra Modern Mobile Navigation Handler
class UltraModernNav {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.overlay = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createMobileHeader();
        this.createOverlay();
        this.bindEvents();
        this.handleResize();
    }

    createMobileHeader() {
        // Only create mobile header if it doesn't exist and we're on mobile
        if (window.innerWidth <= 768 && !document.querySelector('.mobile-header')) {
            const mobileHeader = document.createElement('div');
            mobileHeader.className = 'mobile-header';
            mobileHeader.innerHTML = `
                <button class="mobile-menu-btn" id="mobileMenuBtn">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="mobile-title">Inventory Pro</div>
            `;
            
            document.body.insertBefore(mobileHeader, document.body.firstChild);
            
            // Add mobile header styles
            const style = document.createElement('style');
            style.textContent = `
                .mobile-header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 60px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                    display: none;
                    align-items: center;
                    padding: 0 var(--space-4);
                    z-index: 999;
                    box-shadow: var(--shadow-sm);
                }
                
                .mobile-menu-btn {
                    background: rgba(59, 130, 246, 0.1);
                    border: 2px solid rgba(59, 130, 246, 0.2);
                    border-radius: var(--radius-xl);
                    font-size: 1.2rem;
                    color: var(--primary-600);
                    cursor: pointer;
                    margin-right: var(--space-4);
                    padding: var(--space-3);
                    transition: all var(--transition-base);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 44px;
                    min-height: 44px;
                }
                
                .mobile-menu-btn:hover {
                    background: rgba(59, 130, 246, 0.15);
                    border-color: rgba(59, 130, 246, 0.3);
                    transform: scale(1.05);
                }
                
                .mobile-menu-btn:active {
                    transform: scale(0.95);
                }
                
                .mobile-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--secondary-800);
                    letter-spacing: -0.025em;
                }
                
                @media (max-width: 768px) {
                    .mobile-header {
                        display: flex;
                    }
                    
                    .main-content {
                        padding-top: 80px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    createOverlay() {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'sidebar-overlay';
            this.overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                z-index: 99;
                display: none;
                opacity: 0;
                transition: opacity var(--transition-base);
            `;
            document.body.appendChild(this.overlay);
        }
    }

    bindEvents() {
        // Mobile menu button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#mobileMenuBtn')) {
                this.toggle();
            }
        });

        // Overlay click
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                this.close();
            });
        }

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Navigation link clicks on mobile
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link') && window.innerWidth <= 768) {
                this.close();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (window.innerWidth <= 768) {
            this.isOpen = true;
            this.sidebar.classList.add('open');
            
            if (this.overlay) {
                this.overlay.style.display = 'block';
                requestAnimationFrame(() => {
                    this.overlay.style.opacity = '1';
                });
            }
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            // Update menu button icon
            const menuBtn = document.querySelector('#mobileMenuBtn i');
            if (menuBtn) {
                menuBtn.className = 'fas fa-times';
            }
        }
    }

    close() {
        this.isOpen = false;
        this.sidebar.classList.remove('open');
        
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            setTimeout(() => {
                this.overlay.style.display = 'none';
            }, 300);
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Update menu button icon
        const menuBtn = document.querySelector('#mobileMenuBtn i');
        if (menuBtn) {
            menuBtn.className = 'fas fa-bars';
        }
    }

    handleResize() {
        if (window.innerWidth > 768) {
            this.close();
            // Hide mobile header on desktop
            const mobileHeader = document.querySelector('.mobile-header');
            if (mobileHeader) {
                mobileHeader.style.display = 'none';
            }
        } else {
            // Show mobile header on mobile
            const mobileHeader = document.querySelector('.mobile-header');
            if (mobileHeader) {
                mobileHeader.style.display = 'flex';
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UltraModernNav();
});

// Add stagger animation for cards
function addStaggerAnimation() {
    const cards = document.querySelectorAll('.stat-card, .product-card');
    cards.forEach((card, index) => {
        card.style.setProperty('--i', index);
    });
}

// Initialize stagger animations
document.addEventListener('DOMContentLoaded', addStaggerAnimation);

// Re-apply animations when content is dynamically loaded
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            addStaggerAnimation();
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});