const CACHE_NAME = "quanda-shell-v1";
const APP_SHELL = [
  "/quanda.html",
  "/original.css",
  "/styles.css",
  "/app.js",
  "/manifest.webmanifest",
  "/assets/manrope-vietnamese.woff2",
  "/assets/manrope-original-latin.woff2",
  "/assets/newsreader-vietnamese.woff2",
  "/assets/newsreader-original-latin.woff2",
  "/assets/hero-vector-garden.svg",
  "/assets/calendar-vector-garden.svg",
  "/assets/quanda-icon-192.png",
  "/assets/quanda-icon-512.png",
  "/assets/quanda-icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/quanda.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
      return cached || network;
    })
  );
});
