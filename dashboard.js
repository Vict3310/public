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

// Initialize dashboard
function initAuthListener() {
    auth.onAuthStateChanged(async user => {
        console.log("Dashboard auth state:", user ? "logged in" : "logged out");
        if (user) {
            currentUser = user;
            // Fetch User Role
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();

            // Payment Wall Check
            if (userData?.accountStatus === 'pending') {
                window.location.href = "payment.html";
                return;
            }

            currentUser.role = userData?.role || 'admin';
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
        localStorage.setItem(`shopSettings_${currentUser.uid}`, JSON.stringify(data));
    }
}

function initRealtimeDashboard() {
    console.log("🎯 Initializing real-time dashboard listeners for user:", currentUser.uid);

    // 1. Products Listener
    console.log("Setting up products listener...");
    const productsUnsub = db.collection('users').doc(currentUser.uid).collection('products')
        .onSnapshot(snapshot => {
            console.log("📦 Products snapshot received:", snapshot.size, "products");
            allProducts = [];
            snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
            updateProductStats(snapshot);
        }, error => {
            console.error("❌ Error listening to products:", error);
            showNotification("⚠️ Database Error: " + error.message, "error");
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
            showNotification("⚠️ Database Error: " + error.message, "error");
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
            showNotification("⚠️ Database Error: " + error.message, "error");
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
    }

    // Total Stock Value & Low Stock
    let totalValue = 0;
    let lowStockCount = 0;

    snapshot.forEach(doc => {
        const product = doc.data();
        totalValue += (product.sellingPrice || 0) * (product.quantity || 0);

        // Low Stock Alert (< 5)
        if ((product.quantity || 0) < (product.minStock || 5)) {
            lowStockCount++;
        }
    });

    // Update stats in dashboard
    const totalValueEl = document.getElementById('totalRevenue');
    if (totalValueEl) {
        totalValueEl.textContent = isAdmin ? `₦${totalValue.toLocaleString()}` : '***';
    }
    
    const lowStockEl = document.getElementById('lowStockCount');
    if (lowStockEl) {
        lowStockEl.textContent = lowStockCount;
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
    
    let totalRevenue = 0;
    let totalProfit = 0;
    let productsSold = 0;
    
    // Process Sales
    allSales.forEach(sale => {
        totalRevenue += sale.revenue || sale.subtotal || 0;
        totalProfit += sale.profit || 0;
        
        if (sale.items && Array.isArray(sale.items)) {
            productsSold += sale.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        }
    });
    
    // Process Expenses
    const totalExpenses = allExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const netProfit = totalProfit - totalExpenses;
    
    // Update DOM elements
    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalProfitEl = document.getElementById('totalProfit');
    const productsSoldEl = document.getElementById('productsSold');
    
    if (totalRevenueEl) totalRevenueEl.textContent = `₦${totalRevenue.toLocaleString()}`;
    if (totalProfitEl) totalProfitEl.textContent = isAdmin ? `₦${netProfit.toLocaleString()}` : '***';
    if (productsSoldEl) productsSoldEl.textContent = productsSold;
    
    // Update recent sales display
    updateRecentSalesDisplay();
}

function updateRecentSalesDisplay() {
    const container = document.getElementById('recentSales');
    if (!container) return;
    
    if (allSales.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: var(--space-8); color: var(--gray-500);">
                <i class="fas fa-chart-bar" style="font-size: 3rem; margin-bottom: var(--space-4);"></i>
                <p>No sales recorded yet</p>
            </div>
        `;
        return;
    }
    
    const recentSales = allSales.slice(0, 5); // Show last 5 sales
    container.innerHTML = recentSales.map(sale => `
        <div style="padding: var(--space-4); border: 1px solid var(--gray-200); border-radius: var(--border-radius); margin-bottom: var(--space-3);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 600;">${sale.customerName || 'Walk-in Customer'}</div>
                    <div style="color: var(--gray-600); font-size: 0.875rem;">
                        ${sale.items?.length || 0} item(s) • Profit: ₦${(sale.profit || 0).toLocaleString()}
                    </div>
                </div>
                <div style="color: var(--success); font-weight: 600;">
                    ₦${(sale.revenue || sale.subtotal || 0).toLocaleString()}
                </div>
            </div>
        </div>
    `).join('');
}

// Remove unused functions and simplify
function setupDateDefaults() {
    // Dashboard doesn't need date filters for now
}

function initChart() {
    // Simplified - remove charts for now to focus on core functionality
    console.log("Charts disabled for simplified version");
}

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
            await db.collection('users').doc(currentUser.uid).set({
                shopName, phone, address, apiKey
            }, { merge: true });
            // Save to user-specific localStorage key
            localStorage.setItem(`shopSettings_${currentUser.uid}`, JSON.stringify({ shopName, phone, address, apiKey }));
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

// Rate limiting for AI requests
let lastAiRequestTime = 0;
const AI_COOLDOWN_MS = 30000; // 30 seconds between requests

if (aiBtn) {
    aiBtn.addEventListener('click', async () => {
        // Check rate limiting
        const now = Date.now();
        if (now - lastAiRequestTime < AI_COOLDOWN_MS) {
            const remainingTime = Math.ceil((AI_COOLDOWN_MS - (now - lastAiRequestTime)) / 1000);
            aiModal.classList.remove('hidden');
            aiResponse.innerHTML = `<span style="color:var(--warning)">Please wait ${remainingTime} seconds before requesting another AI analysis.</span>`;
            return;
        }
        
        // 1. Get API Key from user-specific settings
        let settings = JSON.parse(localStorage.getItem(`shopSettings_${currentUser.uid}`)) || {};
        
        // Fallback: Load from Firestore if localStorage is empty
        if (!settings.apiKey) {
            try {
                const doc = await db.collection('users').doc(currentUser.uid).get();
                const data = doc.data();
                if (data && data.apiKey) {
                    settings = data;
                    // Cache in localStorage for faster future access
                    localStorage.setItem(`shopSettings_${currentUser.uid}`, JSON.stringify(settings));
                }
            } catch (error) {
                console.error("Error loading user settings:", error);
            }
        }
        
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
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        maxOutputTokens: 500, // Limit response length to save costs
                        temperature: 0.7
                    }
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
            
            // Update rate limiting timestamp on successful request
            lastAiRequestTime = Date.now();

        } catch (error) {
            console.error("AI Error:", error);
            
            // Handle specific error types with better user guidance
            let errorMessage = error.message;
            if (error.message.includes('quota') || error.message.includes('billing')) {
                errorMessage = `API quota exceeded. Please check your Google AI Studio billing at: <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--primary)">Google AI Studio</a> or upgrade your plan.`;
            } else if (error.message.includes('API_KEY')) {
                errorMessage = `Invalid API key. Please check your Gemini API key in Settings.`;
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = `Network error. Please check your internet connection and try again.`;
            }
            
            aiResponse.innerHTML = `<span style="color:var(--danger)">${errorMessage}</span>`;
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