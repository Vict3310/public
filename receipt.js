// Receipt Module

// Configuration
const YOUR_WHATSAPP_NUMBER = "2348000000000"; // Replace with your number

document.addEventListener('DOMContentLoaded', () => {
    const receiptData = JSON.parse(sessionStorage.getItem('receiptData'));

    if (!receiptData) {
        showNotification('No receipt data found. Redirecting to sales...', 'error');
        setTimeout(() => {
            window.location.href = 'sales.html';
        }, 2000);
        return;
    }

    renderReceipt(receiptData);
    setupButtons(receiptData);
});

// Load Shop Settings for Receipt
const settings = JSON.parse(localStorage.getItem('shopSettings')) || {};
if (settings.shopName) {
    // Inject shop name into header if element exists, or create it
    const header = document.querySelector('.receipt-header h1');
    if (header) header.textContent = settings.shopName;
    
    const address = document.querySelector('.receipt-header p');
    if (address && settings.address) address.textContent = settings.address;
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
}

function setupButtons(data) {
    // Print
    document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
    });

    // WhatsApp
    document.getElementById('whatsappBtn').addEventListener('click', () => {
        const message = generateWhatsAppMessage(data);
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
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