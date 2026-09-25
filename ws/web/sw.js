// Offline cache for the web/PWA build (the Android app bundles its files and never registers this).
// Strategy: network-first, cache fallback — a fresh deploy is always picked up on the next load,
// while the game still opens offline from the last good copy.
const CACHE = 'wordsurge-shell-v3';
const ASSETS = [
  './', './index.html', './styles.css', './beach-overrides.css', './engagement.css', './manifest.webmanifest',
  './js/app.js', './js/data.js', './js/dictionary.js', './js/game.js', './js/layout.js', './js/services.js', './js/state.js',
  './assets/icon-192.png', './assets/icon-512.png', './assets/surge-wave.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
