// Firebase Configuration - Compatible with v8 SDK
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

// Initialize Firebase only if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth();

// Export for use in other files
window.db = db;
window.auth = auth;

