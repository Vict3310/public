// Simple Mobile Navigation
class MobileNav {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.overlay = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createMobileHeader();
        this.bindEvents();
    }

    createMobileHeader() {
        if (window.innerWidth <= 768 && !document.querySelector('.mobile-header')) {
            const header = document.createElement('div');
            header.className = 'mobile-header';
            header.innerHTML = `
                <button class="mobile-menu-btn" id="mobileMenuBtn">
                    <div class="hamburger">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>
                <div class="mobile-title">Inventory Pro</div>
                <div class="mobile-nav-dropdown hidden" id="mobileNavDropdown">
                    <a href="dashboard.html" class="mobile-nav-link">
                        <i class="fas fa-chart-line"></i>
                        Dashboard
                    </a>
                    <a href="inventory.html" class="mobile-nav-link">
                        <i class="fas fa-boxes"></i>
                        Inventory
                    </a>
                    <a href="sales.html" class="mobile-nav-link">
                        <i class="fas fa-cash-register"></i>
                        Sales
                    </a>
                    <a href="customers.html" class="mobile-nav-link">
                        <i class="fas fa-users"></i>
                        Customers
                    </a>
                    <a href="analytics.html" class="mobile-nav-link">
                        <i class="fas fa-chart-bar"></i>
                        Analytics
                    </a>
                    <a href="receipt.html" class="mobile-nav-link">
                        <i class="fas fa-receipt"></i>
                        Receipt
                    </a>
                    <button id="mobileLogoutBtn" class="mobile-nav-link logout-btn">
                        <i class="fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                </div>
            `;
            
            document.body.insertBefore(header, document.body.firstChild);
            
            const style = document.createElement('style');
            style.textContent = `
                .mobile-header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 60px;
                    background: var(--white);
                    border-bottom: 1px solid var(--gray-200);
                    display: none;
                    align-items: center;
                    padding: 0 var(--space-4);
                    z-index: 999;
                    box-shadow: var(--shadow-sm);
                }
                
                .mobile-menu-btn {
                    background: var(--gray-100);
                    border: 1px solid var(--gray-300);
                    border-radius: var(--radius);
                    cursor: pointer;
                    margin-right: var(--space-4);
                    padding: var(--space-2);
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                
                .mobile-menu-btn:hover {
                    background: var(--gray-200);
                }
                
                .mobile-nav-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: var(--white);
                    border: 1px solid var(--gray-200);
                    border-top: none;
                    box-shadow: var(--shadow-lg);
                    z-index: 998;
                }
                
                .mobile-nav-link {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                    padding: var(--space-4);
                    color: var(--gray-700);
                    text-decoration: none;
                    border-bottom: 1px solid var(--gray-100);
                    font-weight: 500;
                    background: none;
                    border-left: none;
                    border-right: none;
                    border-top: none;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                }
                
                .mobile-nav-link:hover {
                    background: var(--gray-50);
                    color: var(--primary);
                }
                
                .mobile-nav-link.logout-btn {
                    color: var(--error);
                    border-bottom: none;
                }
                
                .hamburger {
                    width: 20px;
                    height: 16px;
                    position: relative;
                }
                
                .hamburger span {
                    display: block;
                    position: absolute;
                    height: 2px;
                    width: 100%;
                    background: var(--gray-700);
                    border-radius: 2px;
                    opacity: 1;
                    left: 0;
                    transform: rotate(0deg);
                    transition: 0.25s ease-in-out;
                }
                
                .hamburger span:nth-child(1) { top: 0px; }
                .hamburger span:nth-child(2), .hamburger span:nth-child(3) { top: 7px; }
                .hamburger span:nth-child(4) { top: 14px; }
                
                .hamburger.open span:nth-child(1) { top: 7px; width: 0%; left: 50%; }
                .hamburger.open span:nth-child(2) { transform: rotate(45deg); }
                .hamburger.open span:nth-child(3) { transform: rotate(-45deg); }
                .hamburger.open span:nth-child(4) { top: 7px; width: 0%; left: 50%; }
                
                .mobile-title {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: var(--gray-900);
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
                background: rgba(0, 0, 0, 0.5);
                z-index: 99;
                display: none;
            `;
            document.body.appendChild(this.overlay);
        }
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#mobileMenuBtn')) {
                this.toggle();
            } else if (e.target.closest('#mobileLogoutBtn')) {
                // Trigger logout
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) logoutBtn.click();
            } else if (!e.target.closest('.mobile-nav-dropdown')) {
                this.close();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.close();
            }
        });
    }

    toggle() {
        const dropdown = document.getElementById('mobileNavDropdown');
        const hamburger = document.querySelector('.hamburger');
        
        if (this.isOpen) {
            this.close();
        } else {
            this.isOpen = true;
            if (dropdown) dropdown.classList.remove('hidden');
            if (hamburger) hamburger.classList.add('open');
        }
    }

    close() {
        const dropdown = document.getElementById('mobileNavDropdown');
        const hamburger = document.querySelector('.hamburger');
        
        this.isOpen = false;
        if (dropdown) dropdown.classList.add('hidden');
        if (hamburger) hamburger.classList.remove('open');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new MobileNav();
});