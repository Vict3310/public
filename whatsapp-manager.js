// WhatsApp Business Integration
class WhatsAppManager {
    constructor() {
        this.currentUser = null;
        this.businessPhone = '';
        this.init();
    }

    init() {
        firebase.auth().onAuthStateChanged(async user => {
            if (user) {
                this.currentUser = user;
                await this.loadBusinessSettings();
            }
        });
    }

    async loadBusinessSettings() {
        try {
            const doc = await db.collection('users').doc(this.currentUser.uid).get();
            const data = doc.data();
            this.businessPhone = data?.phone || '';
        } catch (error) {
            console.error('Error loading business settings:', error);
        }
    }

    async sendReceiptToCustomer(receiptData, customerPhone) {
        try {
            if (!customerPhone) {
                showNotification('Customer phone number required', 'warning');
                return;
            }

            const message = this.generateReceiptMessage(receiptData);
            const whatsappUrl = `https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
            
            window.open(whatsappUrl, '_blank');
            showNotification('WhatsApp opened with receipt message', 'success');
            
            // Log the communication
            await this.logWhatsAppActivity('receipt', customerPhone, receiptData.transactionId);
            
        } catch (error) {
            console.error('Error sending WhatsApp receipt:', error);
            showNotification('Failed to send WhatsApp receipt', 'error');
        }
    }

    generateReceiptMessage(data) {
        const items = data.items || [];
        const itemsList = items.map(item => 
            `• ${item.name} x${item.qty} - ₦${item.total.toLocaleString()}`
        ).join('\n');

        return `🧾 *RECEIPT - INVENTORY PRO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Order ID: ${data.transactionId}
📅 Date: ${new Date(data.date).toLocaleDateString()}

🛍️ *ITEMS:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL: ₦${data.total.toLocaleString()}*
${data.discount > 0 ? `💸 Discount: ₦${data.discount.toLocaleString()}` : ''}

Thank you for your business! 🙏
Visit us again soon! 😊`;
    }

    async sendLowStockAlert(lowStockProducts) {
        try {
            if (!this.businessPhone || lowStockProducts.length === 0) return;

            const productList = lowStockProducts.map(product => 
                `• ${product.name} - Only ${product.quantity} left`
            ).join('\n');

            const message = `🚨 *LOW STOCK ALERT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The following products are running low:

${productList}

⚠️ Consider restocking soon to avoid stockouts.

📱 Inventory Pro Alert System`;

            const whatsappUrl = `https://wa.me/${this.businessPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
            
            // Auto-open for business owner
            if (confirm('Low stock detected! Send WhatsApp alert to yourself?')) {
                window.open(whatsappUrl, '_blank');
                await this.logWhatsAppActivity('low_stock_alert', this.businessPhone, lowStockProducts.length);
            }
            
        } catch (error) {
            console.error('Error sending low stock alert:', error);
        }
    }

    async sendCustomerFollowUp(customer, lastPurchaseDate) {
        try {
            if (!customer.phone) return;

            const daysSinceLastPurchase = Math.floor((new Date() - new Date(lastPurchaseDate)) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastPurchase < 7) return; // Don't spam recent customers

            const message = `👋 Hi ${customer.name}!

We hope you're enjoying your recent purchase from us! 

🛍️ We have new products and special offers available. 

Would you like to check out what's new?

Thank you for being a valued customer! 🙏

*Inventory Pro - Your Business Partner*`;

            const whatsappUrl = `https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
            
            if (confirm(`Send follow-up message to ${customer.name}?`)) {
                window.open(whatsappUrl, '_blank');
                await this.logWhatsAppActivity('follow_up', customer.phone, customer.id);
                showNotification('Follow-up message sent via WhatsApp', 'success');
            }
            
        } catch (error) {
            console.error('Error sending customer follow-up:', error);
        }
    }

    async sendPromotionalMessage(customers, promotionText) {
        try {
            if (!customers.length || !promotionText) return;

            const message = `🎉 *SPECIAL PROMOTION*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${promotionText}

🛍️ Visit us today to take advantage of this offer!

*Limited time only!* ⏰

Thank you for being a valued customer! 🙏

*Inventory Pro*`;

            let sentCount = 0;
            
            for (const customer of customers) {
                if (customer.phone && confirm(`Send promotion to ${customer.name}?`)) {
                    const whatsappUrl = `https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                    sentCount++;
                    
                    // Small delay to prevent overwhelming
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            if (sentCount > 0) {
                await this.logWhatsAppActivity('promotion', 'bulk', sentCount);
                showNotification(`Promotion sent to ${sentCount} customers`, 'success');
            }
            
        } catch (error) {
            console.error('Error sending promotional messages:', error);
            showNotification('Failed to send promotional messages', 'error');
        }
    }

    async logWhatsAppActivity(type, recipient, metadata) {
        try {
            await db.collection('users').doc(this.currentUser.uid)
                .collection('whatsapp_logs').add({
                    type: type,
                    recipient: recipient,
                    metadata: metadata,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
        } catch (error) {
            console.error('Error logging WhatsApp activity:', error);
        }
    }

    async getWhatsAppStats() {
        try {
            const snapshot = await db.collection('users').doc(this.currentUser.uid)
                .collection('whatsapp_logs')
                .where('timestamp', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                .get();

            const stats = {
                totalSent: snapshot.size,
                receipts: 0,
                alerts: 0,
                followUps: 0,
                promotions: 0
            };

            snapshot.forEach(doc => {
                const data = doc.data();
                switch (data.type) {
                    case 'receipt': stats.receipts++; break;
                    case 'low_stock_alert': stats.alerts++; break;
                    case 'follow_up': stats.followUps++; break;
                    case 'promotion': stats.promotions++; break;
                }
            });

            return stats;
        } catch (error) {
            console.error('Error getting WhatsApp stats:', error);
            return { totalSent: 0, receipts: 0, alerts: 0, followUps: 0, promotions: 0 };
        }
    }
}

window.whatsappManager = new WhatsAppManager();