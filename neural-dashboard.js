// Neural Dashboard System
class NeuralDashboard {
    constructor() {
        this.user = null;
        this.charts = {};
        this.initializeDashboard();
        this.setupEventListeners();
        this.loadDashboardData();
        this.setupRealTimeUpdates();
    }

    initializeDashboard() {
        // Check authentication
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.user = user;
                this.loadUserData();
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    setupEventListeners() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Filter button
        document.getElementById('filterBtn').addEventListener('click', () => {
            this.filterData();
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Add expense button
        document.getElementById('addExpenseBtn').addEventListener('click', () => {
            this.showExpenseModal();
        });

        // Close expense modal
        document.getElementById('closeExpenseModal').addEventListener('click', () => {
            this.hideExpenseModal();
        });

        // Expense form
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Set default dates
        this.setDefaultDates();
    }

    setDefaultDates() {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        
        document.getElementById('endDate').value = today.toISOString().split('T')[0];
        document.getElementById('startDate').value = lastMonth.toISOString().split('T')[0];
    }

    async loadUserData() {
        try {
            const userDoc = await firebase.firestore().collection('users').doc(this.user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                // Update UI with user data if needed
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async loadDashboardData() {
        try {
            this.showNeuralLoading();
            
            // Load all dashboard data
            await Promise.all([
                this.loadProducts(),
                this.loadSales(),
                this.loadExpenses(),
                this.loadLowStockAlerts()
            ]);
            
            this.updateMetrics();
            this.initializeCharts();
            this.hideNeuralLoading();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNeuralToast('Neural network error occurred', 'error');
        }
    }

    async loadProducts() {
        const snapshot = await firebase.firestore()
            .collection('products')
            .where('userId', '==', this.user.uid)
            .get();
        
        this.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async loadSales() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        endDate.setHours(23, 59, 59, 999);
        
        const snapshot = await firebase.firestore()
            .collection('sales')
            .where('userId', '==', this.user.uid)
            .where('timestamp', '>=', startDate)
            .where('timestamp', '<=', endDate)
            .orderBy('timestamp', 'desc')
            .get();
        
        this.sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async loadExpenses() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        endDate.setHours(23, 59, 59, 999);
        
        const snapshot = await firebase.firestore()
            .collection('expenses')
            .where('userId', '==', this.user.uid)
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();
        
        this.expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async loadLowStockAlerts() {
        const lowStockProducts = this.products.filter(product => product.quantity <= 10);
        const alertsContainer = document.getElementById('lowStockList');
        
        if (lowStockProducts.length === 0) {
            alertsContainer.innerHTML = '<div style="text-align: center; color: var(--success); padding: var(--space-4);">🎉 All neural nodes operating at optimal levels</div>';
            return;
        }
        
        alertsContainer.innerHTML = lowStockProducts.map(product => `
            <div style="background: var(--bg-glass); border: 1px solid var(--warning); border-radius: var(--radius); padding: var(--space-4); margin-bottom: var(--space-2); animation: neuralPulse 2s ease-in-out infinite;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: var(--warning);">${product.name}</strong>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Only ${product.quantity} units remaining</div>
                    </div>
                    <button class="btn-holo" style="font-size: 0.75rem; padding: var(--space-2) var(--space-3);" onclick="neuralDashboard.reorderProduct('${product.id}')">
                        Reorder
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateMetrics() {
        // Calculate metrics
        const totalProducts = this.products.length;
        const totalStockValue = this.products.reduce((sum, product) => sum + (product.sellingPrice * product.quantity), 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySales = this.sales.filter(sale => {
            const saleDate = sale.timestamp.toDate();
            return saleDate >= today;
        });
        
        const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
        const todayProfit = todaySales.reduce((sum, sale) => sum + sale.profit, 0);
        const totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        // Update UI with neural effects
        this.animateValue('totalProducts', totalProducts);
        this.animateValue('totalStockValue', `₦${totalStockValue.toLocaleString()}`);
        this.animateValue('todaySales', `₦${todayRevenue.toLocaleString()}`);
        this.animateValue('todayProfit', `₦${todayProfit.toLocaleString()}`);
    }

    animateValue(elementId, finalValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Add neural glow effect during update
        element.style.textShadow = '0 0 20px var(--primary)';
        element.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            element.textContent = finalValue;
            element.style.textShadow = 'none';
            element.style.transform = 'scale(1)';
        }, 500);
    }

    initializeCharts() {
        this.initializeSalesChart();
        this.initializeProfitChart();
    }

    initializeSalesChart() {
        const salesData = this.processSalesData();
        
        const options = {
            series: [{
                name: 'Neural Sales',
                data: salesData.values
            }],
            chart: {
                type: 'area',
                height: 350,
                background: 'transparent',
                toolbar: { show: false }
            },
            colors: ['#00d4ff'],
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.1,
                    stops: [0, 90, 100]
                }
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            xaxis: {
                categories: salesData.labels,
                labels: { style: { colors: '#a0a0a0' } }
            },
            yaxis: {
                labels: { style: { colors: '#a0a0a0' } }
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.1)'
            },
            theme: { mode: 'dark' }
        };

        this.charts.sales = new ApexCharts(document.querySelector("#salesChart"), options);
        this.charts.sales.render();
    }

    initializeProfitChart() {
        const profitData = this.processProfitData();
        
        const options = {
            series: [{
                name: 'Neural Profit',
                data: profitData.values
            }],
            chart: {
                type: 'line',
                height: 350,
                background: 'transparent',
                toolbar: { show: false }
            },
            colors: ['#7c3aed'],
            stroke: {
                curve: 'smooth',
                width: 4
            },
            xaxis: {
                categories: profitData.labels,
                labels: { style: { colors: '#a0a0a0' } }
            },
            yaxis: {
                labels: { style: { colors: '#a0a0a0' } }
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.1)'
            },
            theme: { mode: 'dark' }
        };

        this.charts.profit = new ApexCharts(document.querySelector("#profitChart"), options);
        this.charts.profit.render();
    }

    processSalesData() {
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last7Days.push(date);
        }
        
        const labels = last7Days.map(date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const values = last7Days.map(date => {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            
            return this.sales
                .filter(sale => {
                    const saleDate = sale.timestamp.toDate();
                    return saleDate >= dayStart && saleDate <= dayEnd;
                })
                .reduce((sum, sale) => sum + sale.total, 0);
        });
        
        return { labels, values };
    }

    processProfitData() {
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last7Days.push(date);
        }
        
        const labels = last7Days.map(date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const values = last7Days.map(date => {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            
            return this.sales
                .filter(sale => {
                    const saleDate = sale.timestamp.toDate();
                    return saleDate >= dayStart && saleDate <= dayEnd;
                })
                .reduce((sum, sale) => sum + sale.profit, 0);
        });
        
        return { labels, values };
    }

    async filterData() {
        this.showNeuralLoading('Recalibrating neural matrix...');
        await this.loadDashboardData();
    }

    exportData() {
        const data = {
            products: this.products,
            sales: this.sales,
            expenses: this.expenses,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neural-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        this.showNeuralToast('Neural data transmitted successfully', 'success');
    }

    showExpenseModal() {
        document.getElementById('expenseModal').classList.remove('hidden');
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    }

    hideExpenseModal() {
        document.getElementById('expenseModal').classList.add('hidden');
        document.getElementById('expenseForm').reset();
    }

    async addExpense() {
        try {
            const expenseData = {
                userId: this.user.uid,
                description: document.getElementById('expenseDesc').value,
                amount: parseFloat(document.getElementById('expenseAmount').value),
                category: document.getElementById('expenseCategory').value,
                date: new Date(document.getElementById('expenseDate').value),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await firebase.firestore().collection('expenses').add(expenseData);
            
            this.hideExpenseModal();
            this.showNeuralToast('Expense logged in neural matrix', 'success');
            this.loadDashboardData();
            
        } catch (error) {
            console.error('Error adding expense:', error);
            this.showNeuralToast('Neural logging error occurred', 'error');
        }
    }

    async reorderProduct(productId) {
        this.showNeuralToast('Initiating neural reorder protocol...', 'info');
        // This would integrate with supplier system
        setTimeout(() => {
            this.showNeuralToast('Reorder signal transmitted to supply network', 'success');
        }, 2000);
    }

    async handleLogout() {
        try {
            this.showNeuralLoading('Disconnecting from neural matrix...');
            await firebase.auth().signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            this.showNeuralToast('Neural disconnection error', 'error');
        }
    }

    setupRealTimeUpdates() {
        // Real-time updates for sales
        firebase.firestore()
            .collection('sales')
            .where('userId', '==', this.user.uid)
            .onSnapshot(() => {
                this.loadDashboardData();
            });
    }

    showNeuralLoading(message = 'Processing neural data...') {
        // Create loading overlay if it doesn't exist
        let overlay = document.getElementById('neuralLoading');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'neuralLoading';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(10, 10, 15, 0.9); display: flex;
                align-items: center; justify-content: center; z-index: 9999;
                backdrop-filter: blur(10px);
            `;
            overlay.innerHTML = `
                <div style="text-align: center; color: var(--text-primary);">
                    <div class="quantum-loader" style="margin: 0 auto 2rem;"></div>
                    <p style="font-size: 1.125rem; font-weight: 300;">${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        overlay.classList.remove('hidden');
    }

    hideNeuralLoading() {
        const overlay = document.getElementById('neuralLoading');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    showNeuralToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 30px; right: 30px;
            background: var(--bg-glass); backdrop-filter: blur(20px);
            border: 1px solid var(--border-neural); color: var(--text-primary);
            padding: var(--space-6); border-radius: var(--radius-lg);
            box-shadow: var(--glow-primary); z-index: 1000; max-width: 350px;
            animation: slideInRight 0.3s ease;
        `;
        
        if (type === 'error') {
            toast.style.borderColor = 'var(--danger)';
            toast.style.boxShadow = '0 0 20px rgba(255, 71, 87, 0.5)';
        } else if (type === 'info') {
            toast.style.borderColor = 'var(--info)';
            toast.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
        }
        
        toast.innerHTML = `<div style="font-weight: 500;">${message}</div>`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Initialize Neural Dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.neuralDashboard = new NeuralDashboard();
});

// Add CSS for slide animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);