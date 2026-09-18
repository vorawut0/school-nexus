// School Nexus - Advanced Multi-Tier Service Worker Cache Strategy
// Supports full offline accessibility, instant app shell loading, and resilient cached data display.

const CACHE_PREFIX = 'school-nexus';
const VERSION = 'v2.2';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${VERSION}`;
const EXTERNAL_CACHE = `${CACHE_PREFIX}-external-${VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-${VERSION}`;
const DATA_CACHE = `${CACHE_PREFIX}-data-${VERSION}`;

const CURRENT_CACHES = [
  STATIC_CACHE,
  RUNTIME_CACHE,
  EXTERNAL_CACHE,
  IMAGE_CACHE,
  DATA_CACHE,
];

// Core App Shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg'
];

// Offline fallback image SVG (embedded data URI / response)
const OFFLINE_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="#f1f3ff"><rect width="200" height="200" rx="16" fill="#f1f3ff"/><path d="M70 120 L95 90 L115 110 L130 95 L150 120 Z" fill="#c7d2fe"/><circle cx="85" cy="75" r="10" fill="#93c5fd"/><text x="100" y="150" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">รูปภาพออฟไลน์</text></svg>`;

// Cache size limits to prevent storage overflow
const MAX_IMAGE_ITEMS = 60;
const MAX_DATA_ITEMS = 50;

async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      trimCache(cacheName, maxItems);
    }
  } catch (err) {
    // Ignore trim errors
  }
}

// 1. INSTALL EVENT - Pre-cache critical application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Pre-cache non-fatal warning:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE EVENT - Clean up legacy/outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.includes(name))
            .map((name) => {
              console.log('[SW] Deleting outdated cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. FETCH EVENT - Intelligent multi-tier caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip Firestore and Google Auth live communication channels
  if (
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('identitytoolkit.googleapis.com') ||
    url.origin.includes('securetoken.googleapis.com') ||
    url.pathname.includes('/google.firestore.v1.')
  ) {
    return;
  }

  // Strategy A: Navigation requests (HTML page / SPA routing)
  // Network First falling back to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // If network is offline, return cached index.html
          const cachedResponse = await caches.match('/index.html');
          if (cachedResponse) return cachedResponse;
          return caches.match('/');
        })
    );
    return;
  }

  // Strategy B: External Fonts and Icon CDNs (Google Fonts, gstatic, Material Symbols)
  // Cache First with background network refresh
  if (
    url.origin.includes('fonts.googleapis.com') ||
    url.origin.includes('fonts.gstatic.com') ||
    url.origin.includes('cdn.jsdelivr.net')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(EXTERNAL_CACHE).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            const responseClone = networkResponse.clone();
            caches.open(EXTERNAL_CACHE).then((cache) => cache.put(request, responseClone));
            return networkResponse;
          })
          .catch(() => cachedResponse);
      })
    );
    return;
  }

  // Strategy C: Images and Media (PNG, JPG, JPEG, SVG, WebP, GIF, Unsplash, Pexels)
  // Cache First with offline SVG fallback
  const isImage =
    request.destination === 'image' ||
    /\.(png|jpg|jpeg|svg|webp|gif|ico)(\?.*)?$/i.test(url.pathname) ||
    url.origin.includes('images.unsplash.com') ||
    url.origin.includes('images.pexels.com');

  if (isImage) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Background update
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(IMAGE_CACHE).then((cache) => {
                  cache.put(request, networkResponse);
                  trimCache(IMAGE_CACHE, MAX_IMAGE_ITEMS);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(IMAGE_CACHE).then((cache) => {
                cache.put(request, responseClone);
                trimCache(IMAGE_CACHE, MAX_IMAGE_ITEMS);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Return offline SVG image fallback
            return new Response(OFFLINE_IMAGE_SVG, {
              headers: { 'Content-Type': 'image/svg+xml' }
            });
          });
      })
    );
    return;
  }

  // Strategy D: App JavaScript, CSS, Modules, and Static Assets (/assets/*, .js, .css, .woff2)
  // Stale-While-Revalidate: Instant load from cache + seamless background update
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/src/') ||
    /\.(js|css|woff2|woff|ttf|json)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed, return cached response if present
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy E: Generic Network First with Data Cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(DATA_CACHE).then((cache) => {
            cache.put(request, responseClone);
            trimCache(DATA_CACHE, MAX_DATA_ITEMS);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        // If it was a navigation request fallback to index.html
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return null;
      })
  );
});

// 4. MESSAGE EVENT - Handle communication from App UI
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_DATA') {
    const { url, payload } = event.data;
    if (url && payload) {
      const response = new Response(JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' }
      });
      caches.open(DATA_CACHE).then((cache) => cache.put(url, response));
    }
  }

  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
});

// 5. PUSH NOTIFICATIONS
self.addEventListener('push', (event) => {
  const data = event.data
    ? event.data.json()
    : { title: 'School Nexus', body: 'มีการแจ้งเตือนใหม่จากโรงเรียน' };
  const options = {
    body: data.body,
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
