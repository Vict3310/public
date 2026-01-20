class CustomerManager {
    constructor() {
        this.customers = [];
        this.currentUser = null;
        this.init();
    }

    async init() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadCustomers();
                this.setupEventListeners();
                this.updateStats();
            }
        });
    }

    setupEventListeners() {
        document.getElementById('searchCustomers').addEventListener('input', (e) => {
            this.filterCustomers(e.target.value);
        });

        document.getElementById('addCustomerBtn').addEventListener('click', () => {
            this.showCustomerModal();
        });

        document.getElementById('closeCustomerModal').addEventListener('click', () => {
            this.hideCustomerModal();
        });

        document.getElementById('cancelCustomerBtn').addEventListener('click', () => {
            this.hideCustomerModal();
        });

        document.getElementById('customerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomer();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            });
        });
    }

    async loadCustomers() {
        try {
            if (!this.currentUser) return;

            const snapshot = await firebase.firestore()
                .collection('users').doc(this.currentUser.uid)
                .collection('customers')
                .orderBy('name')
                .get();

            this.customers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderCustomers();
        } catch (error) {
            console.error('Error loading customers:', error);
            showNotification('Error loading customers: ' + error.message, 'error');
        }
    }

    renderCustomers(customersToRender = this.customers) {
        const container = document.getElementById('customersList');
        
        if (customersToRender.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: var(--space-8); color: var(--gray-500);">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: var(--space-4);"></i>
                    <p>No customers found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = customersToRender.map(customer => `
            <div class="customer-card" style="display: flex; align-items: center; padding: var(--space-4); border: 1px solid var(--gray-200); border-radius: var(--border-radius); margin-bottom: var(--space-3);">
                <div class="customer-avatar" style="width: 50px; height: 50px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: var(--space-4);">
                    ${customer.name.charAt(0).toUpperCase()}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 1.1rem;">${customer.name}</div>
                    <div style="color: var(--gray-600); font-size: 0.875rem;">
                        <i class="fas fa-phone"></i> ${customer.phone}
                        ${customer.email ? `• <i class="fas fa-envelope"></i> ${customer.email}` : ''}
                    </div>
                    <div style="color: var(--gray-500); font-size: 0.75rem; margin-top: 4px;">
                        Purchases: ${customer.totalPurchases || 0} • Points: ${customer.loyaltyPoints || 0}
                        ${customer.creditBalance > 0 ? `• Credit: ₦${customer.creditBalance.toLocaleString()}` : ''}
                    </div>
                </div>
                <div style="display: flex; gap: var(--space-2);">
                    <button class="btn btn-secondary btn-sm" onclick="customerManager.editCustomer('${customer.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-success btn-sm" onclick="customerManager.viewPurchases('${customer.id}')">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn btn-error btn-sm" onclick="customerManager.deleteCustomer('${customer.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterCustomers(searchTerm) {
        const filtered = this.customers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        this.renderCustomers(filtered);
    }

    showCustomerModal(customer = null) {
        const modal = document.getElementById('customerModal');
        const title = document.getElementById('customerModalTitle');
        const form = document.getElementById('customerForm');
        
        if (customer) {
            title.textContent = 'Edit Customer';
            this.populateCustomerForm(customer);
        } else {
            title.textContent = 'Add New Customer';
            form.reset();
        }
        
        modal.classList.remove('hidden');
    }

    hideCustomerModal() {
        document.getElementById('customerModal').classList.add('hidden');
    }

    populateCustomerForm(customer) {
        document.getElementById('editCustomerId').value = customer.id;
        document.getElementById('customerName').value = customer.name;
        document.getElementById('customerPhone').value = customer.phone;
        document.getElementById('customerEmail').value = customer.email || '';
        document.getElementById('customerAddress').value = customer.address || '';
        document.getElementById('creditLimit').value = customer.creditLimit || 0;
        document.getElementById('loyaltyPoints').value = customer.loyaltyPoints || 0;
    }

    async saveCustomer() {
        try {
            const formData = this.getCustomerFormData();
            
            if (!this.currentUser) throw new Error('User not authenticated');
            
            formData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            
            const customerId = document.getElementById('editCustomerId').value;
            
            if (customerId) {
                await firebase.firestore()
                    .collection('users').doc(this.currentUser.uid)
                    .collection('customers')
                    .doc(customerId)
                    .update(formData);
                showNotification('Customer updated successfully', 'success');
            } else {
                formData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                formData.totalPurchases = 0;
                formData.creditBalance = 0;
                formData.loyaltyPoints = 0;
                await firebase.firestore()
                    .collection('users').doc(this.currentUser.uid)
                    .collection('customers')
                    .add(formData);
                showNotification('Customer added successfully', 'success');
            }
            
            this.hideCustomerModal();
            await this.loadCustomers();
            this.updateStats();
            
        } catch (error) {
            console.error('Error saving customer:', error);
            showNotification('Failed to save customer: ' + error.message, 'error');
        }
    }

    getCustomerFormData() {
        return {
            name: document.getElementById('customerName').value.trim(),
            phone: document.getElementById('customerPhone').value.trim(),
            email: document.getElementById('customerEmail').value.trim(),
            address: document.getElementById('customerAddress').value.trim(),
            creditLimit: parseFloat(document.getElementById('creditLimit').value) || 0
        };
    }

    async editCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            this.showCustomerModal(customer);
        }
    }

    async deleteCustomer(customerId) {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        
        try {
            await firebase.firestore()
                .collection('users').doc(this.currentUser.uid)
                .collection('customers')
                .doc(customerId)
                .delete();
            
            showNotification('Customer deleted successfully', 'success');
            await this.loadCustomers();
            this.updateStats();
            
        } catch (error) {
            console.error('Error deleting customer:', error);
            showNotification('Failed to delete customer: ' + error.message, 'error');
        }
    }

    viewPurchases(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        showNotification(`Viewing purchase history for ${customer.name}`, 'info');
        // TODO: Implement purchase history view
    }

    updateStats() {
        const totalCustomers = this.customers.length;
        const activeCustomers = this.customers.filter(c => c.totalPurchases > 0).length;
        const totalCredit = this.customers.reduce((sum, c) => sum + (c.creditBalance || 0), 0);
        
        document.getElementById('totalCustomers').textContent = totalCustomers;
        document.getElementById('activeCustomers').textContent = activeCustomers;
        document.getElementById('totalCredit').textContent = `₦${totalCredit.toLocaleString()}`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.customerManager = new CustomerManager();
});