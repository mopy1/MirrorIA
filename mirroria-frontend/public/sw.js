/**
 * Service Worker liviano para MirrorIA PWA.
 * Estrategias:
 * - App Shell / Estáticos: Cache-First con fallback a red.
 * - Navegación SPA: Network-First con fallback a /index.html cacheado.
 * - API GET: Network-First, solo datos públicos y por tienda (ver sw-politica.js).
 * - Mutaciones (POST, PUT, PATCH, DELETE): Red directa (la app gestiona Outbox en IndexedDB).
 */

importScripts('/sw-politica.js');

// v2: la v1 guardaba por URL y mezclaba tiendas y datos privados.
// ignoreVary: el servidor manda Vary: Origin y los scripts de modulo no coincidian con lo guardado.
const CACHE_NAME = 'mirroria-app-shell-v4';
const CACHE_API = 'mirroria-api-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  // Todo el build, no solo el index: si no, una recarga sin red tras la primera
  // visita dejaba la página en blanco (los chunks no estaban guardados).
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(PRECACHE_ASSETS);
        const lista = await fetch('/precache.json').then((r) => (r.ok ? r.json() : []), () => []);
        await Promise.all(lista.map((ruta) => cache.add(ruta).catch(() => {})));
      })
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
            .filter((key) => key !== CACHE_NAME && key !== CACHE_API)
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
        const shell = await cache.match('/index.html', { ignoreVary: true });
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
      caches.match(request, { ignoreVary: true }).then((cachedResponse) => {
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

  // API: lo público de cada tienda se guarda para seguir viéndolo sin red; lo
  // privado va siempre a la red y nunca toca el disco.
  if (url.pathname.startsWith('/api/')) {
    const tienda = self.swPolitica.tiendaDe(request.url, request.headers.get('x-tenant'));
    if (!self.swPolitica.esCacheable(request.url, tienda)) {
      return;
    }
    const clave = self.swPolitica.claveCache(request.url, tienda);
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response && response.status === 200) {
            const cuerpo = await response.clone().arrayBuffer();
            const headers = new Headers(response.headers);
            headers.set('x-sw-guardado-en', String(Date.now()));
            const cache = await caches.open(CACHE_API);
            await cache.put(clave, new Response(cuerpo, { status: 200, headers }));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_API);
          const guardada = await cache.match(clave, { ignoreVary: true });
          const guardadoEn = Number(guardada?.headers.get('x-sw-guardado-en') ?? 0);
          return guardada && self.swPolitica.sigueVigente(guardadoEn, Date.now())
            ? guardada
            : Response.error();
        })
    );
    return;
  }

  // Default: Network con fallback a cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request, { ignoreVary: true }).then((r) => r || Response.error()))
  );
});
