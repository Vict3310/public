// Advanced Inventory Management Features
class AdvancedInventory {
    constructor() {
        this.selectedProducts = new Set();
        this.initializeFeatures();
    }

    initializeFeatures() {
        this.setupBulkOperations();
        this.setupSmartAlerts();
        this.setupAutoReorder();
        this.setupPriceOptimization();
    }

    // Bulk Operations
    setupBulkOperations() {
        const bulkToolbar = document.createElement('div');
        bulkToolbar.id = 'bulkToolbar';
        bulkToolbar.className = 'hidden';
        bulkToolbar.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: var(--bg-card); border: 1px solid var(--border-light);
            border-radius: var(--radius-lg); padding: var(--space-4);
            box-shadow: var(--shadow-lg); z-index: 100;
            display: flex; gap: var(--space-3); align-items: center;
        `;
        
        bulkToolbar.innerHTML = `
            <span id="selectedCount">0 selected</span>
            <button class="btn btn-primary" onclick="advancedInventory.bulkEdit()">Edit Prices</button>
            <button class="btn btn-secondary" onclick="advancedInventory.bulkExport()">Export</button>
            <button class="btn btn-danger" onclick="advancedInventory.bulkDelete()">Delete</button>
            <button class="btn btn-secondary" onclick="advancedInventory.clearSelection()">Clear</button>
        `;
        
        document.body.appendChild(bulkToolbar);
    }

    // Smart Alerts System
    setupSmartAlerts() {
        const alertsContainer = document.createElement('div');
        alertsContainer.id = 'smartAlerts';
        alertsContainer.style.cssText = `
            position: fixed; top: 20px; right: 20px; width: 300px; z-index: 1000;
        `;
        document.body.appendChild(alertsContainer);

        this.checkSmartAlerts();
        setInterval(() => this.checkSmartAlerts(), 300000); // Check every 5 minutes
    }

    checkSmartAlerts() {
        const alerts = [
            { type: 'reorder', message: 'iPhone 13 is running low (5 left)', action: 'Reorder Now' },
            { type: 'price', message: 'Samsung Galaxy price dropped 15%', action: 'Update Price' },
            { type: 'trend', message: 'Electronics sales up 25% this week', action: 'View Report' }
        ];

        alerts.forEach((alert, index) => {
            setTimeout(() => this.showAlert(alert), index * 2000);
        });
    }

    showAlert(alert) {
        const alertEl = document.createElement('div');
        alertEl.className = 'smart-alert';
        alertEl.style.cssText = `
            background: var(--bg-card); border-left: 4px solid var(--primary);
            padding: var(--space-4); margin-bottom: var(--space-2);
            border-radius: var(--radius); box-shadow: var(--shadow);
            animation: slideInRight 0.3s ease;
        `;
        
        alertEl.innerHTML = `
            <div style="display: flex; justify-content: between; align-items: start;">
                <div style="flex: 1;">
                    <p style="margin: 0; font-size: 0.875rem; color: var(--text-primary);">${alert.message}</p>
                    <button class="btn btn-primary" style="margin-top: var(--space-2); font-size: 0.75rem; padding: var(--space-1) var(--space-2);">${alert.action}</button>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: var(--text-muted); cursor: pointer;">&times;</button>
            </div>
        `;

        document.getElementById('smartAlerts').appendChild(alertEl);
        
        setTimeout(() => {
            if (alertEl.parentElement) alertEl.remove();
        }, 10000);
    }

    // Auto Reorder System
    setupAutoReorder() {
        const reorderBtn = document.createElement('button');
        reorderBtn.className = 'btn btn-success';
        reorderBtn.innerHTML = '<span>🔄</span> Auto Reorder';
        reorderBtn.onclick = () => this.showAutoReorderModal();
        
        document.querySelector('.header-actions').appendChild(reorderBtn);
    }

    showAutoReorderModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Auto Reorder Settings</h2>
                    <button type="button" class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div style="padding: var(--space-6);">
                    <div class="form-group">
                        <label class="form-label">Reorder Threshold</label>
                        <input type="number" class="form-input" placeholder="Minimum quantity before reorder" value="10">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Reorder Quantity</label>
                        <input type="number" class="form-input" placeholder="Quantity to reorder" value="50">
                    </div>
                    <div class="form-group">
                        <label class="flex items-center gap-2">
                            <input type="checkbox" checked>
                            <span>Enable automatic reordering</span>
                        </label>
                    </div>
                    <div class="flex gap-3 justify-end">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button class="btn btn-primary">Save Settings</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Price Optimization
    setupPriceOptimization() {
        const optimizeBtn = document.createElement('button');
        optimizeBtn.className = 'btn btn-info';
        optimizeBtn.innerHTML = '<span>💡</span> Optimize Prices';
        optimizeBtn.onclick = () => this.showPriceOptimization();
        
        document.querySelector('.header-actions').appendChild(optimizeBtn);
    }

    showPriceOptimization() {
        const suggestions = [
            { product: 'iPhone 13', current: '₦450,000', suggested: '₦465,000', reason: 'Market demand increased 12%' },
            { product: 'Samsung Galaxy', current: '₦320,000', suggested: '₦305,000', reason: 'Competitor pricing analysis' },
            { product: 'AirPods Pro', current: '₦85,000', suggested: '₦89,000', reason: 'Low stock, high demand' }
        ];

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Price Optimization Suggestions</h2>
                    <button type="button" class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div style="padding: var(--space-6);">
                    ${suggestions.map(item => `
                        <div style="border: 1px solid var(--border-light); border-radius: var(--radius); padding: var(--space-4); margin-bottom: var(--space-3);">
                            <div class="flex justify-between items-start mb-2">
                                <h4 style="margin: 0; color: var(--text-primary);">${item.product}</h4>
                                <span style="color: var(--success); font-weight: 600;">+₦${parseInt(item.suggested.replace(/[₦,]/g, '')) - parseInt(item.current.replace(/[₦,]/g, ''))}</span>
                            </div>
                            <div class="flex justify-between items-center mb-2">
                                <span>Current: ${item.current}</span>
                                <span>Suggested: ${item.suggested}</span>
                            </div>
                            <p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0;">${item.reason}</p>
                            <button class="btn btn-primary" style="margin-top: var(--space-2); font-size: 0.75rem;">Apply</button>
                        </div>
                    `).join('')}
                    <div class="flex gap-3 justify-end" style="margin-top: var(--space-4);">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                        <button class="btn btn-success">Apply All</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Bulk Operations Methods
    toggleProductSelection(productId) {
        if (this.selectedProducts.has(productId)) {
            this.selectedProducts.delete(productId);
        } else {
            this.selectedProducts.add(productId);
        }
        this.updateBulkToolbar();
    }

    updateBulkToolbar() {
        const toolbar = document.getElementById('bulkToolbar');
        const count = this.selectedProducts.size;
        
        if (count > 0) {
            toolbar.classList.remove('hidden');
            document.getElementById('selectedCount').textContent = `${count} selected`;
        } else {
            toolbar.classList.add('hidden');
        }
    }

    bulkEdit() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Bulk Edit Prices</h2>
                    <button type="button" class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div style="padding: var(--space-6);">
                    <div class="form-group">
                        <label class="form-label">Price Adjustment</label>
                        <select class="form-input" id="priceAdjustmentType">
                            <option value="percentage">Percentage Change</option>
                            <option value="fixed">Fixed Amount</option>
                            <option value="set">Set Price</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Value</label>
                        <input type="number" class="form-input" placeholder="Enter value" id="priceValue">
                    </div>
                    <div class="flex gap-3 justify-end">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button class="btn btn-primary">Apply Changes</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    clearSelection() {
        this.selectedProducts.clear();
        this.updateBulkToolbar();
        document.querySelectorAll('.product-checkbox').forEach(cb => cb.checked = false);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.advancedInventory = new AdvancedInventory();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);