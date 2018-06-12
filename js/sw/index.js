// Register service worker with whole origin as scope (default scope)
if (navigator.serviceWorker) {
    navigator.serviceWorker.register('./sw.js')
            .then((reg) => {
                // Check if page loaded using a service worker
                if (navigator.serviceWorker.controller) {
                    // Check if there is an installing service worker
                    // when the installer has been fired, but hasn’t yet completed
                    if (reg.installing) {
                        // There 's an update in progress
                        reg.installing.addEventListener('statechange', function() {
                            if (this.state == 'installed') {
                                // There 's a ready update 
                                console.log('service worker installed');
                                reg.installing.postMessage({action: 'skipWaiting'});
                            }
                        });
                    }

                    // Check if there is any waiting service worker
                    if (reg.waiting) {
                        // Tell the service worker to take over
                        console.log('service worker waiting');
                        reg.waiting.postMessage({action: 'skipWaiting'});
                    }

                    //Check if any update is found
                    reg.addEventListener('updatefound', function() {
                        reg.installing.addEventListener('statechange', function() {
                            if (this.state == 'installed') {
                                console.log('state has changed');
                                // Tell the service worker to take over
                                this.postMessage({action: 'skipWaiting'});
                            }
                        });

                    });
                } else {
                    // Content loaded from the network, which means that the
                    // user has already the latest version
                    console.log('page didn\'t load using a service worker');
                    return;
                }
            })
            .catch((error) => {
                console.error(error);
            });

    window.addEventListener('load', function() {
        // Detect if page is offline
        if (!navigator.onLine) {
            const map = document.getElementById('map');
            map.className = 'offline';
        }
    });
} else {
    console.log('Service Worker is not supported in this browser.');
}