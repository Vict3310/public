// Ultra Modern Notification System
class UltraNotifications {
    constructor() {
        this.container = this.createContainer();
        this.notifications = new Map();
        this.maxNotifications = 5;
    }

    createContainer() {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `
                position: fixed;
                top: var(--space-6);
                right: var(--space-6);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: var(--space-3);
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 5000, options = {}) {
        const id = Date.now() + Math.random();
        
        // Remove oldest notification if we have too many
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.remove(oldestId);
        }

        const notification = this.createNotification(id, message, type, options);
        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }

        return id;
    }

    createNotification(id, message, type, options) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.dataset.id = id;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const colors = {
            success: 'var(--success-500)',
            error: 'var(--error-500)',
            warning: 'var(--warning-500)',
            info: 'var(--primary-500)'
        };

        notification.style.cssText = `
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-left: 4px solid ${colors[type]};
            border-radius: var(--radius-2xl);
            padding: var(--space-5) var(--space-6);
            box-shadow: var(--shadow-xl);
            max-width: 400px;
            min-width: 300px;
            pointer-events: auto;
            cursor: pointer;
            transform: translateX(100%);
            opacity: 0;
            transition: all var(--transition-base);
            position: relative;
            overflow: hidden;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: var(--space-3);">
                <div style="
                    width: 24px;
                    height: 24px;
                    border-radius: var(--radius-full);
                    background: ${colors[type]};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 0.75rem;
                    flex-shrink: 0;
                    margin-top: 2px;
                ">
                    <i class="${icons[type]}"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="
                        font-weight: 600;
                        color: var(--secondary-900);
                        font-size: 0.95rem;
                        line-height: 1.4;
                        margin-bottom: ${options.description ? 'var(--space-1)' : '0'};
                    ">${message}</div>
                    ${options.description ? `
                        <div style="
                            font-size: 0.875rem;
                            color: var(--secondary-600);
                            line-height: 1.4;
                        ">${options.description}</div>
                    ` : ''}
                </div>
                <button class="notification-close" style="
                    background: none;
                    border: none;
                    color: var(--secondary-400);
                    cursor: pointer;
                    padding: var(--space-1);
                    border-radius: var(--radius-md);
                    transition: all var(--transition-fast);
                    font-size: 0.875rem;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-progress" style="
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: ${colors[type]};
                border-radius: 0 0 var(--radius-2xl) var(--radius-2xl);
                width: 100%;
                transform-origin: left;
                animation: progressBar ${options.duration || 5000}ms linear;
            "></div>
        `;

        // Add progress bar animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes progressBar {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }
        `;
        if (!document.querySelector('#notification-styles')) {
            style.id = 'notification-styles';
            document.head.appendChild(style);
        }

        // Add hover effects
        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'translateX(-4px) scale(1.02)';
            notification.style.boxShadow = 'var(--shadow-2xl)';
        });

        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateX(0) scale(1)';
            notification.style.boxShadow = 'var(--shadow-xl)';
        });

        // Add close functionality
        notification.addEventListener('click', (e) => {
            if (e.target.closest('.notification-close')) {
                this.remove(id);
            }
        });

        return notification;
    }

    remove(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.style.transform = 'translateX(100%) scale(0.9)';
            notification.style.opacity = '0';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(id);
            }, 300);
        }
    }

    success(message, options = {}) {
        return this.show(message, 'success', options.duration || 4000, options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options.duration || 6000, options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options.duration || 5000, options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options.duration || 4000, options);
    }

    clear() {
        this.notifications.forEach((notification, id) => {
            this.remove(id);
        });
    }
}

// Create global instance
window.ultraNotifications = new UltraNotifications();

// Convenience functions
window.showNotification = (message, type, options) => {
    return window.ultraNotifications.show(message, type, options?.duration, options);
};

window.showSuccess = (message, options) => {
    return window.ultraNotifications.success(message, options);
};

window.showError = (message, options) => {
    return window.ultraNotifications.error(message, options);
};

window.showWarning = (message, options) => {
    return window.ultraNotifications.warning(message, options);
};

window.showInfo = (message, options) => {
    return window.ultraNotifications.info(message, options);
};