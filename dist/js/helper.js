'use strict';

/**
 * helper.js contains functions that help not repeat code
 * in order to keep the code in other js files tidied up
 */

/**
 * Create source element and append it to picture element.
 */
var addImageSourceToPicture = function addImageSourceToPicture(picture, media, srcset) {
    var source = document.createElement('source');
    if (media !== undefined) {
        source.media = media;
    }
    source.srcset = srcset;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhlbHBlci5qcyJdLCJuYW1lcyI6WyJhZGRJbWFnZVNvdXJjZVRvUGljdHVyZSIsInBpY3R1cmUiLCJtZWRpYSIsInNyY3NldCIsInNvdXJjZSIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInVuZGVmaW5lZCIsImFwcGVuZCIsImZpbGVFeHRlbnNpb24iLCJmaWxlbmFtZSIsInNwbGl0IiwicG9wIiwiZmlsZW5hbWVXaXRob3V0RXh0ZW5zaW9uIiwicmVwbGFjZSIsImltYWdlTmFtZXNCeVNpemUiLCJpbWFnZUZpbGVuYW1lIiwiaW1hZ2VFeHRlbnNpb24iLCJmaWxlbmFtZXMiLCJzbWFsbCIsIm1lZGl1bSIsImxhcmdlIiwiZ2V0R29vZ2xlTWFwc0FwaSIsIm9wdGlvbnMiLCJyb290TWFyZ2luIiwidGhyZXNob2xkIiwibWFwIiwiZ2V0RWxlbWVudEJ5SWQiLCJvYnNlcnZlciIsIkludGVyc2VjdGlvbk9ic2VydmVyIiwiZW50cmllcyIsImlzSW50ZXJzZWN0aW5nIiwiaW50ZXJzZWN0aW9uUmF0aW8iLCJjbGFzc05hbWUiLCJpbmRleE9mIiwibWFwT2ZmbGluZSIsImlkIiwibWFwT2ZmbGluZU1lc3NhZ2UiLCJpbm5lckhUTUwiLCJhcHBlbmRDaGlsZCIsImxvYWRqcyIsInVub2JzZXJ2ZSIsIm9ic2VydmUiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7O0FBS0E7OztBQUdBLElBQU1BLDBCQUEwQixTQUExQkEsdUJBQTBCLENBQUNDLE9BQUQsRUFBVUMsS0FBVixFQUFpQkMsTUFBakIsRUFBNEI7QUFDeEQsUUFBTUMsU0FBU0MsU0FBU0MsYUFBVCxDQUF1QixRQUF2QixDQUFmO0FBQ0EsUUFBSUosVUFBVUssU0FBZCxFQUF5QjtBQUNyQkgsZUFBT0YsS0FBUCxHQUFlQSxLQUFmO0FBQ0g7QUFDREUsV0FBT0QsTUFBUCxHQUFnQkEsTUFBaEI7QUFDQUYsWUFBUU8sTUFBUixDQUFlSixNQUFmO0FBQ0gsQ0FQRDs7QUFTQTs7O0FBR0EsSUFBTUssZ0JBQWdCLFNBQWhCQSxhQUFnQixDQUFDQyxRQUFELEVBQWM7QUFDaEMsV0FBT0EsU0FBU0MsS0FBVCxDQUFlLEdBQWYsRUFBb0JDLEdBQXBCLEVBQVA7QUFDSCxDQUZEOztBQUlBOzs7QUFHQSxJQUFNQywyQkFBMkIsU0FBM0JBLHdCQUEyQixDQUFDSCxRQUFELEVBQWM7QUFDM0MsV0FBT0EsU0FBU0ksT0FBVCxDQUFpQixTQUFqQixFQUE0QixFQUE1QixDQUFQO0FBQ0gsQ0FGRDs7QUFJQTs7O0FBR0EsSUFBTUMsbUJBQW1CLFNBQW5CQSxnQkFBbUIsQ0FBQ0MsYUFBRCxFQUFtQjtBQUN4QyxRQUFNQyxpQkFBaUIsS0FBdkI7QUFDQSxRQUFNQyxZQUFZLEVBQWxCO0FBQ0FBLGNBQVVDLEtBQVYsR0FBcUJILGFBQXJCLGVBQTRDQyxjQUE1QztBQUNBQyxjQUFVRSxNQUFWLEdBQXNCSixhQUF0QixnQkFBOENDLGNBQTlDO0FBQ0FDLGNBQVVHLEtBQVYsR0FBcUJMLGFBQXJCLGVBQTRDQyxjQUE1Qzs7QUFFQSxXQUFPQyxTQUFQO0FBQ0gsQ0FSRDs7QUFVQTs7Ozs7Ozs7OztBQVVBLElBQU1JLG1CQUFtQixTQUFuQkEsZ0JBQW1CLEdBQU07QUFDM0I7O0FBRUEsUUFBTUMsVUFBVTtBQUNaQyxvQkFBWSxPQURBO0FBRVpDLG1CQUFXO0FBRkMsS0FBaEI7O0FBS0EsUUFBTUMsTUFBTXJCLFNBQVNzQixjQUFULENBQXdCLEtBQXhCLENBQVo7O0FBRUE7QUFDQSxRQUFNQyxXQUFXLElBQUlDLG9CQUFKLENBQ1QsVUFBQ0MsT0FBRCxFQUFVRixRQUFWLEVBQXVCO0FBQzNCO0FBQ0EsWUFBTUcsaUJBQWlCLE9BQU9ELFFBQVEsQ0FBUixFQUFXQyxjQUFsQixLQUFxQyxTQUFyQyxHQUFpREQsUUFBUSxDQUFSLEVBQVdDLGNBQTVELEdBQTZFRCxRQUFRLENBQVIsRUFBV0UsaUJBQVgsR0FBK0IsQ0FBbkk7QUFDQSxZQUFJRCxjQUFKLEVBQW9CO0FBQ2hCO0FBQ0EsZ0JBQUksT0FBS0wsSUFBSU8sU0FBVCxRQUF1Qm5CLE9BQXZCLENBQStCLFNBQS9CLEVBQTBDLEdBQTFDLEVBQStDb0IsT0FBL0MsQ0FBdUQsV0FBdkQsSUFBc0UsQ0FBQyxDQUEzRSxFQUE4RTtBQUMxRTtBQUNBLG9CQUFJLENBQUM3QixTQUFTc0IsY0FBVCxDQUF3QixhQUF4QixDQUFMLEVBQTZDO0FBQ3pDO0FBQ0Esd0JBQU1RLGFBQWE5QixTQUFTQyxhQUFULENBQXVCLEtBQXZCLENBQW5CO0FBQ0E2QiwrQkFBV0MsRUFBWCxHQUFnQixhQUFoQjs7QUFFQSx3QkFBTUMsb0JBQW9CaEMsU0FBU0MsYUFBVCxDQUF1QixNQUF2QixDQUExQjtBQUNBK0Isc0NBQWtCQyxTQUFsQixHQUE4Qiw2Q0FBOUI7QUFDQUQsc0NBQWtCRCxFQUFsQixHQUF1QixxQkFBdkI7QUFDQUQsK0JBQVdJLFdBQVgsQ0FBdUJGLGlCQUF2Qjs7QUFFQVgsd0JBQUlsQixNQUFKLENBQVcyQixVQUFYO0FBQ0g7QUFDSixhQWRELE1BY087QUFDSDtBQUNBO0FBQ0FLLHVCQUFPLENBQUMsdUhBQUQsQ0FBUDtBQUNBWix5QkFBU2EsU0FBVCxDQUFtQmYsR0FBbkI7QUFDSDtBQUNKO0FBQ0osS0EzQmdCLEVBMkJkSCxPQTNCYyxDQUFqQjs7QUE2QkFLLGFBQVNjLE9BQVQsQ0FBaUJoQixHQUFqQjtBQUNILENBekNEIiwiZmlsZSI6ImhlbHBlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBoZWxwZXIuanMgY29udGFpbnMgZnVuY3Rpb25zIHRoYXQgaGVscCBub3QgcmVwZWF0IGNvZGVcclxuICogaW4gb3JkZXIgdG8ga2VlcCB0aGUgY29kZSBpbiBvdGhlciBqcyBmaWxlcyB0aWRpZWQgdXBcclxuICovXHJcblxyXG4vKipcclxuICogQ3JlYXRlIHNvdXJjZSBlbGVtZW50IGFuZCBhcHBlbmQgaXQgdG8gcGljdHVyZSBlbGVtZW50LlxyXG4gKi9cclxuY29uc3QgYWRkSW1hZ2VTb3VyY2VUb1BpY3R1cmUgPSAocGljdHVyZSwgbWVkaWEsIHNyY3NldCkgPT4ge1xyXG4gICAgY29uc3Qgc291cmNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XHJcbiAgICBpZiAobWVkaWEgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHNvdXJjZS5tZWRpYSA9IG1lZGlhO1xyXG4gICAgfVxyXG4gICAgc291cmNlLnNyY3NldCA9IHNyY3NldDtcclxuICAgIHBpY3R1cmUuYXBwZW5kKHNvdXJjZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogRXh0cmFjdCBleHRlbnNpb24gZnJvbSBmaWxlbmFtZS5cclxuICovXHJcbmNvbnN0IGZpbGVFeHRlbnNpb24gPSAoZmlsZW5hbWUpID0+IHtcclxuICAgIHJldHVybiBmaWxlbmFtZS5zcGxpdCgnLicpLnBvcCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCBmaWxlbmFtZSB3aXRob3V0IGV4dGVuc2lvbi5cclxuICovXHJcbmNvbnN0IGZpbGVuYW1lV2l0aG91dEV4dGVuc2lvbiA9IChmaWxlbmFtZSkgPT4ge1xyXG4gICAgcmV0dXJuIGZpbGVuYW1lLnJlcGxhY2UoLy5bXi5dKyQvLCAnJyk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IGFsbCBwb3NzaWJsZSBuYW1lcyBvZiBhbiBpbWFnZSBkZXBlbmRpbmcgb24gaXRzIHNpemUgKHNtYWxsLCBtZWRpdW0sIGxhcmdlKS5cclxuICovXHJcbmNvbnN0IGltYWdlTmFtZXNCeVNpemUgPSAoaW1hZ2VGaWxlbmFtZSkgPT4ge1xyXG4gICAgY29uc3QgaW1hZ2VFeHRlbnNpb24gPSAnanBnJztcclxuICAgIGNvbnN0IGZpbGVuYW1lcyA9IHt9O1xyXG4gICAgZmlsZW5hbWVzLnNtYWxsID0gYCR7aW1hZ2VGaWxlbmFtZX0tc21hbGwuJHtpbWFnZUV4dGVuc2lvbn1gO1xyXG4gICAgZmlsZW5hbWVzLm1lZGl1bSA9IGAke2ltYWdlRmlsZW5hbWV9LW1lZGl1bS4ke2ltYWdlRXh0ZW5zaW9ufWA7XHJcbiAgICBmaWxlbmFtZXMubGFyZ2UgPSBgJHtpbWFnZUZpbGVuYW1lfS1sYXJnZS4ke2ltYWdlRXh0ZW5zaW9ufWA7XHJcblxyXG4gICAgcmV0dXJuIGZpbGVuYW1lcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbmNsdWRlIGdvb2dsZSBtYXBzIGFwaSBvbiB0aGUgZmx5LlxyXG4gKiBHb29nbGUgbWFwIGlzIGxhenkgbG9hZGVkIHVzaW5nIHRoZSBJbnRlcnNlY3Rpb25PYnNlcnZlciBBUEkuXHJcbiAqIFRoZSBjb2RlIGZvciB0aGlzIGZ1bmN0aW9uIGlzIGZyb20gdGhlIFxyXG4gKiBMYXp5IGxvYWRpbmcgR29vZ2xlIE1hcHMgd2l0aCB0aGUgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgQVBJIGFydGljbGU6XHJcbiAqIGh0dHBzOi8vd2FsdGVyZWJlcnQuY29tL2Jsb2cvbGF6eS1sb2FkaW5nLWdvb2dsZS1tYXBzLXdpdGgtdGhlLWludGVyc2VjdGlvbi1vYnNlcnZlci1hcGkvXHJcbiAqIFRoZSBvbmx5IHRoaW5nIGNoYW5nZWQgaXMgdGhhdCBtdWljc3MgbG9hZEpTIGlzIHVzZWQgaW5zdGVhZCBvZiBcclxuICogRmlsYW1lbnQgR3JvdXAgbG9hZEpTIHVzZWQgaW4gdGhlIG9yaWdpbmFsLCB0byBsb2FkIGpzIHNjcmlwdHMgb24gdGhlIGZseS5cclxuICogQ2hlY2sgZm9yIG9mZmxpbmUgc3RhdGUgdG8gbm90IGxvYWQgZ29vZ2xlIG1hcHMgc2NyaXB0IGlzIGFkZGVkLlxyXG4gKi9cclxuY29uc3QgZ2V0R29vZ2xlTWFwc0FwaSA9ICgpID0+IHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgIHJvb3RNYXJnaW46ICc0MDBweCcsXHJcbiAgICAgICAgdGhyZXNob2xkOiAwXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IG1hcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKTtcclxuXHJcbiAgICAvLyBMYXp5IGxvYWRpbmcgR29vZ2xlIE1hcHMgd2l0aCB0aGUgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgQVBJXHJcbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihcclxuICAgICAgICAgICAgKGVudHJpZXMsIG9ic2VydmVyKSA9PiB7XHJcbiAgICAgICAgLy8gRGV0ZWN0IGludGVyc2VjdGlvbiBodHRwczovL2NhbGVuZGFyLnBlcmZwbGFuZXQuY29tLzIwMTcvcHJvZ3Jlc3NpdmUtaW1hZ2UtbG9hZGluZy11c2luZy1pbnRlcnNlY3Rpb24tb2JzZXJ2ZXItYW5kLXNxaXAvI2NvbW1lbnQtMTAyODM4XHJcbiAgICAgICAgY29uc3QgaXNJbnRlcnNlY3RpbmcgPSB0eXBlb2YgZW50cmllc1swXS5pc0ludGVyc2VjdGluZyA9PT0gJ2Jvb2xlYW4nID8gZW50cmllc1swXS5pc0ludGVyc2VjdGluZyA6IGVudHJpZXNbMF0uaW50ZXJzZWN0aW9uUmF0aW8gPiAwO1xyXG4gICAgICAgIGlmIChpc0ludGVyc2VjdGluZykge1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBwYWdlIGlzIG9mZmxpbmVcclxuICAgICAgICAgICAgaWYgKChgICR7bWFwLmNsYXNzTmFtZX0gYCkucmVwbGFjZSgvW1xcblxcdF0vZywgJyAnKS5pbmRleE9mKCcgb2ZmbGluZSAnKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiBwYWdlIGlzIG9mZmxpbmUsIHNob3cgY29ycmVzcG9uZGluZyBtZXNzYWdlIG9uIG1hcFxyXG4gICAgICAgICAgICAgICAgaWYgKCFkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwLW9mZmxpbmUnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIERpc3BsYXkgYSBtYXAgbG9hZCBmYWlsdXJlIG1lc3NhZ2VcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXBPZmZsaW5lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFwT2ZmbGluZS5pZCA9ICdtYXAtb2ZmbGluZSc7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hcE9mZmxpbmVNZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcE9mZmxpbmVNZXNzYWdlLmlubmVySFRNTCA9ICdObyBpbnRlcm5ldCBjb25uZWN0aW9uLiBGYWlsZWQgdG8gbG9hZCBtYXAuJztcclxuICAgICAgICAgICAgICAgICAgICBtYXBPZmZsaW5lTWVzc2FnZS5pZCA9ICdtYXAtb2ZmbGluZS1tZXNzYWdlJztcclxuICAgICAgICAgICAgICAgICAgICBtYXBPZmZsaW5lLmFwcGVuZENoaWxkKG1hcE9mZmxpbmVNZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbWFwLmFwcGVuZChtYXBPZmZsaW5lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIExvYWQgZ29vZ2xlIG1hcHNcclxuICAgICAgICAgICAgICAgIC8vIFNjcmlwdHMgYXJlIGxvYWRlZCB1c2luZyBtdWljc3MgbG9hZEpTOiBodHRwczovL2dpdGh1Yi5jb20vbXVpY3NzL2xvYWRqc1xyXG4gICAgICAgICAgICAgICAgbG9hZGpzKFsnaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2tleT1BSXphU3lCelhER3JXeGoxR3NKVWJvOVpLU0pQejA3bzJLMWxqZ2MmbGlicmFyaWVzPXBsYWNlcyZjYWxsYmFjaz1pbml0TWFwJ10pO1xyXG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIudW5vYnNlcnZlKG1hcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICBvYnNlcnZlci5vYnNlcnZlKG1hcCk7XHJcbn07Il19
