// Simple test to verify all components are working
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧪 Running system tests...');
    
    // Test 1: Check if Firebase is loaded
    if (typeof firebase !== 'undefined') {
        console.log('✅ Firebase loaded successfully');
    } else {
        console.error('❌ Firebase not loaded');
    }
    
    // Test 2: Check if CSS is loaded
    const testElement = document.createElement('div');
    testElement.className = 'btn btn-primary';
    document.body.appendChild(testElement);
    const styles = window.getComputedStyle(testElement);
    if (styles.backgroundColor) {
        console.log('✅ CSS loaded successfully');
    } else {
        console.error('❌ CSS not loaded properly');
    }
    document.body.removeChild(testElement);
    
    // Test 3: Check if notification system works
    if (typeof showSuccess === 'function') {
        console.log('✅ Notification system loaded');
    } else {
        console.error('❌ Notification system not loaded');
    }
    
    // Test 4: Check if mobile nav works
    if (typeof MobileNav === 'function') {
        console.log('✅ Mobile navigation loaded');
    } else {
        console.error('❌ Mobile navigation not loaded');
    }
    
    console.log('🧪 System tests completed');
});

// Export for manual testing
window.runTests = () => {
    console.log('Running manual tests...');
    
    // Test notifications
    if (typeof showSuccess === 'function') {
        showSuccess('Test notification - Success!');
        setTimeout(() => showError('Test notification - Error!'), 1000);
        setTimeout(() => showWarning('Test notification - Warning!'), 2000);
        setTimeout(() => showInfo('Test notification - Info!'), 3000);
    }
    
    console.log('Manual tests completed');
};