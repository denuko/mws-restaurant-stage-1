/**
 * helper.js contains functions that help not repeat code
 * in order to keep the code in other js files tidied up
 */

/**
 * Create source element and append it to picture element.
 */
export const addImageSourceToPicture = (picture, srcset, media) => {
    const source = document.createElement('source');
    if (media !== undefined) {
        source.media = media;
    }
    source.setAttribute('data-srcset', srcset);
    picture.append(source);
};

/**
 * Extract extension from filename.
 */
export const fileExtension = (filename) => {
    return filename.split('.').pop();
};

/**
 * Get filename without extension.
 */
export const filenameWithoutExtension = (filename) => {
    return filename.replace(/.[^.]+$/, '');
};

/**
 * Get all possible names of an image depending on its size (small, medium, large).
 */
export const imageNamesBySize = (imageFilename) => {
    const imageExtension = 'jpg';
    const filenames = {};
    filenames.small = `${imageFilename}-small.${imageExtension}`;
    filenames.medium = `${imageFilename}-medium.${imageExtension}`;
    filenames.large = `${imageFilename}-large.${imageExtension}`;

    return filenames;
};

/**
 * Include google maps api on the fly.
 * Google map is lazy loaded using the IntersectionObserver API.
 * The code for this function is from the 
 * Lazy loading Google Maps with the IntersectionObserver API article:
 * https://walterebert.com/blog/lazy-loading-google-maps-with-the-intersection-observer-api/
 * The only thing changed is that muicss loadJS is used instead of 
 * Filament Group loadJS used in the original, to load js scripts on the fly.
 * Check for offline state to not load google maps script is added.
 */
export const getGoogleMapsApi = () => {
    'use strict';

    const options = {
        rootMargin: '400px',
        threshold: 0
    };

    const map = document.getElementById('map');

    // Lazy loading Google Maps with the IntersectionObserver API
    const observer = new IntersectionObserver(
            (entries, observer) => {
        // Detect intersection https://calendar.perfplanet.com/2017/progressive-image-loading-using-intersection-observer-and-sqip/#comment-102838
        const isIntersecting = typeof entries[0].isIntersecting === 'boolean' ? entries[0].isIntersecting : entries[0].intersectionRatio > 0;
        if (isIntersecting) {
            // Check if page is offline
            if ((` ${map.className} `).replace(/[\n\t]/g, ' ').indexOf(' offline ') > -1) {
                // If page is offline, show corresponding message on map
                if (!document.getElementById('map-offline')) {
                    // Display a map load failure message
                    const mapOffline = document.createElement('div');
                    mapOffline.id = 'map-offline';

                    const mapOfflineMessage = document.createElement('span');
                    mapOfflineMessage.innerHTML = 'No internet connection. Failed to load map.';
                    mapOfflineMessage.id = 'map-offline-message';
                    mapOffline.appendChild(mapOfflineMessage);

                    map.append(mapOffline);
                }
            } else {
                // Load google maps
                // Scripts are loaded using muicss loadJS: https://github.com/muicss/loadjs
                loadjs(['https://maps.googleapis.com/maps/api/js?key=AIzaSyBzXDGrWxj1GsJUbo9ZKSJPz07o2K1ljgc&libraries=places&callback=initMap']);
                observer.unobserve(map);
            }
        }
    }, options);

    observer.observe(map);
};

/**
 * Include LazyLoad plugin: https://www.andreaverlicchi.eu/lazyload/#recipes
 */
export const getLazyLoadPlugin = () => {
    // Conditionally load the best version of LazyLoad depending on the browser's support of the IntersectionObserver API. 
    (function(w, d) {
        var b = d.getElementsByTagName('body')[0];
        var s = d.createElement("script");
        s.async = true;
        var v = !("IntersectionObserver" in w) ? "8.7.1" : "10.5.2";
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/vanilla-lazyload/" + v + "/lazyload.min.js";
        w.lazyLoadOptions = {
            elements_selector: '.lazy'
        }; // Your options here. See "recipes" for more information about async.
        b.appendChild(s);
    }(window, document));
}
