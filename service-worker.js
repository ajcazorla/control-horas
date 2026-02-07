self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open("control-horas-cache").then((cache) => {
            return cache.addAll([
    "/control-horas/index.html",
    "/control-horas/style.css",
    "/control-horas/app.js",
    "/control-horas/manifest.json",
    "/control-horas/icon-192.png",
    "/control-horas/icon-512.png"
])
        })
    );
});

self.addEventListener("fetch", (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
