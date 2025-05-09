const CACHE_NAME = 'pomodoro-timer-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/reset.css',
    '/js/main.js',
    '/js/timer.js',
    '/js/tasks.js',
    '/js/settings.js',
    '/js/notifications.js',
    '/js/ServiceWorkerManager.js',
    '/js/i18n.js',
    '/manifest.json',
    '/assets/favicon.ico',
    '/locales/pt.json',
    '/locales/en.json',
    '/locales/es.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Adicionar suporte a notificações
self.addEventListener('notificationclick', event => {
    event.notification.close();

    // Se a notificação tiver uma ação específica
    if (event.action === 'start-next') {
        // Foca na janela existente ou abre uma nova
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                if (clientList.length > 0) {
                    return clientList[0].focus().then(client => client.postMessage({ action: 'start-timer' }));
                }
                return clients.openWindow('/');
            })
        );
    } else {
        // Comportamento padrão ao clicar na notificação
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                if (clientList.length > 0) {
                    return clientList[0].focus();
                }
                return clients.openWindow('/');
            })
        );
    }
}); 