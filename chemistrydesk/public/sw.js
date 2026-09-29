// ChemistryDesk Offline Service Worker v1.0.0
const CACHE_NAME = 'chemistrydesk-v1';

// Static assets and pages to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/molarity',
  '/dilution',
  '/scherrer',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico'
];

// Install Event: Precaches core analytical tools for offline bench use
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Purges stale caches on update
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First strategy with dynamic network fallback
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore browser extensions or external non-origin calls
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached page immediately for instant offline loading
        return cachedResponse;
      }

      // Fetch over network if not in cache, then cache the result dynamically
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback for document navigation when completely offline
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});