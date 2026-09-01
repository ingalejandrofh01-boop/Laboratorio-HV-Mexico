// Service worker de Laboratorio HV México
// Habilita la instalación como app y un caché básico para que el sitio
// cargue más rápido y funcione si la conexión falla momentáneamente.

const CACHE_NAME = 'labhv-cache-v73';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/favicon.ico',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/img/logo.png',
  './assets/img/intro-lab-hero.jpg',
  './assets/img/sello-ricardo.png',
  './assets/img/sello-andres.png',
  './assets/img/mx-flag.jpg',
  './assets/img/wm-1.jpg',
  './assets/img/wm-2.jpg',
  './assets/img/wm-3.jpg',
  './assets/img/showcase-piece.jpg',
  './assets/img/pd-zoom-01.jpg',
  './assets/img/pd-zoom-02.jpg',
  './assets/img/pd-zoom-03.jpg',
  './assets/img/pd-zoom-04.jpg',
  './assets/img/pd-zoom-05.jpg',
  './assets/img/pd-zoom-06.jpg',
  './assets/img/pd-zoom-07.jpg',
  './assets/img/pres-thumb-01.jpg',
  './assets/img/pres-thumb-02.jpg',
  './assets/img/pres-thumb-03.jpg',
  './assets/img/pres-thumb-04.jpg',
  './assets/img/pres-thumb-05.jpg',
  './assets/img/pres-thumb-06.jpg',
  './assets/img/pres-thumb-07.jpg',
  './assets/img/pres-thumb-08.jpg',
  './assets/img/pres-thumb-09.jpg',
  './assets/img/pres-thumb-10.jpg',
  './assets/img/pres-thumb-11.jpg',
  './assets/img/pres-thumb-12.jpg',
  './assets/img/pres-thumb-13.jpg',
  './assets/img/pres-thumb-14.jpg',
  './assets/img/pres-thumb-15.jpg',
  './assets/img/pres-thumb-16.jpg',
  './assets/img/pres-thumb-17.jpg',
  './assets/img/pres-thumb-18.jpg',
  './assets/img/pres-thumb-19.jpg'
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
