/**
 * Service Worker liviano para MirrorIA PWA.
 * Estrategias:
 * - App Shell / Estáticos: Cache-First con fallback a red.
 * - Navegación SPA: Network-First con fallback a /index.html cacheado.
 * - API GET: Network-First.
 * - Mutaciones (POST, PUT, PATCH, DELETE): Red directa (la app gestiona Outbox en IndexedDB).
 */

const CACHE_NAME = 'mirroria-app-shell-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo interceptar peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Navegación HTML (SPA App Shell fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const shell = await cache.match('/index.html');
        return shell || Response.error();
      })
    );
    return;
  }

  // Assets estáticos (Vite chunks, imágenes, fuentes, CSS) -> Cache-First
  const esAssetEstatico =
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|woff2|woff|ttf|png|jpg|jpeg|svg|webp|ico)$/i);

  if (esAssetEstatico && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copia = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Rutas de API GET -> Network-First con fallback a cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copia = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Default: Network con fallback a cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
