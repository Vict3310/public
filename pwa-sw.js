const CACHE_NAME = 'inventory-pro-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/inventory.html',
  '/sales.html',
  '/customers.html',
  '/analytics.html',
  '/receipt.html',
  '/modern.css',
  '/mobile-responsive.css',
  '/notifications.js',
  '/mobile-nav.js',
  '/auth.js',
  '/dashboard-simple.js',
  '/inventory.js',
  '/sales.js',
  '/customers.js',
  '/analytics.js',
  '/receipt.js',
  '/firebase.js',
  '/barcode-scanner.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});