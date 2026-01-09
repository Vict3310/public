// Sales Module

let currentUser = null;
let products = [];
let cart = [];

// Initialize sales
auth.onAuthStateChanged(async user => {
    if (user) {
        currentUser = user;
        // Fetch User Role
        const userDoc = await db.collection('users').doc(user.uid).get();
        currentUser.role = userDoc.data()?.role || 'admin';
        loadProductsForSale();
        loadSalesHistory();
    }
});

// Load products for sale dropdown
async function loadProductsForSale() {
    const grid = document.getElementById('salesProductGrid');
    grid.innerHTML = '<div class="loading"></div>';

    try {
        const snapshot = await db.collection('users').doc(currentUser.uid).collection('products').get();
        products = [];
        grid.innerHTML = '';

        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            products.push(product);
            
            // Create Card
            const card = document.createElement('div');
            card.className = `sales-product-card ${product.quantity === 0 ? 'out-of-stock' : ''}`;
            card.onclick = () => addToCart(product.id);
            
            card.innerHTML = `
                <h4>${product.name}</h4>
                <p>${product.brand}</p>
                <p style="color: var(--primary); font-weight: bold;">₦${product.sellingPrice}</p>
                <p style="font-size: 0.8rem; color: ${product.quantity < 5 ? 'var(--danger)' : 'var(--text-secondary)'}">
                    ${product.quantity} in stock
                </p>
            `;
            
            if (product.quantity > 0) {
                grid.appendChild(card);
            }
        });

        // Setup Search
        document.getElementById('salesSearchInput').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = grid.getElementsByClassName('sales-product-card');
            Array.from(cards).forEach(card => {
                const text = card.innerText.toLowerCase();
                card.style.display = text.includes(term) ? 'block' : 'none';
            });
        });

    } catch (error) {
        console.error('Error loading products for sale:', error);
        grid.innerHTML = '<p style="color:red">Error loading products</p>';
    }
}

// Barcode Scanner Logic
const startScanBtn = document.getElementById('startScanBtn');
const scannerModal = document.getElementById('scannerModal');
const closeScannerModal = document.getElementById('closeScannerModal');
let html5QrcodeScanner = null;

if (startScanBtn) {
    startScanBtn.addEventListener('click', () => {
        scannerModal.classList.remove('hidden');
        startScanner();
    });
}

if (closeScannerModal) {
    closeScannerModal.addEventListener('click', () => {
        scannerModal.classList.add('hidden');
        if (html5QrcodeScanner) html5QrcodeScanner.clear();
    });
}

function startScanner() {
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    html5QrcodeScanner.render((decodedText) => {
        const product = products.find(p => p.barcode === decodedText);
        if (product) {
            addToCart(product.id);
            showNotification(`Added ${product.name} to cart`, "success");
        } else {
            showNotification("Product not found", "error");
        }
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.quantity <= 0) {
        showNotification('Product out of stock', 'error');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.cartQty < product.quantity) {
            existingItem.cartQty++;
        } else {
            showNotification('Max stock reached for this item', 'warning');
        }
    } else {
        cart.push({
            ...product,
            cartQty: 1,
            originalPrice: product.sellingPrice // Keep track of original price
        });
    }

    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function updateCartQty(index, change) {
    const item = cart[index];
    const newQty = item.cartQty + change;
    
    if (newQty > 0 && newQty <= item.quantity) {
        item.cartQty = newQty;
        renderCart();
    }
}

function renderCart() {
    const cartContainer = document.getElementById('cartItems');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart-message">Cart is empty</div>';
        checkoutBtn.disabled = true;
        updateCartTotals();
        return;
    }

    cartContainer.innerHTML = '';
    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>₦${item.sellingPrice.toLocaleString()} x ${item.cartQty}</p>
            </div>
            <div class="cart-item-actions">
                <button class="cart-qty-btn" onclick="updateCartQty(${index}, -1)">-</button>
                <span>${item.cartQty}</span>
                <button class="cart-qty-btn" onclick="updateCartQty(${index}, 1)">+</button>
                <button class="cart-remove-btn" onclick="removeFromCart(${index})">&times;</button>
            </div>
        `;
        cartContainer.appendChild(div);
    });

    checkoutBtn.disabled = false;
    updateCartTotals();
}

document.getElementById('cartDiscount').addEventListener('input', updateCartTotals);

function updateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.cartQty), 0);
    const discount = parseFloat(document.getElementById('cartDiscount').value) || 0;
    const total = Math.max(0, subtotal - discount);

    document.getElementById('cartSubtotal').textContent = `₦${subtotal.toLocaleString()}`;
    document.getElementById('cartTotal').textContent = `₦${total.toLocaleString()}`;
}

// Checkout Logic
document.getElementById('checkoutBtn').addEventListener('click', async () => {
    if (cart.length === 0) return;

    const paymentMethod = document.getElementById('paymentMethod').value;
    const discount = parseFloat(document.getElementById('cartDiscount').value) || 0;
    const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.cartQty), 0);
    
    // Feature: Customer Database (Simple)
    const customerName = prompt("Enter Customer Name (Optional):") || "Walk-in Customer";
    const customerPhone = prompt("Enter Customer WhatsApp Number (e.g. 23480...):") || "";

    // Calculate discount ratio to distribute discount across items for accurate profit tracking
    const discountRatio = subtotal > 0 ? (subtotal - discount) / subtotal : 1;
    const transactionId = 'TRX-' + Date.now();
    const saleDate = new Date();

    try {
        const batch = db.batch();
        const salesRef = db.collection('users').doc(currentUser.uid).collection('sales');
        const productsRef = db.collection('users').doc(currentUser.uid).collection('products');

        const receiptItems = [];

        for (const item of cart) {
            // Calculate effective revenue for this item after discount
            const itemRevenue = (item.sellingPrice * item.cartQty) * discountRatio;
            const itemProfit = itemRevenue - (item.costPrice * item.cartQty);

            const saleDoc = salesRef.doc();
            batch.set(saleDoc, {
                transactionId: transactionId,
                productId: item.id,
                productName: item.name,
                brand: item.brand,
                quantity: item.cartQty,
                sellingPrice: item.sellingPrice, // Unit price listed
                costPrice: item.costPrice,
                revenue: itemRevenue, // Actual money made after discount
                profit: itemProfit,
                date: saleDate,
                paymentMethod: paymentMethod,
                seller: currentUser.email,
                customer: customerName,
                customerPhone: customerPhone
            });

            const productDoc = productsRef.doc(item.id);
            batch.update(productDoc, {
                quantity: firebase.firestore.FieldValue.increment(-item.cartQty),
                lastUpdated: saleDate
            });

            receiptItems.push({
                name: item.name,
                qty: item.cartQty,
                price: item.sellingPrice,
                total: item.sellingPrice * item.cartQty
            });
        }

        await batch.commit();

        // Show sale summary
        document.getElementById('summaryText').textContent = 
            `Sale completed! Total: ₦${(subtotal - discount).toLocaleString()}`;
        document.getElementById('saleSummary').classList.remove('hidden');

        // Store for receipt
        const receiptData = {
            transactionId: transactionId,
            date: saleDate,
            items: receiptItems,
            subtotal: subtotal,
            discount: discount,
            total: subtotal - discount,
            paymentMethod: paymentMethod,
            customer: customerName,
            customerPhone: customerPhone
        };
        sessionStorage.setItem('receiptData', JSON.stringify(receiptData));

        // Reset form
        cart = [];
        document.getElementById('cartDiscount').value = '';
        renderCart();

        loadProductsForSale();
        loadSalesHistory();

    } catch (error) {
        console.error('Error processing checkout:', error);
        showNotification('Checkout failed: ' + error.message, 'error');
    }
});

// Generate receipt
document.getElementById('generateReceiptBtn').addEventListener('click', () => {
    // Data is already stored in sessionStorage upon successful sale
    window.location.href = 'receipt.html';
});

// Load sales history
async function loadSalesHistory() {
    const salesTableBody = document.getElementById('salesTableBody');
    salesTableBody.innerHTML = '';

    try {
        const snapshot = await db.collection('users').doc(currentUser.uid).collection('sales')
            .orderBy('date', 'desc')
            .limit(50)
            .get();

        snapshot.forEach(doc => {
            const sale = doc.data();
            const isAdmin = currentUser.role === 'admin';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale.productName}</td>
                <td>${sale.quantity}</td>
                <td>₦${sale.revenue.toLocaleString()}</td>
                <td>${isAdmin ? '₦' + sale.profit.toLocaleString() : '***'}</td>
                <td>${sale.date.toDate().toLocaleDateString()}</td>
                <td>
                    ${isAdmin ? `<button onclick="deleteSale('${doc.id}')" style="background: #dc3545; color: white; padding: 6px 10px; font-size: 0.8rem; border:none; border-radius:4px; cursor:pointer;">Delete</button>` : ''}
                </td>
            `;
            salesTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading sales history:', error);
        if (error.code === 'permission-denied') {
            showNotification("⚠️ Access Denied: Check Firestore Rules.", "error");
        }
    }
}

// Delete Sale
window.deleteSale = async (id) => {
    if (confirm("Process Return? This will restore stock and remove the sale.")) {
        try {
            const saleRef = db.collection('users').doc(currentUser.uid).collection('sales').doc(id);
            const saleDoc = await saleRef.get();
            
            if (saleDoc.exists) {
                const sale = saleDoc.data();
                
                // Restore stock if productId exists
                if (sale.productId) {
                    const productRef = db.collection('users').doc(currentUser.uid).collection('products').doc(sale.productId);
                    const productDoc = await productRef.get();
                    if (productDoc.exists) {
                        await productRef.update({
                            quantity: firebase.firestore.FieldValue.increment(sale.quantity)
                        });
                    }
                }
                
                // Delete the sale record
                await saleRef.delete();
            }

            // Audit Log
            await db.collection('users').doc(currentUser.uid).collection('audit_logs').add({
                action: 'RETURN_SALE',
                saleId: id,
                user: currentUser.email,
                timestamp: new Date()
            });
            
            loadSalesHistory(); // Refresh the table
            showNotification("Return processed successfully.", "success");
        } catch (error) {
            console.error("Error deleting sale:", error);
            showNotification("Error deleting sale: " + error.message, "error");
        }
    }
};