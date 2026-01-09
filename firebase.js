// Firebase Configuration
// ⚠️ IMPORTANT: Replace this object with YOUR OWN config from Firebase Console!
// Go to Project Settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
    apiKey: "AIzaSyBHKSldnC_Y7iMi8TYrYua6s6V-vtWSEl8",
    authDomain: "inventoryapp-dc025.firebaseapp.com",
    databaseURL: "https://inventoryapp-dc025-default-rtdb.firebaseio.com",
    projectId: "inventoryapp-dc025",
    storageBucket: "inventoryapp-dc025.firebasestorage.app",
    messagingSenderId: "818396573664",
    appId: "1:818396573664:web:39d45df51883a7ae450585",
    measurementId: "G-WKVRZTQCCW"
};

// Initialize Firebase
console.log("Initializing Firebase...");
firebase.initializeApp(firebaseConfig);
console.log("Firebase initialized successfully");

// Enable Offline Persistence
firebase.firestore().enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            console.warn('Persistence not supported by browser');
        }
    });

// Expose services globally
const auth = firebase.auth();
const db = firebase.firestore();

// Initialize storage safely (prevents crash if SDK is missing)
let storage = null;
try {
    storage = firebase.storage();
} catch (e) {
    console.warn("Firebase Storage SDK not loaded - Image upload will not work");
}

// Ensure globals are available to other scripts
window.auth = auth;
window.db = db;
window.storage = storage;

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
    // FIX: Force unregister to clear old cache and show new button
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister();
            console.log("♻️ Old Service Worker deleted to force update.");
        }
    });
}

// --- Global Notification System ---

// 1. Inject Styles
const notifStyle = document.createElement('style');
notifStyle.textContent = `
    #notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
    }
    .notification-toast {
        min-width: 280px;
        padding: 16px 20px;
        border-radius: 8px;
        color: white;
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(120%);
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        display: flex;
        align-items: center;
        pointer-events: auto;
    }
    .notification-toast.show { transform: translateX(0); }
    .notification-success { background: linear-gradient(135deg, #00b09b, #96c93d); }
    .notification-error { background: linear-gradient(135deg, #ff5f6d, #ffc371); }
    .notification-info { background: linear-gradient(135deg, #3a7bd5, #3a6073); }
`;
document.head.appendChild(notifStyle);

// 2. Create Container
const notifContainer = document.createElement('div');
notifContainer.id = 'notification-container';
document.body.appendChild(notifContainer);

// 3. Show Function
window.showNotification = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.textContent = message;
    notifContainer.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add('show'));

    // Animate out and remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};