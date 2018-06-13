'use strict';

/**
 * helper.js contains functions that help not repeat code
 * in order to keep the code in other js files tidied up
 */

/**
 * Create source element and append it to picture element.
 */
var addImageSourceToPicture = function addImageSourceToPicture(picture, srcset, media) {
    var source = document.createElement('source');
    if (media !== undefined) {
        source.media = media;
    }
    source.setAttribute('data-srcset', srcset);
    picture.append(source);
};

/**
 * Extract extension from filename.
 */
var fileExtension = function fileExtension(filename) {
    return filename.split('.').pop();
};

/**
 * Get filename without extension.
 */
var filenameWithoutExtension = function filenameWithoutExtension(filename) {
    return filename.replace(/.[^.]+$/, '');
};

/**
 * Get all possible names of an image depending on its size (small, medium, large).
 */
var imageNamesBySize = function imageNamesBySize(imageFilename) {
    var imageExtension = 'jpg';
    var filenames = {};
    filenames.small = imageFilename + '-small.' + imageExtension;
    filenames.medium = imageFilename + '-medium.' + imageExtension;
    filenames.large = imageFilename + '-large.' + imageExtension;

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
var getGoogleMapsApi = function getGoogleMapsApi() {
    'use strict';

    var options = {
        rootMargin: '400px',
        threshold: 0
    };

    var map = document.getElementById('map');

    // Lazy loading Google Maps with the IntersectionObserver API
    var observer = new IntersectionObserver(function (entries, observer) {
        // Detect intersection https://calendar.perfplanet.com/2017/progressive-image-loading-using-intersection-observer-and-sqip/#comment-102838
        var isIntersecting = typeof entries[0].isIntersecting === 'boolean' ? entries[0].isIntersecting : entries[0].intersectionRatio > 0;
        if (isIntersecting) {
            // Check if page is offline
            if ((' ' + map.className + ' ').replace(/[\n\t]/g, ' ').indexOf(' offline ') > -1) {
                // If page is offline, show corresponding message on map
                if (!document.getElementById('map-offline')) {
                    // Display a map load failure message
                    var mapOffline = document.createElement('div');
                    mapOffline.id = 'map-offline';

                    var mapOfflineMessage = document.createElement('span');
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
var getLazyLoadPlugin = function getLazyLoadPlugin() {
    // Conditionally load the best version of LazyLoad depending on the browser's support of the IntersectionObserver API. 
    (function (w, d) {
        var b = d.getElementsByTagName('body')[0];
        var s = d.createElement("script");
        s.async = true;
        var v = !("IntersectionObserver" in w) ? "8.7.1" : "10.5.2";
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/vanilla-lazyload/" + v + "/lazyload.min.js";
        w.lazyLoadOptions = {
            elements_selector: '.lazy'
        }; // Your options here. See "recipes" for more information about async.
        b.appendChild(s);
    })(window, document);
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlbHBlci5qcyJdLCJuYW1lcyI6WyJhZGRJbWFnZVNvdXJjZVRvUGljdHVyZSIsInBpY3R1cmUiLCJzcmNzZXQiLCJtZWRpYSIsInNvdXJjZSIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInVuZGVmaW5lZCIsInNldEF0dHJpYnV0ZSIsImFwcGVuZCIsImZpbGVFeHRlbnNpb24iLCJmaWxlbmFtZSIsInNwbGl0IiwicG9wIiwiZmlsZW5hbWVXaXRob3V0RXh0ZW5zaW9uIiwicmVwbGFjZSIsImltYWdlTmFtZXNCeVNpemUiLCJpbWFnZUZpbGVuYW1lIiwiaW1hZ2VFeHRlbnNpb24iLCJmaWxlbmFtZXMiLCJzbWFsbCIsIm1lZGl1bSIsImxhcmdlIiwiZ2V0R29vZ2xlTWFwc0FwaSIsIm9wdGlvbnMiLCJyb290TWFyZ2luIiwidGhyZXNob2xkIiwibWFwIiwiZ2V0RWxlbWVudEJ5SWQiLCJvYnNlcnZlciIsIkludGVyc2VjdGlvbk9ic2VydmVyIiwiZW50cmllcyIsImlzSW50ZXJzZWN0aW5nIiwiaW50ZXJzZWN0aW9uUmF0aW8iLCJjbGFzc05hbWUiLCJpbmRleE9mIiwibWFwT2ZmbGluZSIsImlkIiwibWFwT2ZmbGluZU1lc3NhZ2UiLCJpbm5lckhUTUwiLCJhcHBlbmRDaGlsZCIsImxvYWRqcyIsInVub2JzZXJ2ZSIsIm9ic2VydmUiLCJnZXRMYXp5TG9hZFBsdWdpbiIsInciLCJkIiwiYiIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwicyIsImFzeW5jIiwidiIsInNyYyIsImxhenlMb2FkT3B0aW9ucyIsImVsZW1lbnRzX3NlbGVjdG9yIiwid2luZG93Il0sIm1hcHBpbmdzIjoiOztBQUFBOzs7OztBQUtBOzs7QUFHQSxJQUFNQSwwQkFBMEIsU0FBMUJBLHVCQUEwQixDQUFDQyxPQUFELEVBQVVDLE1BQVYsRUFBa0JDLEtBQWxCLEVBQTRCO0FBQ3hELFFBQU1DLFNBQVNDLFNBQVNDLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBZjtBQUNBLFFBQUlILFVBQVVJLFNBQWQsRUFBeUI7QUFDckJILGVBQU9ELEtBQVAsR0FBZUEsS0FBZjtBQUNIO0FBQ0RDLFdBQU9JLFlBQVAsQ0FBb0IsYUFBcEIsRUFBbUNOLE1BQW5DO0FBQ0FELFlBQVFRLE1BQVIsQ0FBZUwsTUFBZjtBQUNILENBUEQ7O0FBU0E7OztBQUdBLElBQU1NLGdCQUFnQixTQUFoQkEsYUFBZ0IsQ0FBQ0MsUUFBRCxFQUFjO0FBQ2hDLFdBQU9BLFNBQVNDLEtBQVQsQ0FBZSxHQUFmLEVBQW9CQyxHQUFwQixFQUFQO0FBQ0gsQ0FGRDs7QUFJQTs7O0FBR0EsSUFBTUMsMkJBQTJCLFNBQTNCQSx3QkFBMkIsQ0FBQ0gsUUFBRCxFQUFjO0FBQzNDLFdBQU9BLFNBQVNJLE9BQVQsQ0FBaUIsU0FBakIsRUFBNEIsRUFBNUIsQ0FBUDtBQUNILENBRkQ7O0FBSUE7OztBQUdBLElBQU1DLG1CQUFtQixTQUFuQkEsZ0JBQW1CLENBQUNDLGFBQUQsRUFBbUI7QUFDeEMsUUFBTUMsaUJBQWlCLEtBQXZCO0FBQ0EsUUFBTUMsWUFBWSxFQUFsQjtBQUNBQSxjQUFVQyxLQUFWLEdBQXFCSCxhQUFyQixlQUE0Q0MsY0FBNUM7QUFDQUMsY0FBVUUsTUFBVixHQUFzQkosYUFBdEIsZ0JBQThDQyxjQUE5QztBQUNBQyxjQUFVRyxLQUFWLEdBQXFCTCxhQUFyQixlQUE0Q0MsY0FBNUM7O0FBRUEsV0FBT0MsU0FBUDtBQUNILENBUkQ7O0FBVUE7Ozs7Ozs7Ozs7QUFVQSxJQUFNSSxtQkFBbUIsU0FBbkJBLGdCQUFtQixHQUFNO0FBQzNCOztBQUVBLFFBQU1DLFVBQVU7QUFDWkMsb0JBQVksT0FEQTtBQUVaQyxtQkFBVztBQUZDLEtBQWhCOztBQUtBLFFBQU1DLE1BQU10QixTQUFTdUIsY0FBVCxDQUF3QixLQUF4QixDQUFaOztBQUVBO0FBQ0EsUUFBTUMsV0FBVyxJQUFJQyxvQkFBSixDQUNULFVBQUNDLE9BQUQsRUFBVUYsUUFBVixFQUF1QjtBQUMzQjtBQUNBLFlBQU1HLGlCQUFpQixPQUFPRCxRQUFRLENBQVIsRUFBV0MsY0FBbEIsS0FBcUMsU0FBckMsR0FBaURELFFBQVEsQ0FBUixFQUFXQyxjQUE1RCxHQUE2RUQsUUFBUSxDQUFSLEVBQVdFLGlCQUFYLEdBQStCLENBQW5JO0FBQ0EsWUFBSUQsY0FBSixFQUFvQjtBQUNoQjtBQUNBLGdCQUFJLE9BQUtMLElBQUlPLFNBQVQsUUFBdUJuQixPQUF2QixDQUErQixTQUEvQixFQUEwQyxHQUExQyxFQUErQ29CLE9BQS9DLENBQXVELFdBQXZELElBQXNFLENBQUMsQ0FBM0UsRUFBOEU7QUFDMUU7QUFDQSxvQkFBSSxDQUFDOUIsU0FBU3VCLGNBQVQsQ0FBd0IsYUFBeEIsQ0FBTCxFQUE2QztBQUN6QztBQUNBLHdCQUFNUSxhQUFhL0IsU0FBU0MsYUFBVCxDQUF1QixLQUF2QixDQUFuQjtBQUNBOEIsK0JBQVdDLEVBQVgsR0FBZ0IsYUFBaEI7O0FBRUEsd0JBQU1DLG9CQUFvQmpDLFNBQVNDLGFBQVQsQ0FBdUIsTUFBdkIsQ0FBMUI7QUFDQWdDLHNDQUFrQkMsU0FBbEIsR0FBOEIsNkNBQTlCO0FBQ0FELHNDQUFrQkQsRUFBbEIsR0FBdUIscUJBQXZCO0FBQ0FELCtCQUFXSSxXQUFYLENBQXVCRixpQkFBdkI7O0FBRUFYLHdCQUFJbEIsTUFBSixDQUFXMkIsVUFBWDtBQUNIO0FBQ0osYUFkRCxNQWNPO0FBQ0g7QUFDQTtBQUNBSyx1QkFBTyxDQUFDLHVIQUFELENBQVA7QUFDQVoseUJBQVNhLFNBQVQsQ0FBbUJmLEdBQW5CO0FBQ0g7QUFDSjtBQUNKLEtBM0JnQixFQTJCZEgsT0EzQmMsQ0FBakI7O0FBNkJBSyxhQUFTYyxPQUFULENBQWlCaEIsR0FBakI7QUFDSCxDQXpDRDs7QUEyQ0E7OztBQUdBLElBQU1pQixvQkFBb0IsU0FBcEJBLGlCQUFvQixHQUFNO0FBQzVCO0FBQ0MsZUFBU0MsQ0FBVCxFQUFZQyxDQUFaLEVBQWU7QUFDWixZQUFJQyxJQUFJRCxFQUFFRSxvQkFBRixDQUF1QixNQUF2QixFQUErQixDQUEvQixDQUFSO0FBQ0EsWUFBSUMsSUFBSUgsRUFBRXhDLGFBQUYsQ0FBZ0IsUUFBaEIsQ0FBUjtBQUNBMkMsVUFBRUMsS0FBRixHQUFVLElBQVY7QUFDQSxZQUFJQyxJQUFJLEVBQUUsMEJBQTBCTixDQUE1QixJQUFpQyxPQUFqQyxHQUEyQyxRQUFuRDtBQUNBSSxVQUFFRyxHQUFGLEdBQVEsNkRBQTZERCxDQUE3RCxHQUFpRSxrQkFBekU7QUFDQU4sVUFBRVEsZUFBRixHQUFvQjtBQUNoQkMsK0JBQW1CO0FBREgsU0FBcEIsQ0FOWSxDQVFUO0FBQ0hQLFVBQUVQLFdBQUYsQ0FBY1MsQ0FBZDtBQUNILEtBVkEsRUFVQ00sTUFWRCxFQVVTbEQsUUFWVCxDQUFEO0FBV0gsQ0FiRCIsImZpbGUiOiJoZWxwZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogaGVscGVyLmpzIGNvbnRhaW5zIGZ1bmN0aW9ucyB0aGF0IGhlbHAgbm90IHJlcGVhdCBjb2RlXHJcbiAqIGluIG9yZGVyIHRvIGtlZXAgdGhlIGNvZGUgaW4gb3RoZXIganMgZmlsZXMgdGlkaWVkIHVwXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBzb3VyY2UgZWxlbWVudCBhbmQgYXBwZW5kIGl0IHRvIHBpY3R1cmUgZWxlbWVudC5cclxuICovXHJcbmNvbnN0IGFkZEltYWdlU291cmNlVG9QaWN0dXJlID0gKHBpY3R1cmUsIHNyY3NldCwgbWVkaWEpID0+IHtcclxuICAgIGNvbnN0IHNvdXJjZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xyXG4gICAgaWYgKG1lZGlhICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBzb3VyY2UubWVkaWEgPSBtZWRpYTtcclxuICAgIH1cclxuICAgIHNvdXJjZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtc3Jjc2V0Jywgc3Jjc2V0KTtcclxuICAgIHBpY3R1cmUuYXBwZW5kKHNvdXJjZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogRXh0cmFjdCBleHRlbnNpb24gZnJvbSBmaWxlbmFtZS5cclxuICovXHJcbmNvbnN0IGZpbGVFeHRlbnNpb24gPSAoZmlsZW5hbWUpID0+IHtcclxuICAgIHJldHVybiBmaWxlbmFtZS5zcGxpdCgnLicpLnBvcCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCBmaWxlbmFtZSB3aXRob3V0IGV4dGVuc2lvbi5cclxuICovXHJcbmNvbnN0IGZpbGVuYW1lV2l0aG91dEV4dGVuc2lvbiA9IChmaWxlbmFtZSkgPT4ge1xyXG4gICAgcmV0dXJuIGZpbGVuYW1lLnJlcGxhY2UoLy5bXi5dKyQvLCAnJyk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IGFsbCBwb3NzaWJsZSBuYW1lcyBvZiBhbiBpbWFnZSBkZXBlbmRpbmcgb24gaXRzIHNpemUgKHNtYWxsLCBtZWRpdW0sIGxhcmdlKS5cclxuICovXHJcbmNvbnN0IGltYWdlTmFtZXNCeVNpemUgPSAoaW1hZ2VGaWxlbmFtZSkgPT4ge1xyXG4gICAgY29uc3QgaW1hZ2VFeHRlbnNpb24gPSAnanBnJztcclxuICAgIGNvbnN0IGZpbGVuYW1lcyA9IHt9O1xyXG4gICAgZmlsZW5hbWVzLnNtYWxsID0gYCR7aW1hZ2VGaWxlbmFtZX0tc21hbGwuJHtpbWFnZUV4dGVuc2lvbn1gO1xyXG4gICAgZmlsZW5hbWVzLm1lZGl1bSA9IGAke2ltYWdlRmlsZW5hbWV9LW1lZGl1bS4ke2ltYWdlRXh0ZW5zaW9ufWA7XHJcbiAgICBmaWxlbmFtZXMubGFyZ2UgPSBgJHtpbWFnZUZpbGVuYW1lfS1sYXJnZS4ke2ltYWdlRXh0ZW5zaW9ufWA7XHJcblxyXG4gICAgcmV0dXJuIGZpbGVuYW1lcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbmNsdWRlIGdvb2dsZSBtYXBzIGFwaSBvbiB0aGUgZmx5LlxyXG4gKiBHb29nbGUgbWFwIGlzIGxhenkgbG9hZGVkIHVzaW5nIHRoZSBJbnRlcnNlY3Rpb25PYnNlcnZlciBBUEkuXHJcbiAqIFRoZSBjb2RlIGZvciB0aGlzIGZ1bmN0aW9uIGlzIGZyb20gdGhlIFxyXG4gKiBMYXp5IGxvYWRpbmcgR29vZ2xlIE1hcHMgd2l0aCB0aGUgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgQVBJIGFydGljbGU6XHJcbiAqIGh0dHBzOi8vd2FsdGVyZWJlcnQuY29tL2Jsb2cvbGF6eS1sb2FkaW5nLWdvb2dsZS1tYXBzLXdpdGgtdGhlLWludGVyc2VjdGlvbi1vYnNlcnZlci1hcGkvXHJcbiAqIFRoZSBvbmx5IHRoaW5nIGNoYW5nZWQgaXMgdGhhdCBtdWljc3MgbG9hZEpTIGlzIHVzZWQgaW5zdGVhZCBvZiBcclxuICogRmlsYW1lbnQgR3JvdXAgbG9hZEpTIHVzZWQgaW4gdGhlIG9yaWdpbmFsLCB0byBsb2FkIGpzIHNjcmlwdHMgb24gdGhlIGZseS5cclxuICogQ2hlY2sgZm9yIG9mZmxpbmUgc3RhdGUgdG8gbm90IGxvYWQgZ29vZ2xlIG1hcHMgc2NyaXB0IGlzIGFkZGVkLlxyXG4gKi9cclxuY29uc3QgZ2V0R29vZ2xlTWFwc0FwaSA9ICgpID0+IHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgIHJvb3RNYXJnaW46ICc0MDBweCcsXHJcbiAgICAgICAgdGhyZXNob2xkOiAwXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IG1hcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKTtcclxuXHJcbiAgICAvLyBMYXp5IGxvYWRpbmcgR29vZ2xlIE1hcHMgd2l0aCB0aGUgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgQVBJXHJcbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihcclxuICAgICAgICAgICAgKGVudHJpZXMsIG9ic2VydmVyKSA9PiB7XHJcbiAgICAgICAgLy8gRGV0ZWN0IGludGVyc2VjdGlvbiBodHRwczovL2NhbGVuZGFyLnBlcmZwbGFuZXQuY29tLzIwMTcvcHJvZ3Jlc3NpdmUtaW1hZ2UtbG9hZGluZy11c2luZy1pbnRlcnNlY3Rpb24tb2JzZXJ2ZXItYW5kLXNxaXAvI2NvbW1lbnQtMTAyODM4XHJcbiAgICAgICAgY29uc3QgaXNJbnRlcnNlY3RpbmcgPSB0eXBlb2YgZW50cmllc1swXS5pc0ludGVyc2VjdGluZyA9PT0gJ2Jvb2xlYW4nID8gZW50cmllc1swXS5pc0ludGVyc2VjdGluZyA6IGVudHJpZXNbMF0uaW50ZXJzZWN0aW9uUmF0aW8gPiAwO1xyXG4gICAgICAgIGlmIChpc0ludGVyc2VjdGluZykge1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBwYWdlIGlzIG9mZmxpbmVcclxuICAgICAgICAgICAgaWYgKChgICR7bWFwLmNsYXNzTmFtZX0gYCkucmVwbGFjZSgvW1xcblxcdF0vZywgJyAnKS5pbmRleE9mKCcgb2ZmbGluZSAnKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiBwYWdlIGlzIG9mZmxpbmUsIHNob3cgY29ycmVzcG9uZGluZyBtZXNzYWdlIG9uIG1hcFxyXG4gICAgICAgICAgICAgICAgaWYgKCFkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwLW9mZmxpbmUnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIERpc3BsYXkgYSBtYXAgbG9hZCBmYWlsdXJlIG1lc3NhZ2VcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXBPZmZsaW5lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFwT2ZmbGluZS5pZCA9ICdtYXAtb2ZmbGluZSc7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hcE9mZmxpbmVNZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcE9mZmxpbmVNZXNzYWdlLmlubmVySFRNTCA9ICdObyBpbnRlcm5ldCBjb25uZWN0aW9uLiBGYWlsZWQgdG8gbG9hZCBtYXAuJztcclxuICAgICAgICAgICAgICAgICAgICBtYXBPZmZsaW5lTWVzc2FnZS5pZCA9ICdtYXAtb2ZmbGluZS1tZXNzYWdlJztcclxuICAgICAgICAgICAgICAgICAgICBtYXBPZmZsaW5lLmFwcGVuZENoaWxkKG1hcE9mZmxpbmVNZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbWFwLmFwcGVuZChtYXBPZmZsaW5lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIExvYWQgZ29vZ2xlIG1hcHNcclxuICAgICAgICAgICAgICAgIC8vIFNjcmlwdHMgYXJlIGxvYWRlZCB1c2luZyBtdWljc3MgbG9hZEpTOiBodHRwczovL2dpdGh1Yi5jb20vbXVpY3NzL2xvYWRqc1xyXG4gICAgICAgICAgICAgICAgbG9hZGpzKFsnaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2tleT1BSXphU3lCelhER3JXeGoxR3NKVWJvOVpLU0pQejA3bzJLMWxqZ2MmbGlicmFyaWVzPXBsYWNlcyZjYWxsYmFjaz1pbml0TWFwJ10pO1xyXG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIudW5vYnNlcnZlKG1hcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICBvYnNlcnZlci5vYnNlcnZlKG1hcCk7XHJcbn07XHJcblxyXG4vKipcclxuICogSW5jbHVkZSBMYXp5TG9hZCBwbHVnaW46IGh0dHBzOi8vd3d3LmFuZHJlYXZlcmxpY2NoaS5ldS9sYXp5bG9hZC8jcmVjaXBlc1xyXG4gKi9cclxuY29uc3QgZ2V0TGF6eUxvYWRQbHVnaW4gPSAoKSA9PiB7XHJcbiAgICAvLyBDb25kaXRpb25hbGx5IGxvYWQgdGhlIGJlc3QgdmVyc2lvbiBvZiBMYXp5TG9hZCBkZXBlbmRpbmcgb24gdGhlIGJyb3dzZXIncyBzdXBwb3J0IG9mIHRoZSBJbnRlcnNlY3Rpb25PYnNlcnZlciBBUEkuIFxyXG4gICAgKGZ1bmN0aW9uKHcsIGQpIHtcclxuICAgICAgICB2YXIgYiA9IGQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcclxuICAgICAgICB2YXIgcyA9IGQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcclxuICAgICAgICBzLmFzeW5jID0gdHJ1ZTtcclxuICAgICAgICB2YXIgdiA9ICEoXCJJbnRlcnNlY3Rpb25PYnNlcnZlclwiIGluIHcpID8gXCI4LjcuMVwiIDogXCIxMC41LjJcIjtcclxuICAgICAgICBzLnNyYyA9IFwiaHR0cHM6Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvdmFuaWxsYS1sYXp5bG9hZC9cIiArIHYgKyBcIi9sYXp5bG9hZC5taW4uanNcIjtcclxuICAgICAgICB3LmxhenlMb2FkT3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgZWxlbWVudHNfc2VsZWN0b3I6ICcubGF6eSdcclxuICAgICAgICB9OyAvLyBZb3VyIG9wdGlvbnMgaGVyZS4gU2VlIFwicmVjaXBlc1wiIGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IGFzeW5jLlxyXG4gICAgICAgIGIuYXBwZW5kQ2hpbGQocyk7XHJcbiAgICB9KHdpbmRvdywgZG9jdW1lbnQpKTtcclxufSJdfQ==
