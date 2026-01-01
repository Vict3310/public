const CACHE_NAME = 'inventory-app-v3';
const ASSETS = [
    './',
    './index.html',
    './dashboard.html',
    './inventory.html',
    './sales.html',
    './receipt.html',
    './styles.css',
    './firebase.js',
    './auth.js',
    './dashboard.js',
    './inventory.js',
    './sales.js',
    './receipt.js',
    'https://cdn.jsdelivr.net/npm/apexcharts',
    'https://unpkg.com/html5-qrcode',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    if (event.request.url.includes('firestore.googleapis.com')) return;
    
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});