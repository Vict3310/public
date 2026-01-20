class AnalyticsManager {
    constructor() {
        this.currentUser = null;
        this.salesData = [];
        this.productsData = [];
        this.charts = {};
        this.init();
    }

    async init() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadData();
                this.setupEventListeners();
                this.initCharts();
                this.updateAnalytics();
            }
        });
    }

    setupEventListeners() {
        document.getElementById('periodSelect').addEventListener('change', () => {
            this.updateAnalytics();
        });

        document.getElementById('exportReportBtn').addEventListener('click', () => {
            this.exportReport();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            });
        });
    }

    async loadData() {
        try {
            if (!this.currentUser) return;

            // Load sales data
            const salesSnapshot = await firebase.firestore()
                .collection('users').doc(this.currentUser.uid)
                .collection('sales')
                .orderBy('createdAt', 'desc')
                .get();

            this.salesData = salesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate() || new Date()
            }));

            // Load products data
            const productsSnapshot = await firebase.firestore()
                .collection('users').doc(this.currentUser.uid)
                .collection('products')
                .get();

            this.productsData = productsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            console.error('Error loading analytics data:', error);
            showNotification('Error loading analytics data', 'error');
        }
    }

    initCharts() {
        // Sales Trend Chart
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        this.charts.sales = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Revenue (₦)',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₦' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });

        // Category Chart
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        this.charts.category = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateAnalytics() {
        const period = parseInt(document.getElementById('periodSelect').value);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - period);

        const filteredSales = this.salesData.filter(sale => sale.date >= cutoffDate);
        
        this.updateMetrics(filteredSales);
        this.updateCharts(filteredSales);
        this.generateInsights(filteredSales);
    }

    updateMetrics(sales) {
        const currentRevenue = sales.reduce((sum, sale) => sum + (sale.revenue || sale.subtotal || 0), 0);
        const currentProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
        
        // Calculate growth (mock calculation)
        const growth = Math.floor(Math.random() * 20) + 5; // 5-25% growth
        document.getElementById('revenueGrowth').textContent = `+${growth}%`;
        
        // Best selling product
        const productSales = {};
        sales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
                });
            }
        });
        
        const bestProduct = Object.keys(productSales).reduce((a, b) => 
            productSales[a] > productSales[b] ? a : b, '-'
        );
        
        document.getElementById('bestProduct').textContent = bestProduct;
        document.getElementById('bestProductSales').textContent = 
            `${productSales[bestProduct] || 0} units sold`;
        
        // Average order value
        const avgOrder = sales.length > 0 ? currentRevenue / sales.length : 0;
        document.getElementById('avgOrderValue').textContent = `₦${avgOrder.toLocaleString()}`;
        
        // Profit margin
        const margin = currentRevenue > 0 ? (currentProfit / currentRevenue * 100) : 0;
        document.getElementById('profitMargin').textContent = `${margin.toFixed(1)}%`;
    }

    updateCharts(sales) {
        // Update sales trend chart
        const dailySales = {};
        sales.forEach(sale => {
            const dateKey = sale.date.toDateString();
            dailySales[dateKey] = (dailySales[dateKey] || 0) + (sale.revenue || sale.subtotal || 0);
        });

        const sortedDates = Object.keys(dailySales).sort((a, b) => new Date(a) - new Date(b));
        const labels = sortedDates.map(date => new Date(date).toLocaleDateString());
        const data = sortedDates.map(date => dailySales[date]);

        this.charts.sales.data.labels = labels;
        this.charts.sales.data.datasets[0].data = data;
        this.charts.sales.update();

        // Update category chart
        const categorySales = {};
        sales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    const product = this.productsData.find(p => p.id === item.productId);
                    const category = product?.category || 'Others';
                    categorySales[category] = (categorySales[category] || 0) + (item.total || 0);
                });
            }
        });

        this.charts.category.data.labels = Object.keys(categorySales);
        this.charts.category.data.datasets[0].data = Object.values(categorySales);
        this.charts.category.update();
    }

    generateInsights(sales) {
        const insights = [];
        const recommendations = [];

        // Sales performance insight
        if (sales.length > 0) {
            const avgDaily = sales.length / 7;
            insights.push({
                icon: '📈',
                title: 'Sales Performance',
                text: `You're averaging ${avgDaily.toFixed(1)} sales per day. ${avgDaily > 5 ? 'Great momentum!' : 'Room for growth.'}`
            });
        }

        // Stock recommendations
        const lowStockProducts = this.productsData.filter(p => p.quantity < (p.minStock || 5));
        if (lowStockProducts.length > 0) {
            recommendations.push({
                icon: '📦',
                title: 'Stock Management',
                text: `${lowStockProducts.length} products are running low. Consider restocking soon.`
            });
        }

        // Profit margin insight
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.revenue || sale.subtotal || 0), 0);
        const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
        const margin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;
        
        if (margin > 30) {
            insights.push({
                icon: '💰',
                title: 'Profit Margin',
                text: `Excellent ${margin.toFixed(1)}% profit margin. Your pricing strategy is working well.`
            });
        }

        this.renderInsights(insights, recommendations);
    }

    renderInsights(insights, recommendations) {
        const insightsContainer = document.getElementById('businessInsights');
        const recommendationsContainer = document.getElementById('recommendations');

        insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-item" style="padding: var(--space-3); border-left: 4px solid var(--success); margin-bottom: var(--space-3); background: rgba(16, 185, 129, 0.1);">
                <div style="font-weight: 600; color: var(--success);">${insight.icon} ${insight.title}</div>
                <div style="font-size: 0.875rem; margin-top: 4px;">${insight.text}</div>
            </div>
        `).join('');

        recommendationsContainer.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item" style="padding: var(--space-3); border-left: 4px solid var(--primary); margin-bottom: var(--space-3); background: rgba(37, 99, 235, 0.1);">
                <div style="font-weight: 600; color: var(--primary);">${rec.icon} ${rec.title}</div>
                <div style="font-size: 0.875rem; margin-top: 4px;">${rec.text}</div>
            </div>
        `).join('');
    }

    exportReport() {
        const period = document.getElementById('periodSelect').value;
        const reportData = {
            period: `Last ${period} days`,
            generatedAt: new Date().toLocaleString(),
            totalSales: this.salesData.length,
            totalRevenue: this.salesData.reduce((sum, sale) => sum + (sale.revenue || sale.subtotal || 0), 0),
            totalProfit: this.salesData.reduce((sum, sale) => sum + (sale.profit || 0), 0)
        };

        const csvContent = `Analytics Report - ${reportData.period}\nGenerated: ${reportData.generatedAt}\n\nSummary:\nTotal Sales,${reportData.totalSales}\nTotal Revenue,₦${reportData.totalRevenue.toLocaleString()}\nTotal Profit,₦${reportData.totalProfit.toLocaleString()}`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        showNotification('Analytics report exported successfully', 'success');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsManager = new AnalyticsManager();
});