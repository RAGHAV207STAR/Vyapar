const CACHE_NAME = 'smart-vyapar-cache-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/og-image.png'
];

// Import Firebase Messaging service worker to unify PWA and Push Notifications
importScripts('/firebase-messaging-sw.js');

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Smart Vyapar Pre-caching critical assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Smart Vyapar clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass rules: Only handle GET requests, skip non-http(s) protocols
  if (event.request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // 2. Bypass dynamic/database/real-time and service API queries (Firebase, Firestore, Auth, etc.)
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firebaseapp.com') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('__aistudio_') ||
    url.pathname.includes('/sockjs-node') ||
    url.pathname.includes('hot-update')
  ) {
    // Direct network only
    return;
  }

  // 3. Network-First caching strategy for instant updates
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch((err) => {
        console.log('Network request failed for ' + url.pathname + '; using cached asset if available.');
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback when both cache and network fail
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
