const CACHE_NAME = 'mws-restaurant-v1';
// 
// Create  a seperate cache for images, because 
// the idea is to let them live between versions of the app
const CACHE_IMG_NAME = 'mws-restaurant-img';

// Create a const for all static files to be explicitly cached
const CACHE_STATIC_FILES = [
    '/',
    '/restaurant.html',
    '/data/restaurants.json',
    '/js/dbhelper.js',
    '/js/helper.js',
    '/js/picturefill.js',
    '/js/restaurant_info.js',
    '/js/main.js',
    '/js/sw/index.js',
    '/css/styles.css'
];

// Accept a message that tells service worker to take over (skip waiting)
self.addEventListener('message', function(event) {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

// Install service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
            // Open cache in the install event to get everything we need
            // either from the cache or from the network and cache them
            // before the service worker takes over
            caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll([
                    '/',
                    '/restaurant.html',
                    '/data/restaurants.json',
                    '/js/dbhelper.js',
                    '/js/helper.js',
                    '/js/picturefill.js',
                    '/js/restaurant_info.js',
                    '/js/main.js',
                    '/js/sw/index.js',
                    '/css/styles.css'
                ]);
            })
            .catch(function(error) {
                console.log(error);
            })
            );
});

// Activate service worker
self.addEventListener('activate', (event) => {
    console.log('Activate service worker');
});

// Intercept the requests made to the server
self.addEventListener('fetch', (event) => {
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

/**
 * Check if static files exist in the cache, else fetch them from network
 */
serveStaticFiles = (request) => {
    // Open the cache and match the request with the ones present in the cache
    return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request.url).then((response) => {
            // Check if response found in cache
            if (response)
                return response;

            // If the request doesn’t match, redirect the request to the server
            // and return a fetch to the network for the original request
            return fetch(request).then((networkResponse) => {
                if (!networkResponse.ok) {
                    throw Error(networkResponse.statusText);
                }

                // Put a clone of response in the cache
                // because we can use the body of a response once
                cache.put(request.url, networkResponse.clone());

                // Return network response
                return networkResponse;
            }).catch(function(error) {
                console.log('Caching files error: \n', error);
            });
        });
    });
}

/**
 * Check if images exist in the cache, else fetch them from network
 */
serveImage = (request) => {
    // Cache images without the size suffix to return from the cache, even when 
    // the browser requests a different size of the same image
    const storageUrl = request.url.replace(/-(large|medium|small)\.jpg$/, '');

    // Open the cache and match the request with the ones present in the cache
    return caches.open(CACHE_IMG_NAME).then((cache) => {
        return cache.match(storageUrl).then((response) => {
            if (response)
                return response;

            // If the request doesn’t match, redirect the request to the server
            // and return a fetch to the network for the original request
            return fetch(request).then((networkResponse) => {
                if (!networkResponse.ok) {
                    throw Error(networkResponse.statusText);
                }

                // Put a clone of response in the cache
                // because we can use the body of a response once
                cache.put(storageUrl, networkResponse.clone());

                // Return network response
                return networkResponse;
            });
        });
    });
};