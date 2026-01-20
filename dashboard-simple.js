// Dashboard Module
console.log("🚀 dashboard.js loaded - starting initialization");

let currentUser = null;
let listeners = [];
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
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        const data = doc.data();
        if (data) {
            localStorage.setItem(`shopSettings_${currentUser.uid}`, JSON.stringify(data));
        }
    } catch (error) {
        console.error("Error loading settings:", error);
    }
}

function initRealtimeDashboard() {
    console.log("🎯 Initializing real-time dashboard listeners for user:", currentUser.uid);

    // 1. Products Listener
    const productsUnsub = db.collection('users').doc(currentUser.uid).collection('products')
        .onSnapshot(snapshot => {
            allProducts = [];
            snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
            updateProductStats(snapshot);
        }, error => {
            console.error("❌ Error listening to products:", error);
            showNotification("⚠️ Database Error: " + error.message, "error");
        });

    listeners.push(productsUnsub);

    // 2. Sales Listener
    const salesUnsub = db.collection('users').doc(currentUser.uid).collection('sales')
        .onSnapshot(snapshot => {
            allSales = [];
            snapshot.forEach(doc => allSales.push({ id: doc.id, ...doc.data() }));
            updateFinancials();
        }, error => {
            console.error("❌ Error listening to sales:", error);
            showNotification("⚠️ Database Error: " + error.message, "error");
        });

    listeners.push(salesUnsub);

    // 3. Expenses Listener
    const expensesUnsub = db.collection('users').doc(currentUser.uid).collection('expenses')
        .onSnapshot(snapshot => {
            allExpenses = [];
            snapshot.forEach(doc => allExpenses.push({ id: doc.id, ...doc.data() }));
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
    const isAdmin = currentUser.role === 'admin';
    
    // Total Products - this doesn't exist in dashboard.html, so we'll skip it
    
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
    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) {
        totalRevenueEl.textContent = isAdmin ? `₦${totalValue.toLocaleString()}` : '***';
    }
    
    const lowStockEl = document.getElementById('lowStockCount');
    if (lowStockEl) {
        lowStockEl.textContent = lowStockCount;
    }
}

// Update Financial Stats (Sales + Expenses)
function updateFinancials() {
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