const CACHE_NAME = 'cybertwin-cache-v3';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

function isNavigationRequest(request) {
  return request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'));
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // App shell / navigation: try network first, fall back to cache, then offline page
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
      // cache runtime assets for same-origin
      if (event.request.url.startsWith(self.location.origin)) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
      }
      return res;
    }).catch(() => {
      // fallback for images
      if (event.request.destination === 'image') {
        return new Response('', { status: 503 });
      }
      return caches.match('/index.html');
    }))
  );
});

// Handle push messages
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data.json(); } catch (e) { data = { title: 'CyberTwin', body: event.data ? event.data.text() : 'You have a new notification' }; }
  const title = data.title || 'CyberTwin';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-32.png',
    data: data.url || '/',
    vibrate: [100, 50, 100]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window' }).then(clientList => {
    for (const client of clientList) {
      if ('focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(event.notification.data || '/');
  }));
});
