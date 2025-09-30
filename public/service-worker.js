const CACHE_NAME = "mauria-cache-v1";
const urlsToCache = [
    "/", // page d'accueil
    "/index.html",
    "/offline.html", // page de fallback hors ligne (à créer dans public)
];

// Installation : cache statique minimal
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
    self.skipWaiting(); // activation immédiate
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            )
        )
    );
    self.clients.claim(); // prendre le contrôle immédiatement
});

// Gestion des requêtes réseau : cache dynamique avec mise à jour
self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Ne pas gérer les requêtes non-GET (ex : POST)
    if (request.method !== "GET") {
        return;
    }

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request)
                .then((networkResponse) => {
                    // Mise en cache dynamique du contenu obtenu
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => {
                    // En cas d'échec réseau, renvoie la réponse en cache si existante
                    return cachedResponse || caches.match("/offline.html");
                });

            // Priorité au cache si disponible, sinon on attend fetch
            return cachedResponse || fetchPromise;
        })
    );
});
