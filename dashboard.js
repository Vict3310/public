// Dashboard Module
console.log("🚀 dashboard.js loaded - starting initialization");

// Simple test to see if JS is working
window.addEventListener('load', function() {
    console.log("📄 Dashboard page loaded");
});

let currentUser = null;
let listeners = []; // Store unsubscribe functions
let salesChart = null;
let profitChart = null;
let allSales = [];
let allExpenses = [];
let allProducts = [];

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing dashboard auth listener");
    initAuthListener();
});

function initAuthListener() {
    // Initialize dashboard
    auth.onAuthStateChanged(async user => {
        console.log("Dashboard auth state:", user ? "logged in" : "logged out");
        if (user) {
            currentUser = user;
            // Fetch User Role
            const userDoc = await db.collection('users').doc(user.uid).get();
            currentUser.role = userDoc.data()?.role || 'admin';
            setupDateDefaults();
            initRealtimeDashboard();
            loadSettings();
        } else {
            // Unsubscribe from listeners if user logs out
            listeners.forEach(unsubscribe => unsubscribe());
            listeners = [];
        }
    });
}

// Load Shop Settings
async function loadSettings() {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    const data = doc.data();
    if (data) {
        localStorage.setItem('shopSettings', JSON.stringify(data)); // Cache for other pages
        // Update UI if needed
    }
}

function setupDateDefaults() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7); // Default last 7 days

    document.getElementById('endDate').valueAsDate = end;
    document.getElementById('startDate').valueAsDate = start;
}

// Initialize Real-time Listeners
function initRealtimeDashboard() {
    console.log("🎯 Initializing real-time dashboard listeners for user:", currentUser.uid);
    initChart();

    // 1. Products Listener (Total Products, Stock Value, Low Stock)
    console.log("Setting up products listener...");
    const productsUnsub = db.collection('users').doc(currentUser.uid).collection('products')
        .onSnapshot(snapshot => {
            console.log("📦 Products snapshot received:", snapshot.size, "products");
            // Store products globally for AI analysis
            allProducts = [];
            snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
            updateProductStats(snapshot);
        }, error => {
            console.error("❌ Error listening to products:", error);
            if (error.code === 'permission-denied') {
                showNotification("⚠️ Database Error: Permission Denied. Check Firestore Rules.", "error");
            }
        });

    listeners.push(productsUnsub);

    // 2. Sales Listener
    console.log("Setting up sales listener...");
    const salesUnsub = db.collection('users').doc(currentUser.uid).collection('sales')
        .onSnapshot(snapshot => {
            console.log("💰 Sales snapshot received:", snapshot.size, "sales");
            allSales = [];
            snapshot.forEach(doc => allSales.push({ id: doc.id, ...doc.data() }));
            console.log("All sales loaded:", allSales.length);
            updateFinancials();
        }, error => {
            console.error("❌ Error listening to sales:", error);
            if (error.code === 'permission-denied') {
                showNotification("⚠️ Database Error: Permission Denied. Check Firestore Rules.", "error");
            }
        });

    listeners.push(salesUnsub);

    // 3. Expenses Listener
    console.log("Setting up expenses listener...");
    const expensesUnsub = db.collection('users').doc(currentUser.uid).collection('expenses')
        .onSnapshot(snapshot => {
            console.log("💸 Expenses snapshot received:", snapshot.size, "expenses");
            allExpenses = [];
            snapshot.forEach(doc => allExpenses.push({ id: doc.id, ...doc.data() }));
            console.log("All expenses loaded:", allExpenses.length);
            updateFinancials();
        }, error => {
            console.error("❌ Error listening to expenses:", error);
            if (error.code === 'permission-denied') {
                showNotification("⚠️ Database Error: Permission Denied. Check Firestore Rules.", "error");
            }
        });

    listeners.push(expensesUnsub);

    console.log("✅ All listeners set up successfully");
}

// Update Product Related Stats
function updateProductStats(snapshot) {
    console.log("Updating product stats, snapshot size:", snapshot.size);
    const isAdmin = currentUser.role === 'admin';
    // Total Products
    const totalProductsEl = document.getElementById('totalProducts');
    if (totalProductsEl) {
        totalProductsEl.textContent = snapshot.size;
        console.log("Updated total products:", snapshot.size);
    } else {
        console.error("totalProducts element not found");
    }

    // Total Stock Value & Low Stock
    let totalValue = 0;
    const lowStockList = document.getElementById('lowStockList');
    lowStockList.innerHTML = '';
    let hasLowStock = false;

    snapshot.forEach(doc => {
        const product = doc.data();
        totalValue += product.costPrice * product.quantity;

        // Low Stock Alert (< 3)
        if (product.quantity < 3) {
            hasLowStock = true;
            const alertItem = document.createElement('div');
            alertItem.className = 'alert-item';
            alertItem.innerHTML = `<span>${product.name}</span> - ${product.quantity} left`;
            lowStockList.appendChild(alertItem);
        }
    });

    document.getElementById('totalStockValue').textContent = isAdmin ? `₦${totalValue.toLocaleString()}` : '***';

    if (!hasLowStock) {
        const healthyAlert = document.createElement('div');
        healthyAlert.className = 'alert-item';
        healthyAlert.innerHTML = '✅ All stock levels healthy';
        lowStockList.appendChild(healthyAlert);
    }
}

// Initialize ApexCharts
function initChart() {
    console.log("Initializing charts...");
    const salesOptions = {
        chart: {
            type: 'area',
            height: 350,
            background: 'transparent',
            foreColor: '#ffffff',
            toolbar: {
                show: false
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            }
        },
        series: [{
            name: 'Sales Revenue (₦)',
            data: []
        }],
        xaxis: {
            categories: [],
            labels: {
                style: {
                    colors: '#ffffff'
                }
            },
            axisBorder: {
                color: 'rgba(255, 255, 255, 0.2)'
            },
            axisTicks: {
                color: 'rgba(255, 255, 255, 0.2)'
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#ffffff'
                },
                formatter: function(value) {
                    return '₦' + value.toLocaleString();
                }
            }
        },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            strokeDashArray: 3
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'vertical',
                shadeIntensity: 0.4,
                gradientToColors: ['#00ffff'],
                inverseColors: false,
                opacityFrom: 0.8,
                opacityTo: 0.2,
                stops: [0, 100]
            }
        },
        colors: ['#00ffff'],
        stroke: {
            curve: 'smooth',
            width: 3
        },
        markers: {
            size: 4,
            colors: ['#ffffff'],
            strokeColors: '#00ffff',
            strokeWidth: 2,
            hover: {
                size: 6
            }
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: function(value) {
                    return '₦' + value.toLocaleString();
                }
            }
        }
    };

    const profitOptions = {
        chart: {
            type: 'area',
            height: 350,
            background: 'transparent',
            foreColor: '#ffffff',
            toolbar: {
                show: false
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            }
        },
        series: [{
            name: 'Net Profit (₦)',
            data: []
        }],
        xaxis: {
            categories: [],
            labels: {
                style: {
                    colors: '#ffffff'
                }
            },
            axisBorder: {
                color: 'rgba(255, 255, 255, 0.2)'
            },
            axisTicks: {
                color: 'rgba(255, 255, 255, 0.2)'
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#ffffff'
                },
                formatter: function(value) {
                    return '₦' + value.toLocaleString();
                }
            }
        },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            strokeDashArray: 3
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'vertical',
                shadeIntensity: 0.4,
                gradientToColors: ['#00ff00'],
                inverseColors: false,
                opacityFrom: 0.8,
                opacityTo: 0.2,
                stops: [0, 100]
            }
        },
        colors: ['#00ff00'],
        stroke: {
            curve: 'smooth',
            width: 3
        },
        markers: {
            size: 4,
            colors: ['#ffffff'],
            strokeColors: '#00ff00',
            strokeWidth: 2,
            hover: {
                size: 6
            }
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: function(value) {
                    return '₦' + value.toLocaleString();
                }
            }
        }
    };

    salesChart = new ApexCharts(document.querySelector("#salesChart"), salesOptions);
    salesChart.render();

    profitChart = new ApexCharts(document.querySelector("#profitChart"), profitOptions);
    profitChart.render();

    console.log("Charts initialized successfully");
}

// Update Financial Stats (Sales + Expenses)
function updateFinancials() {
    console.log("Updating financial stats...");
    const isAdmin = currentUser.role === 'admin';
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    endDate.setHours(23, 59, 59, 999); // End of the day

    console.log("Date range:", startDate, "to", endDate);

    let totalSales = 0;
    let todaySalesTotal = 0;
    let todayProfitTotal = 0;
    let totalProfit = 0;
    let totalExpenses = 0;
    let salesTodayCount = 0;
    let salesWeekCount = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter Sales by Date Range
    const filteredSales = allSales.filter(sale => {
        const d = sale.date.toDate();
        return d >= startDate && d <= endDate;
    });

    // Filter Expenses by Date Range
    const filteredExpenses = allExpenses.filter(exp => {
        const d = exp.date.toDate();
        return d >= startDate && d <= endDate;
    });

    // Prepare Chart Data Maps
    const chartMap = new Map();
    const profitMap = new Map();
    
    // Initialize chart map with days in range (up to 30 days to prevent overcrowding)
    // For simplicity in this view, we'll just map the actual data points found

    const productSales = {};
    const productProfits = {};

    // Process Sales
    filteredSales.forEach(sale => {
        const saleDate = sale.date.toDate();
        
        // Chart Data Aggregation
        const normalizedDate = new Date(saleDate);
        normalizedDate.setHours(0,0,0,0);
        const timeKey = normalizedDate.getTime();
        
        chartMap.set(timeKey, (chartMap.get(timeKey) || 0) + sale.revenue);
        profitMap.set(timeKey, (profitMap.get(timeKey) || 0) + sale.profit);

        // Total Profit (All time)
        totalProfit += sale.profit;
        totalSales += sale.revenue;

        // Today's Stats
        if (saleDate >= today) {
            todaySalesTotal += sale.revenue;
            todayProfitTotal += sale.profit;
            salesTodayCount++;
        }

        // Analytics Data Prep
        if (!productSales[sale.productName]) {
            productSales[sale.productName] = 0;
            productProfits[sale.productName] = 0;
        }
        productSales[sale.productName] += sale.quantity;
        productProfits[sale.productName] += sale.profit;
    });

    // Process Expenses
    filteredExpenses.forEach(exp => {
        totalExpenses += exp.amount;
        // Subtract expense from profit map for that day to show Net Profit on chart
        const expDate = exp.date.toDate();
        expDate.setHours(0,0,0,0);
        const timeKey = expDate.getTime();
        profitMap.set(timeKey, (profitMap.get(timeKey) || 0) - exp.amount);
    });

    const netProfit = totalProfit - totalExpenses;

    // Update DOM
    console.log("Updating DOM elements...");
    const todaySalesEl = document.getElementById('todaySales');
    const todayProfitEl = document.getElementById('todayProfit');
    const totalProfitEl = document.getElementById('totalProfit');
    const totalExpensesEl = document.getElementById('totalExpenses');
    const netProfitEl = document.getElementById('netProfit');
    const salesTodayEl = document.getElementById('salesToday');
    const salesThisWeekEl = document.getElementById('salesThisWeek');

    console.log("Elements found:", {
        todaySalesEl, todayProfitEl, totalProfitEl, totalExpensesEl,
        netProfitEl, salesTodayEl, salesThisWeekEl
    });

    if (todaySalesEl) todaySalesEl.textContent = `₦${todaySalesTotal.toLocaleString()}`;
    if (todayProfitEl) todayProfitEl.textContent = isAdmin ? `₦${todayProfitTotal.toLocaleString()}` : '***';
    if (totalProfitEl) totalProfitEl.textContent = isAdmin ? `₦${totalProfit.toLocaleString()}` : '***';
    if (totalExpensesEl) totalExpensesEl.textContent = isAdmin ? `₦${totalExpenses.toLocaleString()}` : '***';

    if (netProfitEl) {
        netProfitEl.textContent = isAdmin ? `₦${netProfit.toLocaleString()}` : '***';
        netProfitEl.style.color = netProfit >= 0 ? 'var(--success)' : 'var(--danger)';
    }

    if (salesTodayEl) salesTodayEl.textContent = salesTodayCount;
    if (salesThisWeekEl) salesThisWeekEl.textContent = filteredSales.length;

    // Calculate Best Sellers
    const mostSold = Object.keys(productSales).length > 0 
        ? Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b) 
        : '-';
    document.getElementById('mostSoldProduct').textContent = mostSold;

    const bestProfit = Object.keys(productProfits).length > 0
        ? Object.keys(productProfits).reduce((a, b) => productProfits[a] > productProfits[b] ? a : b)
        : '-';
    document.getElementById('bestProfitProduct').textContent = bestProfit;

    // Update Chart
    if (salesChart && profitChart) {
        console.log("Updating charts with data...");
        const chartLabels = [];
        const chartData = [];
        const profitData = [];

        // Sort dates
        const sortedKeys = Array.from(chartMap.keys()).sort();

        sortedKeys.forEach(key => {
            chartLabels.push(new Date(key).toLocaleDateString('en-US', { weekday: 'short' }));
            chartData.push(chartMap.get(key));
            profitData.push(profitMap.get(key) || 0);
        });

        console.log("Chart data:", { chartLabels, chartData, profitData });

        salesChart.updateOptions({
            xaxis: {
                categories: chartLabels
            }
        });

        salesChart.updateSeries([{
            data: chartData
        }]);

        profitChart.updateOptions({
            xaxis: {
                categories: chartLabels
            }
        });

        profitChart.updateSeries([{
            data: profitData
        }]);

        console.log("Charts updated successfully");
    } else {
        console.warn("Charts not initialized yet");
    }
}

// Event Listeners for Controls
document.getElementById('filterBtn').addEventListener('click', updateFinancials);

// Expense Modal Logic
const expenseModal = document.getElementById('expenseModal');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const closeExpenseModal = document.getElementById('closeExpenseModal');
const expenseForm = document.getElementById('expenseForm');

addExpenseBtn.addEventListener('click', () => {
    expenseModal.classList.remove('hidden');
    document.getElementById('expenseDate').valueAsDate = new Date();
});

closeExpenseModal.addEventListener('click', () => {
    expenseModal.classList.add('hidden');
});

expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const desc = document.getElementById('expenseDesc').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const dateVal = document.getElementById('expenseDate').value;

    if (!desc || isNaN(amount) || !dateVal) {
        alert("Please fill all fields");
        return;
    }

    try {
        await db.collection('users').doc(currentUser.uid).collection('expenses').add({
            description: desc,
            amount: amount,
            category: category,
            date: firebase.firestore.Timestamp.fromDate(new Date(dateVal)),
            createdAt: new Date()
        });
        
        expenseModal.classList.add('hidden');
        expenseForm.reset();
        showNotification("Expense recorded successfully", "success");
    } catch (error) {
        console.error("Error adding expense:", error);
        showNotification("Error recording expense", "error");
    }
});

// --- NEW FEATURES: Settings & Export ---

// Settings Modal Logic
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsModal = document.getElementById('closeSettingsModal');
const settingsForm = document.getElementById('settingsForm');

if (settingsBtn) {
    settingsBtn.addEventListener('click', async () => {
        settingsModal.classList.remove('hidden');
        // Populate current values
        const doc = await db.collection('users').doc(currentUser.uid).get();
        const data = doc.data();
        if (data) {
            document.getElementById('settingShopName').value = data.shopName || '';
            document.getElementById('settingPhone').value = data.phone || '';
            document.getElementById('settingAddress').value = data.address || '';
            document.getElementById('settingApiKey').value = data.apiKey || 'AIzaSyBIQf-hPJji-7-nwEsukdiS_UzRVlTOGGI';
        }
    });
    // If no data exists yet, ensure the key is still available in the form
    settingsBtn.addEventListener('click', () => {
        if (!document.getElementById('settingApiKey').value) {
            document.getElementById('settingApiKey').value = 'AIzaSyBIQf-hPJji-7-nwEsukdiS_UzRVlTOGGI';
        }
    });
}

if (closeSettingsModal) {
    closeSettingsModal.addEventListener('click', () => settingsModal.classList.add('hidden'));
}

if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const shopName = document.getElementById('settingShopName').value;
        const phone = document.getElementById('settingPhone').value;
        const address = document.getElementById('settingAddress').value;
        const apiKey = document.getElementById('settingApiKey').value;

        try {
            await db.collection('users').doc(currentUser.uid).update({
                shopName, phone, address, apiKey
            });
            localStorage.setItem('shopSettings', JSON.stringify({ shopName, phone, address, apiKey }));
            settingsModal.classList.add('hidden');
            showNotification("Settings saved!", "success");
        } catch (error) {
            console.error(error);
            showNotification("Error saving settings", "error");
        }
    });
}

// AI Assistant Logic
const aiBtn = document.getElementById('aiAssistantBtn');
const aiModal = document.getElementById('aiModal');
const closeAiModal = document.getElementById('closeAiModal');
const aiResponse = document.getElementById('aiResponse');

if (aiBtn) {
    aiBtn.addEventListener('click', async () => {
        // 1. Get API Key
        const settings = JSON.parse(localStorage.getItem('shopSettings')) || {};
        // Use saved key or the default one provided
        const apiKey = settings.apiKey || 'AIzaSyBIQf-hPJji-7-nwEsukdiS_UzRVlTOGGI';

        if (!apiKey) {
            alert("Please save your Gemini API Key in Settings first!");
            document.getElementById('settingsBtn').click();
            return;
        }

        // 2. Show Modal & Loading
        aiModal.classList.remove('hidden');
        aiResponse.innerHTML = '<div class="loading"></div> Analyzing your business data...';

        // 3. Prepare Data Summary
        const totalRevenue = allSales.reduce((sum, s) => sum + s.revenue, 0);
        const lowStockItems = allProducts.filter(p => p.quantity < 5).map(p => `${p.name} (${p.quantity} left)`);
        const topProducts = allSales.slice(0, 10).map(s => s.productName); // Simplified
        
        const prompt = `
            Act as a business consultant. Analyze this inventory data:
            - Total Revenue: ₦${totalRevenue}
            - Low Stock Items: ${lowStockItems.join(', ') || 'None'}
            - Recent Sales Count: ${allSales.length}
            
            Give me 3 short, actionable tips to improve profit and what to restock. 
            Format as a clean list.
        `;

        // 4. Call Gemini API
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message);
            }

            const text = data.candidates[0].content.parts[0].text;
            
            // Format bold text for HTML
            const formattedText = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\n/g, '<br>'); // New lines

            aiResponse.innerHTML = formattedText;

        } catch (error) {
            console.error("AI Error:", error);
            aiResponse.innerHTML = `<span style="color:var(--danger)">Error: ${error.message}</span>`;
        }
    });
}

if (closeAiModal) {
    closeAiModal.addEventListener('click', () => aiModal.classList.add('hidden'));
}

// Export Data Logic
document.getElementById('exportBtn')?.addEventListener('click', () => {
    const type = confirm("Export Sales Report? (Click Cancel for Inventory)") ? 'sales' : 'inventory';
    
    let data = [];
    let filename = '';

    if (type === 'sales') {
        data = allSales.map(s => ({
            Date: s.date.toDate().toLocaleDateString(),
            Product: s.productName,
            Quantity: s.quantity,
            Revenue: s.revenue,
            Profit: s.profit
        }));
        filename = 'sales_report.csv';
    } else {
        // We need to fetch products or use a cached version. For dashboard, we might not have all products loaded in a variable.
        // For simplicity, we'll export the sales data we have, or alert user to go to inventory page for inventory export.
        alert("To export Inventory, please go to the Inventory page.");
        return;
    }

    if (data.length === 0) return showNotification("No data to export", "warning");

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
});