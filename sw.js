const CACHE_NAME = 'mws-restaurant-v8';
// 
// Create  a seperate cache for images, because 
// the idea is to let them live between versions of the app
const CACHE_IMG_NAME = 'mws-restaurant-img';

// Create a const for all static files to be explicitly cached
const CACHE_STATIC_FILES = [
    '/',
    '/restaurant.html',
    '/loadjs.min.js',
    '/loadjs.min.js',
    '/main.bundle.js',
    '/main.bundle.js.map',
    '/polyfills.bundle.js',
    '/polyfills.bundle.js.map',
    '/restaurant_info.bundle.js',
    '/restaurant_info.bundle.js.map',
    '/style.bundle.css',
    '/style.bundle.css.map',
    '/swindex.bundle.js',
    '/swindex.bundle.js.map',
    '/noimg.png',
    '/noimg.svg',
    '/icon-144x144.png',
    '/icon-192x192.png',
    '/icon-512x512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/vanilla-lazyload/8.7.1/lazyload.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/vanilla-lazyload/10.5.2/lazyload.min.js'
];

// Store reviews that could not be stored in server to sync them
let offlineReviews = {};

self.addEventListener('message', event => {
    switch (event.data.action) {
        case 'skipWaiting':
            // Accept a message that tells service worker to take over (skip waiting)
            self.skipWaiting();
            break;
        case 'sync':
            // Accept a message that tells service worker to register a review sync
            const review = event.data.review;

            // Create an id to store data for sync
            const uuid = Math.random().toString(36).substr(2, 9);
            const tag = `review_${uuid}`;
            // If tag exists try again to create one
            while (tag in offlineReviews) {
                const uuid = Math.random().toString(36).substr(2, 9);
                const tag = `review_${uuid}`;
            }
            
            offlineReviews[tag] = event.data.review;

            // Register a sync and pass the id as tag for it to get the data
            self.registration.sync.register(tag);
            break;
    }
});

// Install service worker
self.addEventListener('install', event => event.waitUntil(
            // Open cache in the install event to get everything we need
            // either from the cache or from the network and cache them
            // before the service worker takes over
            caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CACHE_STATIC_FILES))
            .catch(error => console.log(error))
            )
);

// Activate service worker
self.addEventListener('activate', event => event.waitUntil(
            caches.keys().then(
            cacheNames => Promise.all(
                        cacheNames.filter(cacheName => cacheName.startsWith('mws-restaurant-v') && cacheName != CACHE_NAME)
                        .map(cacheName => caches.delete(cacheName))
                        )))
);

// Intercept the requests made to the server
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin === location.origin) {
        // Cache images
        if (requestUrl.pathname.startsWith('/img/')) {
            event.respondWith(serveImage(event.request));
            return;
        }
    }

    // Check if request url matches one of explicitly determined files to be cached
    if (CACHE_STATIC_FILES.includes(requestUrl.pathname)) {
        // Cache this files
        event.respondWith(serveStaticFiles(event.request));
    }
});

// Sync actions
self.addEventListener('sync', event => {
    // Get offline review from offlineReviews by event.tag
    const review = offlineReviews[event.tag];

    // Attempt to post the review to server
    event.waitUntil(fetch('http://localhost:1337/reviews/', {
        method: 'POST',
        body: JSON.stringify(review)
    }).then(response => {
        return response.json();
    }).then(addedReview => {
        if (addedReview) {
            delete offlineReviews[event.tag];

            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    // When we get the visible client that is our current page
                    if (client.visibilityState == 'visible') {
                        review.id = addedReview.id;
                        // Post message to client add review
                        client.postMessage({
                            action: 'post_success',
                            review: review
                        });
                    }
                });
            });

            console.log('Review stored in server');
        } else {
            console.log('Review could not be stored in server');
        }
    }).catch(error => {
        console.log('Test error catch', error);
    }));
});

/**
 * Check if static files exist in the cache, else fetch them from network
 */
serveStaticFiles = request =>
    // Open the cache and match the request with the ones present in the cache
    caches.open(CACHE_NAME).then(cache => cache.match(request.url).then(response => {
            // Check if response found in cache
            if (response)
                return response;

            // If the request doesn’t match, redirect the request to the server
            // and return a fetch to the network for the original request
            return fetch(request).then(networkResponse => {
                if (!networkResponse.ok) {
                    throw Error(networkResponse.statusText);
                }

                // Put a clone of response in the cache
                // because we can use the body of a response once
                cache.put(request.url, networkResponse.clone());

                // Return network response
                return networkResponse;
            }).catch(error => console.log('Caching files error: \n', error));
        })
    );


/**
 * Check if images exist in the cache, else fetch them from network
 */
serveImage = request => {
    // Cache images without the size suffix to return from the cache, even when 
    // the browser requests a different size of the same image
    const storageUrl = request.url.replace(/-(large|medium|small)\.jpg$/, '');

    // Open the cache and match the request with the ones present in the cache
    return caches.open(CACHE_IMG_NAME).then(cache => cache.match(storageUrl).then(response => {
            if (response)
                return response;

            // If the request doesn’t match, redirect the request to the server
            // and return a fetch to the network for the original request
            return fetch(request).then(networkResponse => {
                if (!networkResponse.ok) {
                    throw Error(networkResponse.statusText);
                }

                // Put a clone of response in the cache
                // because we can use the body of a response once
                cache.put(storageUrl, networkResponse.clone());

                // Return network response
                return networkResponse;
            });
        })
    );
};
