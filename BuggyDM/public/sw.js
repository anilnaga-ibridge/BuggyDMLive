const CACHE_NAME = "buggyops-v1";
const ASSETS = [
  "/BuggyDm/login",
  "/BuggyDm/globals.css",
  "/favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip POST requests or external scripts
  if (request.method !== "GET" || !url.pathname.startsWith("/BuggyDm")) {
    return;
  }

  // Network-First, Cache-Fallback strategy for API / dynamic content
  if (url.pathname.includes("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-First strategy for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Periodic Sync handler for network recovery
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-ops") {
    console.log("[ServiceWorker] Reconnected! Triggering sync background job...");
  }
});
