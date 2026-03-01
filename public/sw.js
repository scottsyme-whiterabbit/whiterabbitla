const CACHE_NAME = 'wr-crm-v1';
const urlsToCache = ['/', '/admin/newsletter'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Never cache OAuth routes
  if (event.request.url.includes('/~oauth')) {
    event.respondWith(fetch(event.request));
    return;
  }
  // Network first for API calls
  if (event.request.url.includes('/functions/') || event.request.url.includes('/rest/')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  // Cache first for static assets
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
