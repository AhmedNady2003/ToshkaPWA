const CACHE = 'toshka-v1';
const ASSETS = ['/', '/index.html', '/css/style.css', '/js/app.js', '/js/api.js', '/js/i18n.js'];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));

self.addEventListener('activate', e =>
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));

self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return; // لا نخزّن API calls
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
