/**
 * SheCare AI / SurvivorCare AI - Offline-First Service Worker
 * Ensures full caching and offline operation without network connectivity.
 * Implements safe MIME fallbacks for static hosting (GitHub Pages).
 */
const CACHE_NAME = 'shecare-v2.1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/db.js',
  './js/auth.js',
  './js/mental_health.js',
  './js/physical_health.js',
  './js/period_tracker.js',
  './js/pregnancy_sti.js',
  './js/sos.js',
  './js/safety_plan.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Precache static assets gracefully without aborting if an asset is not found
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[Service Worker] Optional precache skipped for:', asset);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Evicting legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // 1. Pass API requests through or provide clean offline JSON response
  if (url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(JSON.stringify({
          error: 'Offline / Static Hosting Mode: Backend server is not running on this domain.',
          offline: true
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      })
    );
    return;
  }

  // 2. Cache-first strategy for UI assets
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Cache valid response clone
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // ONLY fallback to index.html for page navigation, NEVER for CSS or JS!
        const accept = e.request.headers.get('accept') || '';
        if (e.request.mode === 'navigate' || accept.includes('text/html')) {
          return caches.match('./index.html') || caches.match('./');
        }
        // Return 404 response instead of breaking MIME types
        return new Response('Asset unavailable offline', { status: 404, statusText: 'Not Found' });
      });
    })
  );
});
