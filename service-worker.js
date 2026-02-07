const CACHE_NAME = "control-horas-v1";

const URLS_TO_CACHE = [
    "/control-horas/",
    "/control-horas/index.html",
    "/control-horas/style.css",
    "/control-horas/app.js",
    "/control-horas/manifest.json",
    "/control-horas/icon-192.png",
    "/control-horas/icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(URLS_TO_CACHE);
        })
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            );
        })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
