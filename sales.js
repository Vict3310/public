class SalesManager {
    constructor() {
        this.products = [];
        this.cart = [];
        this.currentUser = null;
        this.init();
    }

    async init() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadProducts();
                this.setupEventListeners();
                this.loadRecentSales();
            }
        });
    }

    setupEventListeners() {
        document.getElementById('productSearch').addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        document.getElementById('clearCart').addEventListener('click', () => {
            this.clearCart();
        });

        document.getElementById('completeSale').addEventListener('click', () => {
            this.completeSale();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            });
        });

        // Payment method change listeners
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateCartSummary();
            });
        });

        // Discount change listener
        document.getElementById('discountAmount')?.addEventListener('input', () => {
            this.updateCartSummary();
        });
    }

    async loadProducts() {
        try {
            if (!this.currentUser) return;

            const snapshot = await firebase.firestore()
                .collection('users').doc(this.currentUser.uid)
                .collection('products')
                .where('quantity', '>', 0)
                .get();

            this.products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            showNotification('Error loading products: ' + error.message, 'error');
        }
    }

    renderProducts(productsToRender = this.products) {
        const container = document.getElementById('productsList');
        
        if (productsToRender.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-8); color: var(--gray-500);">
                    <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: var(--space-4);"></i>
                    <p>No products available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = productsToRender.map(product => `
            <div class="product-card" onclick="salesManager.addToCart('${product.id}')">
                <img src="${product.imageUrl || 'https://via.placeholder.com/200x200?text=No+Image'}" 
                     alt="${product.name}" class="product-image" loading="lazy">
                <div class="product-content">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-brand">${product.brand}</p>
                    <div class="product-price">₦${parseFloat(product.sellingPrice).toLocaleString()}</div>
                    <div class="product-stock">
                        <span>Stock: ${product.quantity}</span>
                    </div>
                    <button class="btn btn-primary btn-sm" style="width: 100%; margin-top: var(--space-2);">
                        <i class="fas fa-plus"></i>
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterProducts(searchTerm) {
        const filtered = this.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderProducts(filtered);
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            if (existingItem.quantity < product.quantity) {
                existingItem.quantity++;
            } else {
                showNotification('Not enough stock available', 'warning');
                return;
            }
        } else {
            this.cart.push({
                ...product,
                quantity: 1,
                originalQuantity: product.quantity,
                originalPrice: product.sellingPrice,
                useCustomPrice: false
            });
        }

        this.renderCart();
        this.updateCartSummary();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.renderCart();
        this.updateCartSummary();
    }

    updateQuantity(productId, newQuantity) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;

        if (newQuantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        if (newQuantity > item.originalQuantity) {
            showNotification('Not enough stock available', 'warning');
            return;
        }

        item.quantity = newQuantity;
        this.renderCart();
        this.updateCartSummary();
    }

    togglePriceType(productId, useCustomPrice) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;

        item.useCustomPrice = useCustomPrice;
        if (!useCustomPrice) {
            item.sellingPrice = item.originalPrice;
        }
        
        this.renderCart();
        this.updateCartSummary();
    }

    updateCustomPrice(productId, newPrice) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;

        if (newPrice <= 0) {
            showNotification('Price must be greater than 0', 'warning');
            return;
        }

        item.sellingPrice = newPrice;
        this.updateCartSummary();
    }

    renderCart() {
        const container = document.getElementById('cartItems');
        const summary = document.getElementById('cartSummary');

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="cart-empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Cart is empty</p>
                </div>
            `;
            summary.classList.add('hidden');
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <img src="${item.imageUrl || 'https://via.placeholder.com/50x50?text=No+Image'}" 
                     alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">Fixed: ₦${parseFloat(item.originalPrice).toLocaleString()}</div>
                        <div style="margin-top: var(--space-2);">
                            <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; margin-bottom: 4px;">
                                <input type="radio" name="priceType_${item.id}" value="fixed" 
                                       ${item.useCustomPrice ? '' : 'checked'} 
                                       onchange="salesManager.togglePriceType('${item.id}', false)">
                                Fixed Price
                            </label>
                            <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; margin-bottom: 4px;">
                                <input type="radio" name="priceType_${item.id}" value="custom" 
                                       ${item.useCustomPrice ? 'checked' : ''} 
                                       onchange="salesManager.togglePriceType('${item.id}', true)">
                                Custom Price
                            </label>
                            ${item.useCustomPrice ? `
                                <input type="number" value="${item.sellingPrice}" step="0.01" 
                                       style="width: 80px; margin-top: 4px; padding: 2px 4px; border: 1px solid var(--gray-300); border-radius: 4px; font-size: 0.75rem;"
                                       onchange="salesManager.updateCustomPrice('${item.id}', parseFloat(this.value))">
                            ` : ''}
                        </div>
                    </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="btn btn-secondary btn-sm" onclick="salesManager.updateQuantity('${item.id}', ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" value="${item.quantity}" min="1" max="${item.originalQuantity}" 
                               class="quantity-input"
                               onchange="salesManager.updateQuantity('${item.id}', parseInt(this.value))">
                        <button class="btn btn-secondary btn-sm" onclick="salesManager.updateQuantity('${item.id}', ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="salesManager.removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        summary.classList.remove('hidden');
    }

    updateCartSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
        const totalProfit = this.cart.reduce((sum, item) => sum + ((item.sellingPrice - item.costPrice) * item.quantity), 0);
        const discount = parseFloat(document.getElementById('discountAmount')?.value || 0);
        const finalTotal = subtotal - discount;

        document.getElementById('subtotal').textContent = `₦${subtotal.toLocaleString()}`;
        document.getElementById('totalProfit').textContent = `₦${totalProfit.toLocaleString()}`;
        document.getElementById('total').textContent = `₦${finalTotal.toLocaleString()}`;
        
        // Update payment method styling
        document.querySelectorAll('.payment-option').forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio.checked) {
                option.style.borderColor = 'var(--primary)';
                option.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
            } else {
                option.style.borderColor = 'var(--gray-200)';
                option.style.backgroundColor = 'transparent';
            }
        });
    }

    clearCart() {
        if (this.cart.length === 0) return;
        
        if (confirm('Are you sure you want to clear the cart?')) {
            this.cart = [];
            this.renderCart();
            this.updateCartSummary();
        }
    }

    async completeSale() {
        if (this.cart.length === 0) {
            showNotification('Cart is empty', 'warning');
            return;
        }

        try {
            if (!this.currentUser) throw new Error('User not authenticated');

            const customerName = document.getElementById('customerName').value.trim();
            const customerPhone = document.getElementById('customerPhone').value.trim();

            // Save customer if name or phone provided
            if (customerName || customerPhone) {
                await this.saveCustomerFromSale(customerName, customerPhone);
            }

            const subtotal = this.cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
            const totalProfit = this.cart.reduce((sum, item) => sum + ((item.sellingPrice - item.costPrice) * item.quantity), 0);

            const saleData = {
                items: this.cart.map(item => ({
                    productId: item.id,
                    name: item.name,
                    brand: item.brand,
                    quantity: item.quantity,
                    costPrice: item.costPrice,
                    originalPrice: item.originalPrice,
                    sellingPrice: item.sellingPrice,
                    useCustomPrice: item.useCustomPrice,
                    total: item.sellingPrice * item.quantity
                })),
                customerName: customerName || 'Walk-in Customer',
                customerPhone: customerPhone || '',
                subtotal: subtotal,
                profit: totalProfit,
                revenue: subtotal,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Save sale
            const saleRef = await firebase.firestore()
                .collection('users').doc(this.currentUser.uid)
                .collection('sales')
                .add(saleData);

            // Update product quantities
            const batch = firebase.firestore().batch();
            this.cart.forEach(item => {
                const productRef = firebase.firestore()
                    .collection('users').doc(this.currentUser.uid)
                    .collection('products').doc(item.id);
                batch.update(productRef, {
                    quantity: firebase.firestore.FieldValue.increment(-item.quantity)
                });
            });
            await batch.commit();

            // Prepare receipt data
            const receiptData = {
                transactionId: saleRef.id,
                date: new Date(),
                customer: customerName || 'Walk-in Customer',
                customerPhone: customerPhone,
                items: this.cart.map(item => ({
                    name: item.name,
                    qty: item.quantity,
                    price: item.sellingPrice,
                    total: item.sellingPrice * item.quantity
                })),
                subtotal: subtotal,
                discount: 0,
                total: subtotal,
                paymentMethod: 'Cash'
            };

            // Store receipt data for receipt page
            sessionStorage.setItem('receiptData', JSON.stringify(receiptData));

            showNotification('Sale completed successfully!', 'success');
            
            // Ask if user wants to generate receipt
            if (confirm('Sale completed! Would you like to generate a receipt?')) {
                window.location.href = 'receipt.html';
                return;
            }
            
            // Send WhatsApp receipt if customer phone provided
            if (customerPhone) {
                if (confirm('Send receipt via WhatsApp?')) {
                    window.whatsappManager.sendReceiptToCustomer(receiptData, customerPhone);
                }
            }
            
            // Clear cart and refresh
            this.cart = [];
            this.renderCart();
            this.updateCartSummary();
            document.getElementById('customerName').value = '';
            document.getElementById('customerPhone').value = '';
            
            await this.loadProducts();
            this.loadRecentSales();

        } catch (error) {
            console.error('Error completing sale:', error);
            showNotification('Failed to complete sale: ' + error.message, 'error');
        }
    }

    async saveCustomerFromSale(name, phone) {
        try {
            if (!name && !phone) return;

            // Check if customer already exists
            let existingCustomer = null;
            
            if (phone) {
                const phoneQuery = await firebase.firestore()
                    .collection('users').doc(this.currentUser.uid)
                    .collection('customers')
                    .where('phone', '==', phone)
                    .limit(1)
                    .get();
                
                if (!phoneQuery.empty) {
                    existingCustomer = { id: phoneQuery.docs[0].id, ...phoneQuery.docs[0].data() };
                }
            }

            if (existingCustomer) {
                // Update existing customer purchase count
                await firebase.firestore()
                    .collection('users').doc(this.currentUser.uid)
                    .collection('customers')
                    .doc(existingCustomer.id)
                    .update({
                        totalPurchases: firebase.firestore.FieldValue.increment(1),
                        lastPurchase: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
            } else {
                // Create new customer
                const customerData = {
                    name: name || 'Customer',
                    phone: phone || '',
                    email: '',
                    address: '',
                    creditLimit: 0,
                    creditBalance: 0,
                    loyaltyPoints: 0,
                    totalPurchases: 1,
                    lastPurchase: firebase.firestore.FieldValue.serverTimestamp(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await firebase.firestore()
                    .collection('users').doc(this.currentUser.uid)
                    .collection('customers')
                    .add(customerData);

                showNotification('New customer saved automatically', 'success');
            }
        } catch (error) {
            console.error('Error saving customer:', error);
            // Don't show error to user as this is background operation
        }
    }

    async loadRecentSales() {
        try {
            if (!this.currentUser) return;

            const snapshot = await firebase.firestore()
                .collection('users').doc(this.currentUser.uid)
                .collection('sales')
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();

            const sales = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderRecentSales(sales);
        } catch (error) {
            console.error('Error loading recent sales:', error);
        }
    }

    renderRecentSales(sales) {
        const container = document.getElementById('recentSales');
        
        if (sales.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="padding: var(--space-8); color: var(--gray-500);">
                    <i class="fas fa-chart-bar" style="font-size: 3rem; margin-bottom: var(--space-4);"></i>
                    <p>No sales recorded yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = sales.map(sale => `
            <div style="padding: var(--space-4); border: 1px solid var(--gray-200); border-radius: var(--border-radius); margin-bottom: var(--space-3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
                    <div style="font-weight: 600;">${sale.customerName}</div>
                    <div style="color: var(--success); font-weight: 600;">₦${parseFloat(sale.subtotal).toLocaleString()}</div>
                </div>
                <div style="font-size: 0.875rem; color: var(--gray-600);">
                    ${sale.items.length} item(s) • Profit: ₦${parseFloat(sale.totalProfit).toLocaleString()}
                </div>
                <div style="font-size: 0.75rem; color: var(--gray-500);">
                    ${sale.createdAt ? new Date(sale.createdAt.toDate()).toLocaleString() : 'Just now'}
                </div>
            </div>
        `).join('');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.salesManager = new SalesManager();
});