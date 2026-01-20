// Receipt Module
let currentUser = null;
let settings = {};

document.addEventListener('DOMContentLoaded', () => {
    const receiptData = JSON.parse(sessionStorage.getItem('receiptData'));

    if (receiptData) {
        renderReceipt(receiptData);
        setupButtons(receiptData);
    } else {
        loadRecentSales();
    }
});

// Auth state listener
auth.onAuthStateChanged(async user => {
    if (user) {
        currentUser = user;
        await loadSettings();
        
        // Check if we have receipt data, if not load recent sales
        const receiptData = JSON.parse(sessionStorage.getItem('receiptData'));
        if (!receiptData) {
            loadRecentSales();
        }
    }
});

async function loadSettings() {
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            settings = doc.data();
            applySettings();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function applySettings() {
    if (settings.shopName) {
        const header = document.querySelector('.receipt-header h1');
        if (header) header.textContent = settings.shopName;
    }
    
    const headerDiv = document.querySelector('.receipt-header');
    if (headerDiv) {
        // Update Address
        if (settings.address) {
            let addrEl = headerDiv.querySelector('p.address');
            if (!addrEl) {
                // Try to find existing generic p tag
                const genericP = headerDiv.querySelector('p:not(.phone)');
                if (genericP) {
                    addrEl = genericP;
                    addrEl.classList.add('address');
                } else {
                    addrEl = document.createElement('p');
                    addrEl.className = 'address';
                    headerDiv.appendChild(addrEl);
                }
            }
            addrEl.textContent = settings.address;
        }

        // Update Phone
        if (settings.phone) {
            let phoneEl = headerDiv.querySelector('p.phone');
            if (!phoneEl) {
                phoneEl = document.createElement('p');
                phoneEl.className = 'phone';
                headerDiv.appendChild(phoneEl);
            }
            phoneEl.textContent = settings.phone;
        }
    }
}

function renderReceipt(data) {
    // Use transaction ID or generate one
    const orderId = data.transactionId || 'ORD-' + Math.floor(Math.random() * 100000);
    
    document.getElementById('orderId').textContent = orderId;
    document.getElementById('date').textContent = new Date(data.date).toLocaleString();
    document.getElementById('totalAmount').textContent = data.total.toLocaleString();

    const tbody = document.getElementById('receiptItems');
    tbody.innerHTML = ''; // Clear existing

    // Handle both old single-item format and new cart format
    const items = data.items || [{
        name: data.productName,
        qty: data.quantity,
        price: data.sellingPrice,
        total: data.revenue
    }];

    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>₦${item.price.toLocaleString()}</td>
            <td>₦${item.total.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });

    // Add Discount Row if applicable
    if (data.discount > 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="3" style="text-align:right; font-weight:bold;">Discount:</td>
            <td>-₦${data.discount.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    }

    // Add Payment Method
    if (data.paymentMethod) {
        const p = document.createElement('p');
        p.style.textAlign = 'center';
        p.style.marginTop = '10px';
        p.innerHTML = `Payment Method: <strong>${data.paymentMethod}</strong>`;
        document.querySelector('.receipt-body').appendChild(p);
    }

    // Add Customer Name
    if (data.customer) {
        const c = document.createElement('p');
        c.style.textAlign = 'center';
        c.innerHTML = `Customer: ${data.customer}`;
        document.querySelector('.receipt-body').appendChild(c);
    }

    // Add Customer Phone
    if (data.customerPhone) {
        const p = document.createElement('p');
        p.style.textAlign = 'center';
        p.innerHTML = `Phone: ${data.customerPhone}`;
        document.querySelector('.receipt-body').appendChild(p);
    }
}

function setupButtons(data) {
    document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
    });

    document.getElementById('whatsappBtn').addEventListener('click', () => {
        const message = generateWhatsAppMessage(data);
        let url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        
        if (data.customerPhone) {
            const cleanPhone = data.customerPhone.replace(/[^0-9]/g, '');
            url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        }
        window.open(url, '_blank');
    });
}

async function loadRecentSales() {
    try {
        if (!currentUser) return;

        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('sales')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        const sales = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderSalesList(sales);
    } catch (error) {
        console.error('Error loading sales:', error);
        showNotification('Error loading sales: ' + error.message, 'error');
    }
}

function renderSalesList(sales) {
    const container = document.getElementById('salesList');
    
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
        <div class="sale-item" onclick="generateReceiptFromSale('${sale.id}')" style="padding: var(--space-4); border: 1px solid var(--gray-200); border-radius: var(--border-radius); margin-bottom: var(--space-3); cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 600;">${sale.customerName || 'Walk-in Customer'}</div>
                    <div style="color: var(--gray-600); font-size: 0.875rem;">
                        ${sale.items?.length || 0} item(s) • ₦${(sale.subtotal || 0).toLocaleString()}
                    </div>
                </div>
                <div style="color: var(--primary); font-size: 0.75rem;">
                    ${sale.createdAt ? new Date(sale.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                </div>
            </div>
        </div>
    `).join('');
}

function generateReceiptFromSale(saleId) {
    // Find the sale and generate receipt
    db.collection('users').doc(currentUser.uid)
        .collection('sales').doc(saleId).get()
        .then(doc => {
            if (doc.exists) {
                const sale = doc.data();
                const receiptData = {
                    transactionId: saleId,
                    date: sale.createdAt ? sale.createdAt.toDate() : new Date(),
                    customer: sale.customerName || 'Walk-in Customer',
                    customerPhone: sale.customerPhone || '',
                    items: sale.items || [],
                    subtotal: sale.subtotal || 0,
                    discount: 0,
                    total: sale.subtotal || 0,
                    paymentMethod: 'Cash'
                };
                
                renderReceipt(receiptData);
                setupButtons(receiptData);
            }
        })
        .catch(error => {
            console.error('Error loading sale:', error);
            showNotification('Error loading sale details', 'error');
        });
}

function generateWhatsAppMessage(data) {
    const items = data.items || [{
        name: data.productName,
        qty: data.quantity,
        price: data.sellingPrice
    }];

    let itemsList = items.map(i => `- ${i.name} x${i.qty} (₦${i.price})`).join('%0A');

    return `*RECEIPT - ${settings.shopName || 'INVENTORY APP'}*
------------------------
${itemsList}
------------------------
Subtotal: ₦${(data.subtotal || data.revenue).toLocaleString()}
Discount: ₦${(data.discount || 0).toLocaleString()}
*TOTAL: ₦${(data.total || data.revenue).toLocaleString()}*
Date: ${new Date(data.date).toLocaleDateString()}

Thank you for your patronage!`;
}