/* PTA Progressive Web App service worker — offline shell + optional FCM */
const CACHE_NAME = 'pta-cache-v4';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never intercept API / auth / cross-origin backend calls
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navigations: network-first, offline to offline page
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL) || caches.match('/'))
        )
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.link) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate?.(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

// Optional Firebase Cloud Messaging (config served by Next route)
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');
  importScripts('/api/firebase-messaging-config');
  if (self.FIREBASE_CONFIG && self.FIREBASE_CONFIG.apiKey) {
    firebase.initializeApp(self.FIREBASE_CONFIG);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const title = (payload.notification && payload.notification.title) || 'PTA Reminder';
      const body = (payload.notification && payload.notification.body) || '';
      self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: payload.data || {},
      });
    });
  }
} catch (e) {
  // FCM optional — PWA still works offline without it
  console.warn('FCM SW optional init skipped', e);
}
