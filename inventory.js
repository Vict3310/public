// Inventory Module - Liquid Glass UI
console.log("inventory.js loaded");

let currentUser = null;
let allProducts = []; // Cache for search functionality

// Initialize
auth.onAuthStateChanged(async user => {
    console.log("Inventory auth state:", user ? "logged in" : "logged out");
    if (user) {
        currentUser = user;
        // Fetch User Role
        const userDoc = await db.collection('users').doc(user.uid).get();
        currentUser.role = userDoc.data()?.role || 'admin';
        loadInventory();
    }
});

// DOM Elements - will be set up after DOM loads
let addProductBtn, importBtn, csvInput, productModal, modalClose, modalTitle, productFormElement, cancelBtn, productsGrid, searchInput;
let totalProductsEl, totalValueEl, lowStockEl;

// Modal Functions
function openModal(isEdit = false, productData = null) {
    const modalTitle = document.getElementById('modalTitle');
    const productModal = document.getElementById('productModal');
    const productFormElement = document.getElementById('productFormElement');

    modalTitle.textContent = isEdit ? 'Edit Product' : 'Add New Product';
    productModal.classList.remove('hidden');

    const imgPreview = document.getElementById('imagePreview');
    
    if (isEdit && productData) {
        document.getElementById('editProductId').value = productData.id;
        document.getElementById('productName').value = productData.name;
        document.getElementById('brand').value = productData.brand;
        document.getElementById('barcode').value = productData.barcode || '';
        document.getElementById('category').value = productData.category || '';
        document.getElementById('storage').value = productData.storage || '';
        document.getElementById('costPrice').value = productData.costPrice;
        document.getElementById('sellingPrice').value = productData.sellingPrice;
        document.getElementById('quantity').value = productData.quantity;
        document.getElementById('supplierName').value = productData.supplierName || '';
        document.getElementById('supplierPhone').value = productData.supplierPhone || '';
        
        if (productData.imageUrl) {
            imgPreview.src = productData.imageUrl;
            imgPreview.style.display = 'block';
        } else {
            imgPreview.style.display = 'none';
        }
    } else {
        productFormElement.reset();
        document.getElementById('editProductId').value = '';
        imgPreview.style.display = 'none';
    }
}

function closeModal() {
    console.log("closeModal called");
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productFormElement');

    if (modal) {
        modal.classList.add('hidden');
        console.log("Modal hidden");
    } else {
        console.log("Modal element not found");
    }

    if (form) {
        form.reset();
        console.log("Form reset");
    } else {
        console.log("Form element not found");
    }
}

// Wait for DOM to be fully loaded before setting up event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded, setting up event listeners...");

    // Get DOM elements
    addProductBtn = document.getElementById('addProductBtn');
    importBtn = document.getElementById('importBtn');
    csvInput = document.getElementById('csvInput');
    productModal = document.getElementById('productModal');
    modalClose = document.getElementById('modalClose');
    modalTitle = document.getElementById('modalTitle');
    productFormElement = document.getElementById('productFormElement');
    cancelBtn = document.getElementById('cancelBtn');
    productsGrid = document.getElementById('productsGrid');
    searchInput = document.getElementById('searchInput');
    totalProductsEl = document.getElementById('totalProducts');
    totalValueEl = document.getElementById('totalValue');
    lowStockEl = document.getElementById('lowStock');

    // Debug element selection
    console.log("DOM Elements found:");
    console.log("addProductBtn:", addProductBtn);
    console.log("productModal:", productModal);
    console.log("modalClose:", modalClose);
    console.log("cancelBtn:", cancelBtn);

// Event Listeners
console.log("Setting up event listeners...");

if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
        console.log("Add product button clicked");
        openModal(false);
    });
    console.log("Add product button listener attached");
} else {
    console.log("Add product button not found");
}

// Inject Print Barcodes Button
if (addProductBtn) {
    const printBtn = document.createElement('button');
    printBtn.className = 'btn btn-secondary';
    printBtn.innerHTML = '<span>🖨️</span> Barcodes';
    printBtn.style.marginLeft = '10px';
    printBtn.onclick = () => generateBarcodeSheet();
    // Insert after add button
    addProductBtn.parentNode.insertBefore(printBtn, addProductBtn.nextSibling);
}

if (importBtn && csvInput) {
    importBtn.addEventListener('click', () => csvInput.click());
    csvInput.addEventListener('change', handleCSVImport);
}

// Barcode Scanner Logic
const scanBarcodeBtn = document.getElementById('scanBarcodeBtn');
const scannerModal = document.getElementById('scannerModal');
const closeScannerModal = document.getElementById('closeScannerModal');
let html5QrcodeScanner = null;

if (scanBarcodeBtn) {
    scanBarcodeBtn.addEventListener('click', () => {
        scannerModal.classList.remove('hidden');
        startScanner();
    });
}

if (closeScannerModal) {
    closeScannerModal.addEventListener('click', () => {
        scannerModal.classList.add('hidden');
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear();
        }
    });
}

function startScanner() {
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    html5QrcodeScanner.render((decodedText) => {
        document.getElementById('barcode').value = decodedText;
        scannerModal.classList.add('hidden');
        html5QrcodeScanner.clear();
        showNotification("Barcode scanned!", "success");
    });
}

// Image Preview
document.getElementById('productImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('imagePreview');
            img.src = e.target.result;
            img.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

if (modalClose) {
    modalClose.addEventListener('click', (e) => {
        console.log("Modal close button clicked");
        e.preventDefault();
        closeModal();
    });
    console.log("Modal close button listener attached");
} else {
    console.log("Modal close button not found");
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
        console.log("Cancel button clicked");
        e.preventDefault();
        closeModal();
    });
    console.log("Cancel button listener attached");
} else {
    console.log("Cancel button not found");
}

// Close modal when clicking outside
if (productModal) {
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
            console.log("Clicked outside modal");
            closeModal();
        }
    });
    console.log("Modal overlay click listener attached");
} else {
    console.log("Product modal not found");
}

// Search functionality
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterProducts(searchTerm);
    });
}

// Form submission
if (productFormElement) {
    productFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser) {
            showNotification("You must be logged in to add products.", "error");
            return;
        }

        // Get values
        const editId = document.getElementById('editProductId').value;
        const name = document.getElementById('productName').value.trim();
        const brand = document.getElementById('brand').value.trim();
        const barcode = document.getElementById('barcode').value.trim();
        const category = document.getElementById('category').value;
        const storage = document.getElementById('storage').value.trim();
        const costPrice = parseFloat(document.getElementById('costPrice').value);
        const sellingPrice = parseFloat(document.getElementById('sellingPrice').value);
        const quantity = parseInt(document.getElementById('quantity').value);
        const supplierName = document.getElementById('supplierName').value.trim();
        const supplierPhone = document.getElementById('supplierPhone').value.trim();
        const imageFile = document.getElementById('productImage').files[0];

        // Validation
        if (!name || !brand || isNaN(costPrice) || isNaN(sellingPrice) || isNaN(quantity)) {
            showNotification("Please fill in all required fields with valid values.", "error");
            return;
        }

        if (costPrice < 0 || sellingPrice < 0 || quantity < 0) {
            showNotification("Prices and quantity cannot be negative.", "error");
            return;
        }

        // Disable button to prevent double-submit and show progress
        const submitBtn = productFormElement.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳</span> Saving...';

        try {
            let imageUrl = null;

            // Upload Image if selected
            if (imageFile) {
                // WORKAROUND: Compress and save image directly to Database (No Storage Bucket needed)
                submitBtn.innerHTML = '<span>🎨</span> Processing Image...';
                try {
                    imageUrl = await compressImage(imageFile);
                } catch (err) {
                    throw new Error("Image processing failed: " + err.message);
                }
            }

            const productData = {
                name,
                brand,
                barcode,
                category,
                storage: storage || null,
                costPrice,
                sellingPrice,
                quantity,
                supplierName,
                supplierPhone,
                userId: currentUser.uid,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            if (imageUrl) {
                productData.imageUrl = imageUrl;
            }

            if (editId) {
                // Update existing product
                delete productData.createdAt; // Don't update createdAt
                await db.collection('users').doc(currentUser.uid).collection('products').doc(editId).update(productData);
                showNotification("Product updated successfully!", "success");
            } else {
                // Add new product
                await db.collection('users').doc(currentUser.uid).collection('products').add(productData);
                showNotification("Product added successfully!", "success");
            }

            closeModal();
            loadInventory();
        } catch (error) {
            console.error("Error saving product:", error);
            showNotification("Error: " + error.message, "error");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    });
    }
});

// Load inventory from Firestore
async function loadInventory() {
    if (!currentUser) return;

    try {
        const snapshot = await db.collection('users').doc(currentUser.uid).collection('products')
            .orderBy('createdAt', 'desc')
            .get();

        allProducts = [];
        snapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });

        renderProducts(allProducts);
        updateStats(allProducts);
    } catch (error) {
        console.error("Error loading inventory:", error);
        if (error.code === 'permission-denied') {
            showNotification("⚠️ Access Denied: Check Firestore Rules in Console", "error");
        } else {
            showNotification("Error loading inventory: " + error.message, "error");
        }
    }
}

// Render products as cards
function renderProducts(products) {
    if (!productsGrid) return;

    productsGrid.innerHTML = '';

    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No products found</h3>
                <p>Add your first product to get started</p>
            </div>
        `;
        return;
    }

    products.forEach((product, index) => {
        const profit = (product.sellingPrice - product.costPrice) * product.quantity;
        const isLowStock = product.quantity <= 5;
        const isOutOfStock = product.quantity === 0;
        const isAdmin = currentUser.role === 'admin';

        const card = document.createElement('div');
        card.className = `product-card ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : ''}`;
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            ${product.imageUrl ? `<img src="${product.imageUrl}" class="product-img-display" alt="${product.name}">` : ''}
            <div class="product-header">
                <div>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-brand">${product.brand}</div>
                </div>
                <div class="product-actions">
                    <button class="btn-edit" onclick="editProduct('${product.id}')">Edit</button>
                    ${isAdmin ? `<button class="btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>` : ''}
                </div>
            </div>
            <div class="product-details">
                ${isAdmin ? `
                <div class="detail-item">
                    <div class="detail-label">Cost Price</div>
                    <div class="detail-value">₦${product.costPrice.toLocaleString()}</div>
                </div>
                ` : ''}
                <div class="detail-item">
                    <div class="detail-label">Selling Price</div>
                    <div class="detail-value">₦${product.sellingPrice.toLocaleString()}</div>
                </div>
                ${isAdmin ? `
                <div class="detail-item">
                    <div class="detail-label">Profit</div>
                    <div class="detail-value ${profit >= 0 ? 'profit' : 'loss'}">₦${profit.toLocaleString()}</div>
                </div>
                ` : ''}
                <div class="detail-item">
                    <div class="detail-label">Quantity</div>
                    <div class="detail-value">${product.quantity}</div>
                </div>
                ${product.storage ? `
                    <div class="detail-item">
                        <div class="detail-label">Storage</div>
                        <div class="detail-value">${product.storage}</div>
                    </div>
                ` : ''}
                ${product.category ? `
                    <div class="detail-item">
                        <div class="detail-label">Category</div>
                        <div class="detail-value">${product.category}</div>
                    </div>
                ` : ''}
            </div>
        `;

        productsGrid.appendChild(card);
    });
}

// Filter products based on search
function filterProducts(searchTerm) {
    const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        (product.storage && product.storage.toLowerCase().includes(searchTerm))
    );
    renderProducts(filtered);
}

// Update statistics
function updateStats(products) {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + (product.sellingPrice * product.quantity), 0);
    const lowStock = products.filter(product => product.quantity <= 5 && product.quantity > 0).length;

    if (totalProductsEl) totalProductsEl.textContent = totalProducts;
    if (totalValueEl) totalValueEl.textContent = `₦${totalValue.toLocaleString()}`;
    if (lowStockEl) lowStockEl.textContent = lowStock;
}

// Edit product
window.editProduct = function (productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        openModal(true, product);
    }
}

// Delete product
window.deleteProduct = async function (productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        await db.collection('users').doc(currentUser.uid).collection('products').doc(productId).delete();
        logAudit('DELETE_PRODUCT', `Deleted product ID: ${productId}`);
        showNotification("Product deleted successfully!", "success");
        loadInventory();
    } catch (error) {
        console.error("Error deleting product:", error);
        showNotification("Error deleting product. Please try again.", "error");
    }
}

// CSV Import Handler
async function handleCSVImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const text = event.target.result;
        const rows = text.split('\n').slice(1); // Skip header
        
        const batch = db.batch();
        let count = 0;

        rows.forEach(row => {
            if (!row.trim()) return;
            
            // Expected CSV format: Name,Brand,Category,Cost,Price,Qty
            const cols = row.split(',');
            if (cols.length >= 6) {
                const docRef = db.collection('users').doc(currentUser.uid).collection('products').doc();
                batch.set(docRef, {
                    name: cols[0].trim(),
                    brand: cols[1].trim(),
                    barcode: '', // Default empty for CSV import
                    category: cols[2].trim(),
                    costPrice: parseFloat(cols[3]),
                    sellingPrice: parseFloat(cols[4]),
                    quantity: parseInt(cols[5]),
                    createdAt: new Date(),
                    userId: currentUser.uid
                });
                count++;
            }
        });

        await batch.commit();
        showNotification(`Successfully imported ${count} products!`, 'success');
        loadInventory();
        e.target.value = ''; // Reset input
    };
    reader.readAsText(file);
}

// --- IMAGE COMPRESSION (For Database Storage) ---
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const maxWidth = 600; // Resize to max 600px width
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG at 70% quality to save space
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (err) => reject(new Error("Failed to load image"));
        };
        reader.onerror = (err) => reject(err);
    });
}

// --- NEW FEATURES ---

// 1. Audit Trail Helper
async function logAudit(action, details) {
    try {
        await db.collection('users').doc(currentUser.uid).collection('audit_logs').add({
            action,
            details,
            user: currentUser.email,
            timestamp: new Date()
        });
    } catch (e) { console.error("Audit log failed", e); }
}

// 2. Barcode Generator
window.generateBarcodeSheet = function() {
    const printWindow = window.open('', '_blank');
    let html = `
        <html><head><title>Print Barcodes</title>
        <style>
            body { font-family: sans-serif; display: flex; flex-wrap: wrap; gap: 20px; padding: 20px; }
            .label { border: 1px dashed #ccc; padding: 10px; text-align: center; width: 150px; height: 80px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
            .name { font-size: 12px; font-weight: bold; margin-bottom: 5px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; width: 100%; }
            .price { font-size: 14px; font-weight: bold; }
        </style>
        </head><body>
    `;
    
    allProducts.forEach(p => {
        // Simple barcode representation (Name + Price)
        html += `<div class="label"><div class="name">${p.name}</div><div class="price">₦${p.sellingPrice}</div><div style="font-size:10px">${p.barcode || p.id.substring(0,8)}</div></div>`;
    });
    
    html += `<script>window.print();</script></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Show with animation
    setTimeout(() => notification.classList.add('show'), 100);

    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification styles dynamically
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 15px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification-success {
        background: rgba(68, 255, 68, 0.9);
        border-color: rgba(68, 255, 68, 0.3);
    }

    .notification-error {
        background: rgba(255, 68, 68, 0.9);
        border-color: rgba(255, 68, 68, 0.3);
    }

    .notification-info {
        background: rgba(68, 68, 255, 0.9);
        border-color: rgba(68, 68, 255, 0.3);
    }

    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
    }

    .empty-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        opacity: 0.6;
    }

    .empty-state h3 {
        color: var(--primary);
        margin-bottom: 10px;
        text-shadow: 0 0 15px var(--primary);
    }

    .empty-state p {
        color: rgba(255, 255, 255, 0.7);
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);