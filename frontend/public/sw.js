const CACHE_NAME = 'rurubene-pwa-cache-v1';
const OFFLINE_URL = '/library';

const ASSETS_TO_CACHE = [
  '/',
  '/library',
  '/discover',
  '/discover/podcasts',
  '/marketplace',
  '/wallet',
  '/settings',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Helper function to match cache with normalization (stripping search params and trailing slashes)
function matchCache(request) {
  return caches.open(CACHE_NAME).then((cache) => {
    // 1. Try matching the request exactly
    return cache.match(request).then((res) => {
      if (res) return res;

      // 2. Normalize URL (remove query parameters and trailing slashes)
      const url = new URL(request.url || request, self.location.href);
      const cleanUrl = url.origin + url.pathname.replace(/\/$/, '');
      
      return cache.match(cleanUrl).then((res2) => {
        if (res2) return res2;
        
        // 3. Fallback to /library or root page
        return cache.match(OFFLINE_URL).then((res3) => {
          if (res3) return res3;
          return cache.match('/');
        });
      });
    });
  });
}

// Install Event - Cache essential shell assets with resilience
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((asset) => {
          return cache.add(asset).catch((err) => {
            console.warn(`[Service Worker] Failed to pre-cache: ${asset}`, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Serve from Cache, Fallback to Network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip media streams, audio/video requests, and media proxy requests
  if (
    url.pathname.includes('/media-proxy') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.m3u8') ||
    url.pathname.endsWith('.ts') ||
    request.headers.get('range')
  ) {
    return;
  }

  // 1. Navigation Requests (Page reloads/routing) - Network First, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, use the normalized cache matching utility
          return matchCache(request);
        })
    );
    return;
  }

  // 2. API Requests - Network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(() => {
          return matchCache(request);
        })
    );
    return;
  }

  // 3. Static Assets (JS, CSS, images, fonts) - Stale-while-revalidate strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
