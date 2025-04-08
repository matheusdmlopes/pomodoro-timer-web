// Service Worker for Pomodoro Timer

// Cache version identifier
const CACHE_VERSION = 'pomodoro-v1';

// Files to cache
const FILES_TO_CACHE = [
    './',
    './index.html',
    './offline.html',
    './css/reset.css',
    './css/style.css',
    './js/main.js',
    './js/timer.js',
    './js/settings.js',
    './manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing');

    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => {
                console.log('[ServiceWorker] Caching app shell');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => {
                console.log('[ServiceWorker] Install completed');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating');

    event.waitUntil(
        caches.keys()
            .then((keyList) => {
                return Promise.all(keyList.map((key) => {
                    if (key !== CACHE_VERSION) {
                        console.log('[ServiceWorker] Removing old cache', key);
                        return caches.delete(key);
                    }
                }));
            })
            .then(() => {
                console.log('[ServiceWorker] Activation completed');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    console.log('[ServiceWorker] Fetch', event.request.url);

    // Handle Google Analytics separately
    if (event.request.url.includes('google-analytics.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    console.log('[ServiceWorker] Returning from cache', event.request.url);
                    return response;
                }

                // Not in cache - fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            console.log('[ServiceWorker] Invalid response');
                            return response;
                        }

                        // Clone the response - one to cache, one to return
                        var responseToCache = response.clone();

                        caches.open(CACHE_VERSION)
                            .then((cache) => {
                                console.log('[ServiceWorker] Caching new resource', event.request.url);
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        // Network failed, serve the offline page
                        console.log('[ServiceWorker] Network failed, serving offline page');
                        return caches.match('./offline.html');
                    });
            })
    );
}); 