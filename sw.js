// sw.js — cache hors-ligne pour Studio IA.
// N'a d'effet que si studio-ia.html et sw.js sont servis depuis un vrai serveur
// (http:// ou https://). Ignoré si le fichier est ouvert en local (file://).

const CACHE_NAME = 'studio-ia-v1';
const ASSETS = ['./studio-ia.html', './'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Ne met en cache que les requêtes same-origin. Les appels à l'API Anthropic
  // (api.anthropic.com) et aux CDN (marked, DOMPurify, highlight.js) partent
  // toujours sur le réseau normalement — pas de cache/replay de la clé API.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
