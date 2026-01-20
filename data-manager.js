// Data Backup & Export System
class DataManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                this.currentUser = user;
            }
        });
    }

    async exportAllData() {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');

            showNotification('Preparing data export...', 'info');

            const data = {
                exportDate: new Date().toISOString(),
                businessInfo: await this.getBusinessInfo(),
                products: await this.getProducts(),
                sales: await this.getSales(),
                customers: await this.getCustomers(),
                expenses: await this.getExpenses()
            };

            this.downloadJSON(data, `inventory-backup-${new Date().toISOString().split('T')[0]}.json`);
            showNotification('Data exported successfully!', 'success');

        } catch (error) {
            console.error('Export error:', error);
            showNotification('Export failed: ' + error.message, 'error');
        }
    }

    async getBusinessInfo() {
        const doc = await db.collection('users').doc(this.currentUser.uid).get();
        return doc.exists ? doc.data() : {};
    }

    async getProducts() {
        const snapshot = await db.collection('users').doc(this.currentUser.uid)
            .collection('products').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getSales() {
        const snapshot = await db.collection('users').doc(this.currentUser.uid)
            .collection('sales').get();
        return snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            date: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
        }));
    }

    async getCustomers() {
        const snapshot = await db.collection('users').doc(this.currentUser.uid)
            .collection('customers').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getExpenses() {
        const snapshot = await db.collection('users').doc(this.currentUser.uid)
            .collection('expenses').get();
        return snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            date: doc.data().date?.toDate()?.toISOString() || new Date().toISOString()
        }));
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    async exportToCSV(type) {
        try {
            let data, headers, filename;

            switch (type) {
                case 'products':
                    data = await this.getProducts();
                    headers = ['Name', 'Brand', 'Category', 'Cost Price', 'Selling Price', 'Quantity', 'Min Stock'];
                    filename = 'products-export.csv';
                    break;
                case 'sales':
                    data = await this.getSales();
                    headers = ['Date', 'Customer', 'Items', 'Revenue', 'Profit'];
                    filename = 'sales-export.csv';
                    break;
                case 'customers':
                    data = await this.getCustomers();
                    headers = ['Name', 'Phone', 'Email', 'Total Purchases', 'Credit Balance'];
                    filename = 'customers-export.csv';
                    break;
            }

            const csvContent = this.convertToCSV(data, headers, type);
            this.downloadCSV(csvContent, filename);
            showNotification(`${type} exported to CSV successfully!`, 'success');

        } catch (error) {
            console.error('CSV export error:', error);
            showNotification('CSV export failed: ' + error.message, 'error');
        }
    }

    convertToCSV(data, headers, type) {
        const csvRows = [headers.join(',')];

        data.forEach(item => {
            let row;
            switch (type) {
                case 'products':
                    row = [
                        item.name || '',
                        item.brand || '',
                        item.category || '',
                        item.costPrice || 0,
                        item.sellingPrice || 0,
                        item.quantity || 0,
                        item.minStock || 0
                    ];
                    break;
                case 'sales':
                    row = [
                        item.date || '',
                        item.customerName || '',
                        item.items?.length || 0,
                        item.revenue || item.subtotal || 0,
                        item.profit || 0
                    ];
                    break;
                case 'customers':
                    row = [
                        item.name || '',
                        item.phone || '',
                        item.email || '',
                        item.totalPurchases || 0,
                        item.creditBalance || 0
                    ];
                    break;
            }
            csvRows.push(row.map(field => `"${field}"`).join(','));
        });

        return csvRows.join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    async importFromJSON(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (confirm('This will import data. Continue?')) {
                await this.processImport(data);
                showNotification('Data imported successfully!', 'success');
            }
        } catch (error) {
            console.error('Import error:', error);
            showNotification('Import failed: ' + error.message, 'error');
        }
    }

    async processImport(data) {
        const batch = db.batch();
        
        // Import products
        if (data.products) {
            data.products.forEach(product => {
                const ref = db.collection('users').doc(this.currentUser.uid)
                    .collection('products').doc();
                batch.set(ref, {
                    ...product,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
        }

        await batch.commit();
    }
}

window.dataManager = new DataManager();