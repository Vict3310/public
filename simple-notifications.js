// Simple Notifications
class SimpleNotifications {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const colors = {
            success: 'var(--success)',
            error: 'var(--error)',
            warning: 'var(--warning)',
            info: 'var(--primary)'
        };

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        notification.style.cssText = `
            background: var(--white);
            border: 1px solid var(--gray-200);
            border-left: 4px solid ${colors[type]};
            border-radius: var(--radius);
            padding: 16px;
            box-shadow: var(--shadow-lg);
            max-width: 350px;
            min-width: 300px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        notification.innerHTML = `
            <div style="
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: ${colors[type]};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 10px;
                flex-shrink: 0;
                margin-top: 2px;
            ">
                <i class="${icons[type]}"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="
                    font-weight: 600;
                    color: var(--gray-900);
                    font-size: 14px;
                    line-height: 1.4;
                ">${message}</div>
            </div>
            <button style="
                background: none;
                border: none;
                color: var(--gray-400);
                cursor: pointer;
                padding: 4px;
                font-size: 12px;
                flex-shrink: 0;
            ">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Close button
        notification.querySelector('button').addEventListener('click', () => {
            this.remove(notification);
        });

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }
    }

    remove(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    success(message) {
        this.show(message, 'success');
    }

    error(message) {
        this.show(message, 'error');
    }

    warning(message) {
        this.show(message, 'warning');
    }

    info(message) {
        this.show(message, 'info');
    }
}

// Global instance
window.notifications = new SimpleNotifications();

// Convenience functions
window.showSuccess = (message) => window.notifications.success(message);
window.showError = (message) => window.notifications.error(message);
window.showWarning = (message) => window.notifications.warning(message);
window.showInfo = (message) => window.notifications.info(message);