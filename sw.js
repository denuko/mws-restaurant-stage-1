const CACHE_NAME = 'mws-restaurant-v6';
// 
// Create  a seperate cache for images, because 
// the idea is to let them live between versions of the app
const CACHE_IMG_NAME = 'mws-restaurant-img';

// Create a const for all static files to be explicitly cached
const CACHE_STATIC_FILES = [
    '/',
    '/restaurant.html',
    '/dist/js/dbhelper.js',
    '/dist/js/helper.js',
    '/dist/js/restaurant_info.js',
    '/dist/js/main.js',
    '/dist/js/sw/index.js',
    '/dist/idb/idb.js',
    '/dist/loadjs.min.js',
    '/dist/polyfills/append.js',
    '/dist/polyfills/fetch.js',
    '/dist/polyfills/picturefill.js',
    '/dist/polyfills/polyfill.min.js',
    '/dist/polyfills/intersection-observer.js',
    '/css/styles.css',
    '/noimg.png',
    '/noimg.svg'
];

// Accept a message that tells service worker to take over (skip waiting)
self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
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