// Neural Inventory Management System
class NeuralInventory {
    constructor() {
        this.user = null;
        this.products = [];
        this.scanner = null;
        this.initializeInventory();
        this.setupEventListeners();
    }

    initializeInventory() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.user = user;
                this.loadProducts();
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        // Add product button
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.showProductModal();
        });

        // Import CSV
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('csvInput').click();
        });

        document.getElementById('csvInput').addEventListener('change', (e) => {
            this.importCSV(e.target.files[0]);
        });

        // Modal controls
        document.getElementById('modalClose').addEventListener('click', () => {
            this.hideProductModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideProductModal();
        });

        // Product form
        document.getElementById('productFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Image preview
        document.getElementById('productImage').addEventListener('change', (e) => {
            this.previewImage(e.target.files[0]);
        });

        // Barcode scanner
        document.getElementById('scanBarcodeBtn').addEventListener('click', () => {
            this.showBarcodeScanner();
        });

        document.getElementById('closeScannerModal').addEventListener('click', () => {
            this.hideBarcodeScanner();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
    }

    async loadProducts() {
        try {
            this.showNeuralLoading('Loading neural inventory...');
            
            const snapshot = await firebase.firestore()
                .collection('products')
                .where('userId', '==', this.user.uid)
                .orderBy('createdAt', 'desc')
                .get();
            
            this.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.renderProducts();
            this.updateMetrics();
            this.hideNeuralLoading();
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNeuralToast('Neural loading error occurred', 'error');
        }
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        
        if (this.products.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-12); color: var(--text-secondary);">
                    <div style="font-size: 4rem; margin-bottom: var(--space-4); opacity: 0.3;">🧠</div>
                    <h3 style="margin-bottom: var(--space-2);">Neural Matrix Empty</h3>
                    <p>No products found in the neural database</p>
                    <button class="btn-holo" style="margin-top: var(--space-4);" onclick="neuralInventory.showProductModal()">
                        Add First Neural Node
                    </button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.products.map(product => this.createProductCard(product)).join('');
    }

    createProductCard(product) {
        const profit = product.sellingPrice - product.costPrice;
        const profitMargin = ((profit / product.sellingPrice) * 100).toFixed(1);
        const stockStatus = product.quantity <= 10 ? 'low-stock' : product.quantity === 0 ? 'out-of-stock' : '';
        const stockColor = product.quantity <= 10 ? 'var(--warning)' : product.quantity === 0 ? 'var(--danger)' : 'var(--success)';
        
        return `
            <div class="neural-card product-card ${stockStatus}" style="position: relative; overflow: hidden;">
                ${product.imageUrl ? `
                    <img src="${product.imageUrl}" style="width: 100%; height: 150px; object-fit: cover; border-radius: var(--radius); margin-bottom: var(--space-4);">
                ` : `
                    <div style="width: 100%; height: 150px; background: var(--bg-neural); border-radius: var(--radius); margin-bottom: var(--space-4); display: flex; align-items: center; justify-content: center; font-size: 3rem; opacity: 0.3;">
                        📦
                    </div>
                `}
                
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-4);">
                    <div>
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin: 0 0 var(--space-1) 0;">${product.name}</h3>
                        <p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0;">${product.brand}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Stock</div>
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${stockColor};">${product.quantity}</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4);">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Cost Price</div>
                        <div style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">₦${product.costPrice.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Selling Price</div>
                        <div style="font-size: 1rem; font-weight: 600; color: var(--success);">₦${product.sellingPrice.toLocaleString()}</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-6);">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Profit</div>
                        <div style="font-size: 1rem; font-weight: 600; color: ${profit > 0 ? 'var(--success)' : 'var(--danger)'};">₦${profit.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Margin</div>
                        <div style="font-size: 1rem; font-weight: 600; color: ${profit > 0 ? 'var(--success)' : 'var(--danger)'};">${profitMargin}%</div>
                    </div>
                </div>
                
                ${product.category ? `
                    <div style="margin-bottom: var(--space-4);">
                        <span style="background: var(--bg-neural); color: var(--primary); padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            ${product.category}
                        </span>
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: var(--space-2); justify-content: flex-end;">
                    <button class="neural-card" style="padding: var(--space-2) var(--space-3); cursor: pointer; border: 1px solid var(--info); font-size: 0.75rem;" onclick="neuralInventory.editProduct('${product.id}')">
                        ✏️ Edit
                    </button>
                    <button class="neural-card" style="padding: var(--space-2) var(--space-3); cursor: pointer; border: 1px solid var(--danger); font-size: 0.75rem;" onclick="neuralInventory.deleteProduct('${product.id}')">
                        🗑️ Delete
                    </button>
                </div>
                
                ${stockStatus ? `
                    <div style="position: absolute; top: var(--space-3); left: var(--space-3); background: ${stockColor}; color: white; padding: var(--space-1) var(--space-2); border-radius: var(--radius); font-size: 0.75rem; font-weight: 600;">
                        ${product.quantity === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                    </div>
                ` : ''}
            </div>
        `;
    }

    updateMetrics() {
        const totalProducts = this.products.length;
        const totalValue = this.products.reduce((sum, product) => sum + (product.sellingPrice * product.quantity), 0);
        const lowStockCount = this.products.filter(product => product.quantity <= 10).length;
        
        this.animateValue('totalProducts', totalProducts);
        this.animateValue('totalValue', `₦${totalValue.toLocaleString()}`);
        this.animateValue('lowStock', lowStockCount);
    }

    animateValue(elementId, finalValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.style.textShadow = '0 0 20px var(--primary)';
        element.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            element.textContent = finalValue;
            element.style.textShadow = 'none';
            element.style.transform = 'scale(1)';
        }, 300);
    }

    filterProducts(searchTerm) {
        const filtered = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = filtered.map(product => this.createProductCard(product)).join('');
    }

    showProductModal(productId = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('modalTitle');
        
        if (productId) {
            const product = this.products.find(p => p.id === productId);
            title.textContent = 'Edit Neural Node';
            this.populateForm(product);
        } else {
            title.textContent = 'Add Neural Node';
            this.clearForm();
        }
        
        modal.classList.remove('hidden');
    }

    hideProductModal() {
        document.getElementById('productModal').classList.add('hidden');
        this.clearForm();
    }

    populateForm(product) {
        document.getElementById('editProductId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('brand').value = product.brand;
        document.getElementById('barcode').value = product.barcode || '';
        document.getElementById('category').value = product.category || '';
        document.getElementById('storage').value = product.storage || '';
        document.getElementById('costPrice').value = product.costPrice;
        document.getElementById('sellingPrice').value = product.sellingPrice;
        document.getElementById('quantity').value = product.quantity;
        document.getElementById('supplierName').value = product.supplierName || '';
        document.getElementById('supplierPhone').value = product.supplierPhone || '';
        
        if (product.imageUrl) {
            const preview = document.getElementById('imagePreview');
            preview.src = product.imageUrl;
            preview.style.display = 'block';
        }
    }

    clearForm() {
        document.getElementById('productFormElement').reset();
        document.getElementById('editProductId').value = '';
        document.getElementById('imagePreview').style.display = 'none';
    }

    async saveProduct() {
        try {
            this.showNeuralLoading('Saving neural node...');
            
            const productId = document.getElementById('editProductId').value;
            const imageFile = document.getElementById('productImage').files[0];
            
            let imageUrl = '';
            if (imageFile) {
                imageUrl = await this.uploadImage(imageFile);
            } else if (productId) {
                const existingProduct = this.products.find(p => p.id === productId);
                imageUrl = existingProduct?.imageUrl || '';
            }
            
            const productData = {
                userId: this.user.uid,
                name: document.getElementById('productName').value,
                brand: document.getElementById('brand').value,
                barcode: document.getElementById('barcode').value,
                category: document.getElementById('category').value,
                storage: document.getElementById('storage').value,
                costPrice: parseFloat(document.getElementById('costPrice').value),
                sellingPrice: parseFloat(document.getElementById('sellingPrice').value),
                quantity: parseInt(document.getElementById('quantity').value),
                supplierName: document.getElementById('supplierName').value,
                supplierPhone: document.getElementById('supplierPhone').value,
                imageUrl: imageUrl,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (productId) {
                await firebase.firestore().collection('products').doc(productId).update(productData);
                this.showNeuralToast('Neural node updated successfully', 'success');
            } else {
                productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await firebase.firestore().collection('products').add(productData);
                this.showNeuralToast('Neural node added to matrix', 'success');
            }
            
            this.hideProductModal();
            this.loadProducts();
            
        } catch (error) {
            console.error('Error saving product:', error);
            this.showNeuralToast('Neural save error occurred', 'error');
        } finally {
            this.hideNeuralLoading();
        }
    }

    async uploadImage(file) {
        const storageRef = firebase.storage().ref();
        const imageRef = storageRef.child(`products/${this.user.uid}/${Date.now()}_${file.name}`);
        
        const snapshot = await imageRef.put(file);
        return await snapshot.ref.getDownloadURL();
    }

    previewImage(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('imagePreview');
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    editProduct(productId) {
        this.showProductModal(productId);
    }

    async deleteProduct(productId) {
        if (confirm('Delete this neural node from the matrix?')) {
            try {
                this.showNeuralLoading('Removing neural node...');
                
                await firebase.firestore().collection('products').doc(productId).delete();
                
                this.showNeuralToast('Neural node removed from matrix', 'success');
                this.loadProducts();
                
            } catch (error) {
                console.error('Error deleting product:', error);
                this.showNeuralToast('Neural deletion error occurred', 'error');
            } finally {
                this.hideNeuralLoading();
            }
        }
    }

    showBarcodeScanner() {
        const modal = document.getElementById('scannerModal');
        modal.classList.remove('hidden');
        
        this.scanner = new Html5QrcodeScanner("reader", {
            qrbox: { width: 250, height: 250 },
            fps: 20
        });
        
        this.scanner.render((decodedText) => {
            document.getElementById('barcode').value = decodedText;
            this.hideBarcodeScanner();
            this.showNeuralToast('Neural barcode captured', 'success');
        });
    }

    hideBarcodeScanner() {
        document.getElementById('scannerModal').classList.add('hidden');
        if (this.scanner) {
            this.scanner.clear();
            this.scanner = null;
        }
    }

    async importCSV(file) {
        if (!file) return;
        
        try {
            this.showNeuralLoading('Importing neural data...');
            
            const text = await file.text();
            const lines = text.split('\n');
            const headers = lines[0].split(',');
            
            let imported = 0;
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length >= 5) {
                    const productData = {
                        userId: this.user.uid,
                        name: values[0]?.trim(),
                        brand: values[1]?.trim(),
                        costPrice: parseFloat(values[2]) || 0,
                        sellingPrice: parseFloat(values[3]) || 0,
                        quantity: parseInt(values[4]) || 0,
                        category: values[5]?.trim() || 'Others',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    
                    await firebase.firestore().collection('products').add(productData);
                    imported++;
                }
            }
            
            this.showNeuralToast(`${imported} neural nodes imported successfully`, 'success');
            this.loadProducts();
            
        } catch (error) {
            console.error('Error importing CSV:', error);
            this.showNeuralToast('Neural import error occurred', 'error');
        } finally {
            this.hideNeuralLoading();
        }
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

    showNeuralLoading(message = 'Processing neural data...') {
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
        overlay.querySelector('p').textContent = message;
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
        }
        
        toast.innerHTML = `<div style="font-weight: 500;">${message}</div>`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Initialize Neural Inventory
document.addEventListener('DOMContentLoaded', () => {
    window.neuralInventory = new NeuralInventory();
});