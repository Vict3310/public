// Ultra Modern Loading & Animation System
class UltraAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.createLoadingOverlay();
        this.setupIntersectionObserver();
        this.setupPageTransitions();
    }

    // Create global loading overlay
    createLoadingOverlay() {
        if (!document.getElementById('globalLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'globalLoadingOverlay';
            overlay.className = 'loading-overlay hidden';
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-logo">
                        <div class="loading-logo-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="loading-logo-text">Inventory Pro</div>
                    </div>
                    <div class="loading-spinner-container">
                        <div class="loading-spinner-modern"></div>
                        <div class="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                    <div class="loading-text">Loading...</div>
                </div>
            `;

            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(12px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    opacity: 0;
                    transition: opacity var(--transition-base);
                }

                .loading-overlay:not(.hidden) {
                    opacity: 1;
                }

                .loading-content {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: var(--radius-3xl);
                    padding: var(--space-10);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--space-6);
                    box-shadow: var(--shadow-2xl);
                    animation: loadingPulse 2s ease-in-out infinite;
                }

                @keyframes loadingPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }

                .loading-logo {
                    display: flex;
                    align-items: center;
                    gap: var(--space-4);
                }

                .loading-logo-icon {
                    width: 48px;
                    height: 48px;
                    background: var(--gradient-primary);
                    border-radius: var(--radius-xl);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    color: white;
                    animation: logoSpin 3s linear infinite;
                }

                @keyframes logoSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .loading-logo-text {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--secondary-900);
                    letter-spacing: -0.025em;
                }

                .loading-spinner-container {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--space-4);
                }

                .loading-spinner-modern {
                    width: 60px;
                    height: 60px;
                    border: 4px solid rgba(59, 130, 246, 0.1);
                    border-top: 4px solid var(--primary-500);
                    border-radius: 50%;
                    animation: modernSpin 1s linear infinite;
                }

                @keyframes modernSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .loading-dots {
                    display: flex;
                    gap: var(--space-2);
                }

                .loading-dots span {
                    width: 8px;
                    height: 8px;
                    background: var(--primary-500);
                    border-radius: 50%;
                    animation: dotBounce 1.4s ease-in-out infinite both;
                }

                .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
                .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

                @keyframes dotBounce {
                    0%, 80%, 100% {
                        transform: scale(0);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                .loading-text {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--secondary-700);
                    animation: textPulse 2s ease-in-out infinite;
                }

                @keyframes textPulse {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                }

                /* Stagger animations for cards */
                .animate-stagger {
                    opacity: 0;
                    transform: translateY(30px);
                    animation: staggerIn 0.6s var(--ease-out-expo) forwards;
                }

                @keyframes staggerIn {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Fade in animation */
                .animate-fade-in {
                    opacity: 0;
                    animation: fadeIn 0.6s ease-out forwards;
                }

                @keyframes fadeIn {
                    to { opacity: 1; }
                }

                /* Slide in from right */
                .animate-slide-right {
                    opacity: 0;
                    transform: translateX(50px);
                    animation: slideRight 0.6s var(--ease-out-expo) forwards;
                }

                @keyframes slideRight {
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                /* Scale in animation */
                .animate-scale-in {
                    opacity: 0;
                    transform: scale(0.8);
                    animation: scaleIn 0.5s var(--bounce) forwards;
                }

                @keyframes scaleIn {
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                /* Hover animations */
                .hover-lift {
                    transition: all var(--transition-base);
                }

                .hover-lift:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-xl);
                }

                .hover-glow {
                    transition: all var(--transition-base);
                }

                .hover-glow:hover {
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(overlay);
        }
    }

    // Show loading overlay
    showLoading(text = 'Loading...') {
        const overlay = document.getElementById('globalLoadingOverlay');
        const loadingText = overlay.querySelector('.loading-text');
        
        if (loadingText) {
            loadingText.textContent = text;
        }
        
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    // Hide loading overlay
    hideLoading() {
        const overlay = document.getElementById('globalLoadingOverlay');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Setup intersection observer for scroll animations
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // Add stagger delay based on index
                    const index = Array.from(element.parentNode.children).indexOf(element);
                    element.style.animationDelay = `${index * 0.1}s`;
                    
                    element.classList.add('animate-stagger');
                    observer.unobserve(element);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements that should animate on scroll
        const observeElements = () => {
            document.querySelectorAll('.stat-card, .product-card, .card').forEach(el => {
                if (!el.classList.contains('animate-stagger')) {
                    observer.observe(el);
                }
            });
        };

        // Initial observation
        observeElements();

        // Re-observe when new content is added
        const mutationObserver = new MutationObserver(() => {
            observeElements();
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Setup page transitions
    setupPageTransitions() {
        // Add page transition on navigation
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && link.href && !link.href.startsWith('#') && !link.target) {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('tel')) {
                    e.preventDefault();
                    this.transitionToPage(href);
                }
            }
        });
    }

    // Smooth page transition
    transitionToPage(url) {
        // Add exit animation
        document.body.style.opacity = '0';
        document.body.style.transform = 'translateY(-20px)';
        document.body.style.transition = 'all 0.3s ease-out';

        setTimeout(() => {
            window.location.href = url;
        }, 300);
    }

    // Animate number counting
    animateNumber(element, start, end, duration = 2000) {
        const startTime = performance.now();
        const startValue = start;
        const endValue = end;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            
            const currentValue = startValue + (endValue - startValue) * easeOutExpo;
            
            if (element.textContent.includes('₦')) {
                element.textContent = `₦${Math.floor(currentValue).toLocaleString()}`;
            } else {
                element.textContent = Math.floor(currentValue).toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Add ripple effect to buttons
    addRippleEffect(element) {
        element.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });

        // Add ripple animation
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Initialize all animations
    initializeAnimations() {
        // Add ripple effects to buttons
        document.querySelectorAll('.btn').forEach(btn => {
            this.addRippleEffect(btn);
        });

        // Add hover effects to cards
        document.querySelectorAll('.stat-card, .product-card, .card').forEach(card => {
            card.classList.add('hover-lift');
        });

        // Animate numbers in stat cards
        document.querySelectorAll('.stat-value').forEach(element => {
            const text = element.textContent;
            const number = parseInt(text.replace(/[^\d]/g, ''));
            if (number > 0) {
                this.animateNumber(element, 0, number);
            }
        });
    }
}

// Create global instance
window.ultraAnimations = new UltraAnimations();

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ultraAnimations.initializeAnimations();
    
    // Add page entrance animation
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        document.body.style.transition = 'all 0.6s ease-out';
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }, 100);
});

// Convenience functions
window.showLoading = (text) => window.ultraAnimations.showLoading(text);
window.hideLoading = () => window.ultraAnimations.hideLoading();