class InventoryManager {
    constructor() {
        this.products = [];
        this.currentUser = null;
        this.init();
    }

    async init() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadProducts();
                this.setupEventListeners();
                this.updateStats();
            }
        });
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', 
            this.debounce((e) => this.filterProducts(e.target.value), 300)
        );

        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.showProductModal();
        });

        document.getElementById('modalClose').addEventListener('click', () => {
            this.hideProductModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideProductModal();
        });

        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        document.getElementById('productImage').addEventListener('change', (e) => {
            this.previewImage(e.target.files[0]);
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('csvInput').click();
        });

        document.getElementById('csvInput').addEventListener('change', (e) => {
            this.importCSV(e.target.files[0]);
        });

        document.getElementById('scanBarcodeBtn').addEventListener('click', () => {
            window.barcodeScanner.startScanner((barcode) => {
                document.getElementById('barcode').value = barcode;
                showNotification('Barcode scanned: ' + barcode, 'success');
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            });
        });

        // Export data functionality
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            const options = [
                { text: 'Export All Data (JSON)', action: () => window.dataManager.exportAllData() },
                { text: 'Export Products (CSV)', action: () => window.dataManager.exportToCSV('products') },
                { text: 'Export Sales (CSV)', action: () => window.dataManager.exportToCSV('sales') },
                { text: 'Export Customers (CSV)', action: () => window.dataManager.exportToCSV('customers') }
            ];
            
            const choice = prompt('Choose export option:\n' + 
                options.map((opt, i) => `${i + 1}. ${opt.text}`).join('\n') + 
                '\nEnter number (1-4):');
            
            const selectedOption = options[parseInt(choice) - 1];
            if (selectedOption) {
                selectedOption.action();
            }
        });
    }

    async loadProducts() {
        try {
            this.showSkeleton();
            
            if (!this.currentUser) return;

            const snapshot = await firebase.firestore()
                .collection('users').doc(this.currentUser.uid)
                .collection('products')
                .get();
            
            this.products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => a.name.localeCompare(b.name));

            this.renderProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            showNotification('Error loading products: ' + error.message, 'error');
        }
    }

    renderProducts(productsToRender = this.products) {
        const grid = document.getElementById('productsGrid');
        
        if (productsToRender.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-12); color: var(--gray-500);">
                    <i class="fas fa-box-open" style="font-size: 4rem; margin-bottom: var(--space-4);"></i>
                    <h3 style="margin-bottom: var(--space-2);">No products found</h3>
                    <p>Add your first product to get started</p>
                </div>
            `;
            return;
        }

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        productsToRender.forEach(product => {
            const productCard = this.createProductCard(product);
            fragment.appendChild(productCard);
        });

        grid.innerHTML = '';
        grid.appendChild(fragment);
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const stockStatus = this.getStockStatus(product);
        const imageUrl = product.imageUrl || 'https://via.placeholder.com/200x200?text=No+Image';
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${product.name}" class="product-image" loading="lazy">
            <div class="product-content">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-brand">${product.brand}</p>
                <div class="product-price">₦${parseFloat(product.sellingPrice).toLocaleString()}</div>
                <div class="product-stock">
                    <span>Stock: ${product.quantity}</span>
                    <span class="stock-badge ${stockStatus.class}">${stockStatus.text}</span>
                </div>
                <div class="product-actions">
                    <button class="btn btn-secondary btn-sm" onclick="inventoryManager.editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-error btn-sm" onclick="inventoryManager.deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    getStockStatus(product) {
        if (product.quantity === 0) {
            return { class: 'out-of-stock', text: 'Out of Stock' };
        } else if (product.quantity <= product.minStock) {
            return { class: 'low-stock', text: 'Low Stock' };
        } else {
            return { class: 'in-stock', text: 'In Stock' };
        }
    }

    showSkeleton() {
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = Array(6).fill().map(() => `
            <div class="product-card">
                <div class="skeleton" style="height: 200px; margin-bottom: var(--space-4);"></div>
                <div style="padding: var(--space-5);">
                    <div class="skeleton" style="height: 20px; margin-bottom: var(--space-2);"></div>
                    <div class="skeleton" style="height: 16px; width: 60%; margin-bottom: var(--space-3);"></div>
                    <div class="skeleton" style="height: 24px; width: 40%; margin-bottom: var(--space-3);"></div>
                    <div class="skeleton" style="height: 16px; margin-bottom: var(--space-4);"></div>
                    <div style="display: flex; gap: var(--space-2);">
                        <div class="skeleton" style="height: 32px; flex: 1;"></div>
                        <div class="skeleton" style="height: 32px; flex: 1;"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterProducts(searchTerm) {
        const filtered = this.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderProducts(filtered);
    }

    showProductModal(product = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('productForm');
        
        if (product) {
            title.textContent = 'Edit Product';
            this.populateForm(product);
        } else {
            title.textContent = 'Add New Product';
            form.reset();
            document.getElementById('imagePreview').style.display = 'none';
        }
        
        modal.classList.remove('hidden');
    }

    hideProductModal() {
        document.getElementById('productModal').classList.add('hidden');
    }

    populateForm(product) {
        document.getElementById('editProductId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('brand').value = product.brand;
        document.getElementById('barcode').value = product.barcode || '';
        document.getElementById('category').value = product.category;
        document.getElementById('storage').value = product.storage || '';
        document.getElementById('costPrice').value = product.costPrice;
        document.getElementById('sellingPrice').value = product.sellingPrice;
        document.getElementById('quantity').value = product.quantity;
        document.getElementById('minStock').value = product.minStock;
        
        if (product.imageUrl) {
            const preview = document.getElementById('imagePreview');
            preview.src = product.imageUrl;
            preview.style.display = 'block';
        }
    }

    async saveProduct() {
        try {
            const formData = this.getFormData();
            
            if (!this.currentUser) throw new Error('User not authenticated');
            
            formData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            
            const productId = document.getElementById('editProductId').value;
            
            if (productId) {
                await firebase.firestore()
                    .collection('users').doc(this.currentUser.uid)
                    .collection('products')
                    .doc(productId)
                    .update(formData);
                showNotification('Product updated successfully', 'success');
            } else {
                formData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await firebase.firestore()
                    .collection('users').doc(this.currentUser.uid)
                    .collection('products')
                    .add(formData);
                showNotification('Product added successfully', 'success');
            }
            
            this.hideProductModal();
            await this.loadProducts();
            this.updateStats();
            
        } catch (error) {
            console.error('Error saving product:', error);
            showNotification('Failed to save product: ' + error.message, 'error');
        }
    }

    getFormData() {
        return {
            name: document.getElementById('productName').value.trim(),
            brand: document.getElementById('brand').value.trim(),
            barcode: document.getElementById('barcode').value.trim(),
            category: document.getElementById('category').value,
            storage: document.getElementById('storage').value.trim(),
            costPrice: parseFloat(document.getElementById('costPrice').value),
            sellingPrice: parseFloat(document.getElementById('sellingPrice').value),
            quantity: parseInt(document.getElementById('quantity').value),
            minStock: parseInt(document.getElementById('minStock').value) || 5,
            imageUrl: document.getElementById('imagePreview').src || null
        };
    }

    async editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showProductModal(product);
        }
    }

    previewImage(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    updateStats() {
        const totalProducts = this.products.length;
        const totalValue = this.products.reduce((sum, product) => 
            sum + (product.sellingPrice * product.quantity), 0
        );
        const lowStock = this.products.filter(product => 
            product.quantity <= (product.minStock || 5)
        ).length;
        
        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalValue').textContent = `₦${totalValue.toLocaleString()}`;
        document.getElementById('lowStock').textContent = lowStock;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async importCSV(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            const products = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length === headers.length) {
                    const product = {};
                    headers.forEach((header, index) => {
                        product[header] = values[index];
                    });
                    products.push(product);
                }
            }
            
            showNotification(`Imported ${products.length} products`, 'success');
            
        } catch (error) {
            console.error('Error importing CSV:', error);
            showNotification('Failed to import CSV file', 'error');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.inventoryManager = new InventoryManager();
});