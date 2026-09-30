// Pioneer RP Live Service Worker
const CACHE_NAME = 'pioneer-live-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  // Let /api calls go directly to network
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => caches.match('/'));
    })
  );
});

// Push notification listener
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🚨 Pioneer RP Streamer Live!';
  const options = {
    body: data.body || 'A Pioneer RP creator just went live in Los Santos.',
    icon: data.icon || 'https://avatar.vercel.sh/pioneer-rp.png',
    badge: 'https://avatar.vercel.sh/pioneer-rp-badge.png',
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
