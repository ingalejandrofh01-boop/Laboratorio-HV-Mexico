// Service worker de Laboratorio HV México
// Habilita la instalación como app y un caché básico para que el sitio
// cargue más rápido y funcione si la conexión falla momentáneamente.

const CACHE_NAME = 'labhv-cache-v46';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './logo.png',
  './sello-ricardo.png',
  './sello-andres.png',
  './mx-flag.jpg',
  './wm-1.jpg',
  './wm-2.jpg',
  './wm-3.jpg',
  './showcase-piece.jpg',
  './pd-zoom-01.jpg',
  './pd-zoom-02.jpg',
  './pd-zoom-03.jpg',
  './pd-zoom-04.jpg',
  './pd-zoom-05.jpg',
  './pd-zoom-06.jpg',
  './pd-zoom-07.jpg',
  './pres-thumb-01.jpg',
  './pres-thumb-02.jpg',
  './pres-thumb-03.jpg',
  './pres-thumb-04.jpg',
  './pres-thumb-05.jpg',
  './pres-thumb-06.jpg',
  './pres-thumb-07.jpg',
  './pres-thumb-08.jpg',
  './pres-thumb-09.jpg',
  './pres-thumb-10.jpg',
  './pres-thumb-11.jpg',
  './pres-thumb-12.jpg',
  './pres-thumb-13.jpg',
  './pres-thumb-14.jpg',
  './pres-thumb-15.jpg',
  './pres-thumb-16.jpg',
  './pres-thumb-17.jpg',
  './pres-thumb-18.jpg',
  './pres-thumb-19.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch((err) => console.warn('SW install cache falló:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
