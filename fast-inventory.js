// Fast Inventory Management System
class FastInventory {
    constructor() {
        this.user = null;
        this.products = [];
        this.productsCache = new Map();
        this.lastFetch = 0;
        this.CACHE_DURATION = 30000; // 30 seconds
        this.initializeInventory();
        this.setupEventListeners();
    }

    initializeInventory() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.user = user;
                this.loadProductsFast();
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    setupEventListeners() {
        // Debounced search
        let searchTimeout;
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.filterProducts(e.target.value), 300);
        });

        document.getElementById('addProductBtn').addEventListener('click', () => this.showProductModal());
        document.getElementById('modalClose').addEventListener('click', () => this.hideProductModal());
        document.getElementById('productFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
    }

    async loadProductsFast() {
        const now = Date.now();
        
        // Use cache if recent
        if (this.products.length > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
            this.renderProducts();
            this.updateMetrics();
            return;
        }

        try {
            // Show skeleton loading
            this.showSkeletonLoading();
            
            const snapshot = await firebase.firestore()
                .collection('products')
                .where('userId', '==', this.user.uid)
                .limit(50) // Limit initial load
                .get();
            
            this.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.lastFetch = now;
            
            // Cache products
            this.products.forEach(product => {
                this.productsCache.set(product.id, product);
            });
            
            this.renderProductsFast();
            this.updateMetrics();
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products');
        }
    }

    showSkeletonLoading() {
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = Array(6).fill(0).map(() => `
            <div class="card" style="animation: pulse 1.5s ease-in-out infinite;">
                <div style="height: 120px; background: var(--bg-secondary); border-radius: var(--radius); margin-bottom: var(--space-4);"></div>
                <div style="height: 20px; background: var(--bg-secondary); border-radius: var(--radius); margin-bottom: var(--space-2);"></div>
                <div style="height: 16px; background: var(--bg-secondary); border-radius: var(--radius); width: 60%;"></div>
            </div>
        `).join('');
    }

    renderProductsFast() {
        const grid = document.getElementById('productsGrid');
        
        if (this.products.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-12);">
                    <i class="fas fa-boxes" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: var(--space-4);"></i>
                    <h3>No Products Found</h3>
                    <p style="color: var(--text-secondary);">Add your first product to get started</p>
                </div>
            `;
            return;
        }
        
        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        this.products.forEach(product => {
            const card = this.createProductCardFast(product);
            fragment.appendChild(card);
        });
        
        grid.innerHTML = '';
        grid.appendChild(fragment);
    }

    createProductCardFast(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const profit = product.sellingPrice - product.costPrice;
        const stockStatus = product.quantity <= 10 ? 'low-stock' : '';
        const stockColor = product.quantity <= 10 ? 'var(--warning)' : 'var(--success)';
        
        card.innerHTML = `
            <div class="card" style="position: relative;">
                ${product.imageUrl ? `
                    <img src="${product.imageUrl}" style="width: 100%; height: 120px; object-fit: cover; border-radius: var(--radius); margin-bottom: var(--space-4);" loading="lazy">
                ` : `
                    <div style="width: 100%; height: 120px; background: var(--bg-tertiary); border-radius: var(--radius); margin-bottom: var(--space-4); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-image" style="font-size: 2rem; color: var(--text-muted);"></i>
                    </div>
                `}
                
                <h3 style="font-size: 1.125rem; font-weight: 600; margin: 0 0 var(--space-2) 0;">${product.name}</h3>
                <p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0 0 var(--space-4) 0;">${product.brand}</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4);">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Price</div>
                        <div style="font-weight: 600;">₦${product.sellingPrice.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Stock</div>
                        <div style="font-weight: 600; color: ${stockColor};">${product.quantity}</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: var(--space-2); justify-content: flex-end;">
                    <button class="btn btn-secondary" style="font-size: 0.75rem; padding: var(--space-1) var(--space-2);" onclick="fastInventory.editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" style="font-size: 0.75rem; padding: var(--space-1) var(--space-2);" onclick="fastInventory.deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                ${stockStatus ? `
                    <div style="position: absolute; top: var(--space-2); right: var(--space-2); background: var(--warning); color: white; padding: var(--space-1); border-radius: var(--radius); font-size: 0.75rem;">
                        LOW
                    </div>
                ` : ''}
            </div>
        `;
        
        return card;
    }

    updateMetrics() {
        const totalProducts = this.products.length;
        const totalValue = this.products.reduce((sum, product) => sum + (product.sellingPrice * product.quantity), 0);
        const lowStockCount = this.products.filter(product => product.quantity <= 10).length;
        
        // Instant updates without animation
        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalValue').textContent = `₦${totalValue.toLocaleString()}`;
        document.getElementById('lowStock').textContent = lowStockCount;
    }

    filterProducts(searchTerm) {
        if (!searchTerm) {
            this.renderProductsFast();
            return;
        }
        
        const filtered = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const grid = document.getElementById('productsGrid');
        const fragment = document.createDocumentFragment();
        
        filtered.forEach(product => {
            const card = this.createProductCardFast(product);
            fragment.appendChild(card);
        });
        
        grid.innerHTML = '';
        grid.appendChild(fragment);
    }

    showProductModal(productId = null) {
        document.getElementById('productModal').classList.remove('hidden');
        if (productId) {
            const product = this.productsCache.get(productId);
            if (product) this.populateForm(product);
        }
    }

    hideProductModal() {
        document.getElementById('productModal').classList.add('hidden');
        document.getElementById('productFormElement').reset();
    }

    populateForm(product) {
        document.getElementById('editProductId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('brand').value = product.brand;
        document.getElementById('costPrice').value = product.costPrice;
        document.getElementById('sellingPrice').value = product.sellingPrice;
        document.getElementById('quantity').value = product.quantity;
    }

    async saveProduct() {
        try {
            const productId = document.getElementById('editProductId').value;
            
            const productData = {
                userId: this.user.uid,
                name: document.getElementById('productName').value,
                brand: document.getElementById('brand').value,
                costPrice: parseFloat(document.getElementById('costPrice').value),
                sellingPrice: parseFloat(document.getElementById('sellingPrice').value),
                quantity: parseInt(document.getElementById('quantity').value),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (productId) {
                await firebase.firestore().collection('products').doc(productId).update(productData);
                // Update cache
                this.productsCache.set(productId, { id: productId, ...productData });
                // Update products array
                const index = this.products.findIndex(p => p.id === productId);
                if (index !== -1) {
                    this.products[index] = { id: productId, ...productData };
                }
            } else {
                productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                const docRef = await firebase.firestore().collection('products').add(productData);
                // Add to cache and array
                const newProduct = { id: docRef.id, ...productData };
                this.productsCache.set(docRef.id, newProduct);
                this.products.unshift(newProduct);
            }
            
            this.hideProductModal();
            this.renderProductsFast();
            this.updateMetrics();
            
        } catch (error) {
            console.error('Error saving product:', error);
            this.showError('Failed to save product');
        }
    }

    editProduct(productId) {
        this.showProductModal(productId);
    }

    async deleteProduct(productId) {
        if (!confirm('Delete this product?')) return;
        
        try {
            await firebase.firestore().collection('products').doc(productId).delete();
            
            // Remove from cache and array
            this.productsCache.delete(productId);
            this.products = this.products.filter(p => p.id !== productId);
            
            this.renderProductsFast();
            this.updateMetrics();
            
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showError('Failed to delete product');
        }
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: var(--danger);
            color: white; padding: var(--space-4); border-radius: var(--radius);
            z-index: 1000; animation: slideInRight 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    async handleLogout() {
        await firebase.auth().signOut();
        window.location.href = 'index.html';
    }
}

// Initialize Fast Inventory
document.addEventListener('DOMContentLoaded', () => {
    window.fastInventory = new FastInventory();
});

// Add pulse animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    @keyframes slideInRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
`;
document.head.appendChild(style);