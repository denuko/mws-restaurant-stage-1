'use strict';

var restaurants = void 0,
    neighborhoods = void 0,
    cuisines = void 0;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', function (event) {
    fetchNeighborhoods();
    fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
var fetchNeighborhoods = function fetchNeighborhoods() {
    DBHelper.fetchNeighborhoods(function (error, neighborhoods) {
        if (error) {
            // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
};

/**
 * Set neighborhoods HTML.
 */
var fillNeighborhoodsHTML = function fillNeighborhoodsHTML() {
    var neighborhoods = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.neighborhoods;

    var select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(function (neighborhood) {
        var option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
};

/**
 * Fetch all cuisines and set their HTML.
 */
var fetchCuisines = function fetchCuisines() {
    DBHelper.fetchCuisines(function (error, cuisines) {
        if (error) {
            // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
};

/**
 * Set cuisines HTML.
 */
var fillCuisinesHTML = function fillCuisinesHTML() {
    var cuisines = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.cuisines;

    var select = document.getElementById('cuisines-select');

    cuisines.forEach(function (cuisine) {
        var option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = function () {
    var loc = {
        lat: 40.722216,
        lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
    });
    updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
var updateRestaurants = function updateRestaurants() {
    var cSelect = document.getElementById('cuisines-select');
    var nSelect = document.getElementById('neighborhoods-select');

    var cIndex = cSelect.selectedIndex;
    var nIndex = nSelect.selectedIndex;

    var cuisine = cSelect[cIndex].value;
    var neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, function (error, restaurants) {
        if (error) {
            // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
var resetRestaurants = function resetRestaurants(restaurants) {
    // Remove all restaurants
    self.restaurants = [];
    var ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    self.markers.forEach(function (m) {
        return m.setMap(null);
    });
    self.markers = [];
    self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
var fillRestaurantsHTML = function fillRestaurantsHTML() {
    var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

    var ul = document.getElementById('restaurants-list');
    restaurants.forEach(function (restaurant) {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
var createRestaurantHTML = function createRestaurantHTML(restaurant) {
    var li = document.createElement('li');

    // create picture element for restaurant image in restaurant list
    var picture = document.createElement('picture');
    var image = document.createElement('img');
    image.className = 'restaurant-img';
    image.alt = restaurant.name;

    var imageFilename = DBHelper.imageUrlForRestaurant(restaurant);
    if (imageFilename == 'noimg') {
        // If restaurant has not an image, display a no image svg
        // and use its corresponding png as a fallback.
        // Author of the noimg.svg and noimg.png is credited at page's footer.
        var noImgFallback = imageFilename + '.png';
        addImageSourceToPicture(picture, imageFilename + '.svg');
        addImageSourceToPicture(picture, noImgFallback);

        image.src = noImgFallback;
        image.className += ' noimg';
        // TODO: Fix noimg svg responsive height
        // TODO: Fix noimg png fallback in IE
        // TODO: Cache noimg svg and png
    } else {
        // get all possible names of an image depending on its size (small, medium, large)
        var imagesResized = imageNamesBySize(imageFilename);
        // add source to picture element for medium screens
        addImageSourceToPicture(picture, imagesResized.medium, '(min-width: 363px) and (max-width:479px)');

        image.src = imagesResized.small; // small image by default
    }

    picture.append(image);
    li.append(picture);

    var name = document.createElement('h3');
    li.append(name);

    var more = document.createElement('a');
    more.href = DBHelper.urlForRestaurant(restaurant);
    more.innerHTML = restaurant.name;
    more.tabIndex = 0;
    name.append(more);

    var neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    var address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    return li;
};

/**
 * Add markers for current restaurants to the map.
 */
var addMarkersToMap = function addMarkersToMap() {
    var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

    restaurants.forEach(function (restaurant) {
        // Add marker to the map
        var marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
        google.maps.event.addListener(marker, 'click', function () {
            window.location.href = marker.url;
        });
        self.markers.push(marker);
    });
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsicmVzdGF1cmFudHMiLCJuZWlnaGJvcmhvb2RzIiwiY3Vpc2luZXMiLCJtYXAiLCJtYXJrZXJzIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJmZXRjaE5laWdoYm9yaG9vZHMiLCJmZXRjaEN1aXNpbmVzIiwiREJIZWxwZXIiLCJlcnJvciIsImNvbnNvbGUiLCJzZWxmIiwiZmlsbE5laWdoYm9yaG9vZHNIVE1MIiwic2VsZWN0IiwiZ2V0RWxlbWVudEJ5SWQiLCJmb3JFYWNoIiwib3B0aW9uIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsIm5laWdoYm9yaG9vZCIsInZhbHVlIiwiYXBwZW5kIiwiZmlsbEN1aXNpbmVzSFRNTCIsImN1aXNpbmUiLCJ3aW5kb3ciLCJpbml0TWFwIiwibG9jIiwibGF0IiwibG5nIiwiZ29vZ2xlIiwibWFwcyIsIk1hcCIsInpvb20iLCJjZW50ZXIiLCJzY3JvbGx3aGVlbCIsInVwZGF0ZVJlc3RhdXJhbnRzIiwiY1NlbGVjdCIsIm5TZWxlY3QiLCJjSW5kZXgiLCJzZWxlY3RlZEluZGV4IiwibkluZGV4IiwiZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kIiwicmVzZXRSZXN0YXVyYW50cyIsImZpbGxSZXN0YXVyYW50c0hUTUwiLCJ1bCIsIm0iLCJzZXRNYXAiLCJjcmVhdGVSZXN0YXVyYW50SFRNTCIsInJlc3RhdXJhbnQiLCJhZGRNYXJrZXJzVG9NYXAiLCJsaSIsInBpY3R1cmUiLCJpbWFnZSIsImNsYXNzTmFtZSIsImFsdCIsIm5hbWUiLCJpbWFnZUZpbGVuYW1lIiwiaW1hZ2VVcmxGb3JSZXN0YXVyYW50Iiwibm9JbWdGYWxsYmFjayIsImFkZEltYWdlU291cmNlVG9QaWN0dXJlIiwic3JjIiwiaW1hZ2VzUmVzaXplZCIsImltYWdlTmFtZXNCeVNpemUiLCJtZWRpdW0iLCJzbWFsbCIsIm1vcmUiLCJocmVmIiwidXJsRm9yUmVzdGF1cmFudCIsInRhYkluZGV4IiwiYWRkcmVzcyIsIm1hcmtlciIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJhZGRMaXN0ZW5lciIsImxvY2F0aW9uIiwidXJsIiwicHVzaCJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFJQSxvQkFBSjtBQUFBLElBQ1FDLHNCQURSO0FBQUEsSUFFUUMsaUJBRlI7QUFHQSxJQUFJQyxHQUFKO0FBQ0EsSUFBSUMsVUFBVSxFQUFkOztBQUVBOzs7QUFHQUMsU0FBU0MsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFVBQUNDLEtBQUQsRUFBVztBQUNyREM7QUFDQUM7QUFDSCxDQUhEOztBQUtBOzs7QUFHQSxJQUFNRCxxQkFBcUIsU0FBckJBLGtCQUFxQixHQUFNO0FBQzdCRSxhQUFTRixrQkFBVCxDQUE0QixVQUFDRyxLQUFELEVBQVFWLGFBQVIsRUFBMEI7QUFDbEQsWUFBSVUsS0FBSixFQUFXO0FBQUU7QUFDVEMsb0JBQVFELEtBQVIsQ0FBY0EsS0FBZDtBQUNILFNBRkQsTUFFTztBQUNIRSxpQkFBS1osYUFBTCxHQUFxQkEsYUFBckI7QUFDQWE7QUFDSDtBQUNKLEtBUEQ7QUFRSCxDQVREOztBQVdBOzs7QUFHQSxJQUFNQSx3QkFBd0IsU0FBeEJBLHFCQUF3QixHQUF3QztBQUFBLFFBQXZDYixhQUF1Qyx1RUFBdkJZLEtBQUtaLGFBQWtCOztBQUNsRSxRQUFNYyxTQUFTVixTQUFTVyxjQUFULENBQXdCLHNCQUF4QixDQUFmO0FBQ0FmLGtCQUFjZ0IsT0FBZCxDQUFzQix3QkFBZ0I7QUFDbEMsWUFBTUMsU0FBU2IsU0FBU2MsYUFBVCxDQUF1QixRQUF2QixDQUFmO0FBQ0FELGVBQU9FLFNBQVAsR0FBbUJDLFlBQW5CO0FBQ0FILGVBQU9JLEtBQVAsR0FBZUQsWUFBZjtBQUNBTixlQUFPUSxNQUFQLENBQWNMLE1BQWQ7QUFDSCxLQUxEO0FBTUgsQ0FSRDs7QUFVQTs7O0FBR0EsSUFBTVQsZ0JBQWdCLFNBQWhCQSxhQUFnQixHQUFNO0FBQ3hCQyxhQUFTRCxhQUFULENB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ICAgbmVpZ2hib3Job29kcyxcclxuICAgICAgICBjdWlzaW5lc1xyXG52YXIgbWFwXHJcbnZhciBtYXJrZXJzID0gW11cclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBuZWlnaGJvcmhvb2RzIGFuZCBjdWlzaW5lcyBhcyBzb29uIGFzIHRoZSBwYWdlIGlzIGxvYWRlZC5cclxuICovXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoZXZlbnQpID0+IHtcclxuICAgIGZldGNoTmVpZ2hib3Job29kcygpO1xyXG4gICAgZmV0Y2hDdWlzaW5lcygpO1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5jb25zdCBmZXRjaE5laWdoYm9yaG9vZHMgPSAoKSA9PiB7XHJcbiAgICBEQkhlbHBlci5mZXRjaE5laWdoYm9yaG9vZHMoKGVycm9yLCBuZWlnaGJvcmhvb2RzKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvclxyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZWxmLm5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzO1xyXG4gICAgICAgICAgICBmaWxsTmVpZ2hib3Job29kc0hUTUwoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldCBuZWlnaGJvcmhvb2RzIEhUTUwuXHJcbiAqL1xyXG5jb25zdCBmaWxsTmVpZ2hib3Job29kc0hUTUwgPSAobmVpZ2hib3Job29kcyA9IHNlbGYubmVpZ2hib3Job29kcykgPT4ge1xyXG4gICAgY29uc3Qgc2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25laWdoYm9yaG9vZHMtc2VsZWN0Jyk7XHJcbiAgICBuZWlnaGJvcmhvb2RzLmZvckVhY2gobmVpZ2hib3Job29kID0+IHtcclxuICAgICAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgICAgICBvcHRpb24uaW5uZXJIVE1MID0gbmVpZ2hib3Job29kO1xyXG4gICAgICAgIG9wdGlvbi52YWx1ZSA9IG5laWdoYm9yaG9vZDtcclxuICAgICAgICBzZWxlY3QuYXBwZW5kKG9wdGlvbik7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZldGNoIGFsbCBjdWlzaW5lcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5jb25zdCBmZXRjaEN1aXNpbmVzID0gKCkgPT4ge1xyXG4gICAgREJIZWxwZXIuZmV0Y2hDdWlzaW5lcygoZXJyb3IsIGN1aXNpbmVzKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2VsZi5jdWlzaW5lcyA9IGN1aXNpbmVzO1xyXG4gICAgICAgICAgICBmaWxsQ3Vpc2luZXNIVE1MKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXQgY3Vpc2luZXMgSFRNTC5cclxuICovXHJcbmNvbnN0IGZpbGxDdWlzaW5lc0hUTUwgPSAoY3Vpc2luZXMgPSBzZWxmLmN1aXNpbmVzKSA9PiB7XHJcbiAgICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3Vpc2luZXMtc2VsZWN0Jyk7XHJcblxyXG4gICAgY3Vpc2luZXMuZm9yRWFjaChjdWlzaW5lID0+IHtcclxuICAgICAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgICAgICBvcHRpb24uaW5uZXJIVE1MID0gY3Vpc2luZTtcclxuICAgICAgICBvcHRpb24udmFsdWUgPSBjdWlzaW5lO1xyXG4gICAgICAgIHNlbGVjdC5hcHBlbmQob3B0aW9uKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBHb29nbGUgbWFwLCBjYWxsZWQgZnJvbSBIVE1MLlxyXG4gKi9cclxud2luZG93LmluaXRNYXAgPSAoKSA9PiB7XHJcbiAgICBsZXQgbG9jID0ge1xyXG4gICAgICAgIGxhdDogNDAuNzIyMjE2LFxyXG4gICAgICAgIGxuZzogLTczLjk4NzUwMVxyXG4gICAgfTtcclxuICAgIHNlbGYubWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyksIHtcclxuICAgICAgICB6b29tOiAxMixcclxuICAgICAgICBjZW50ZXI6IGxvYyxcclxuICAgICAgICBzY3JvbGx3aGVlbDogZmFsc2VcclxuICAgIH0pO1xyXG4gICAgdXBkYXRlUmVzdGF1cmFudHMoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFVwZGF0ZSBwYWdlIGFuZCBtYXAgZm9yIGN1cnJlbnQgcmVzdGF1cmFudHMuXHJcbiAqL1xyXG5jb25zdCB1cGRhdGVSZXN0YXVyYW50cyA9ICgpID0+IHtcclxuICAgIGNvbnN0IGNTZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3Vpc2luZXMtc2VsZWN0Jyk7XHJcbiAgICBjb25zdCBuU2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25laWdoYm9yaG9vZHMtc2VsZWN0Jyk7XHJcblxyXG4gICAgY29uc3QgY0luZGV4ID0gY1NlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG4gICAgY29uc3QgbkluZGV4ID0gblNlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICAgIGNvbnN0IGN1aXNpbmUgPSBjU2VsZWN0W2NJbmRleF0udmFsdWU7XHJcbiAgICBjb25zdCBuZWlnaGJvcmhvb2QgPSBuU2VsZWN0W25JbmRleF0udmFsdWU7XHJcblxyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZCwgKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlc2V0UmVzdGF1cmFudHMocmVzdGF1cmFudHMpO1xyXG4gICAgICAgICAgICBmaWxsUmVzdGF1cmFudHNIVE1MKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuLyoqXHJcbiAqIENsZWFyIGN1cnJlbnQgcmVzdGF1cmFudHMsIHRoZWlyIEhUTUwgYW5kIHJlbW92ZSB0aGVpciBtYXAgbWFya2Vycy5cclxuICovXHJcbmNvbnN0IHJlc2V0UmVzdGF1cmFudHMgPSAocmVzdGF1cmFudHMpID0+IHtcclxuICAgIC8vIFJlbW92ZSBhbGwgcmVzdGF1cmFudHNcclxuICAgIHNlbGYucmVzdGF1cmFudHMgPSBbXTtcclxuICAgIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuICAgIHVsLmlubmVySFRNTCA9ICcnO1xyXG5cclxuICAgIC8vIFJlbW92ZSBhbGwgbWFwIG1hcmtlcnNcclxuICAgIHNlbGYubWFya2Vycy5mb3JFYWNoKG0gPT4gbS5zZXRNYXAobnVsbCkpO1xyXG4gICAgc2VsZi5tYXJrZXJzID0gW107XHJcbiAgICBzZWxmLnJlc3RhdXJhbnRzID0gcmVzdGF1cmFudHM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgYWxsIHJlc3RhdXJhbnRzIEhUTUwgYW5kIGFkZCB0aGVtIHRvIHRoZSB3ZWJwYWdlLlxyXG4gKi9cclxuY29uc3QgZmlsbFJlc3RhdXJhbnRzSFRNTCA9IChyZXN0YXVyYW50cyA9IHNlbGYucmVzdGF1cmFudHMpID0+IHtcclxuICAgIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuICAgIHJlc3RhdXJhbnRzLmZvckVhY2gocmVzdGF1cmFudCA9PiB7XHJcbiAgICAgICAgdWwuYXBwZW5kKGNyZWF0ZVJlc3RhdXJhbnRIVE1MKHJlc3RhdXJhbnQpKTtcclxuICAgIH0pO1xyXG4gICAgYWRkTWFya2Vyc1RvTWFwKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBIVE1MLlxyXG4gKi9cclxuY29uc3QgY3JlYXRlUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCkgPT4ge1xyXG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG5cclxuICAgIC8vIGNyZWF0ZSBwaWN0dXJlIGVsZW1lbnQgZm9yIHJlc3RhdXJhbnQgaW1hZ2UgaW4gcmVzdGF1cmFudCBsaXN0XHJcbiAgICBjb25zdCBwaWN0dXJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncGljdHVyZScpO1xyXG4gICAgY29uc3QgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICAgIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZyc7XHJcbiAgICBpbWFnZS5hbHQgPSByZXN0YXVyYW50Lm5hbWU7XHJcbiAgICBcclxuICAgIGNvbnN0IGltYWdlRmlsZW5hbWUgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgICBpZiAoaW1hZ2VGaWxlbmFtZSA9PSAnbm9pbWcnKSB7XHJcbiAgICAgICAgLy8gSWYgcmVzdGF1cmFudCBoYXMgbm90IGFuIGltYWdlLCBkaXNwbGF5IGEgbm8gaW1hZ2Ugc3ZnXHJcbiAgICAgICAgLy8gYW5kIHVzZSBpdHMgY29ycmVzcG9uZGluZyBwbmcgYXMgYSBmYWxsYmFjay5cclxuICAgICAgICAvLyBBdXRob3Igb2YgdGhlIG5vaW1nLnN2ZyBhbmQgbm9pbWcucG5nIGlzIGNyZWRpdGVkIGF0IHBhZ2UncyBmb290ZXIuXHJcbiAgICAgICAgY29uc3Qgbm9JbWdGYWxsYmFjayA9IGAke2ltYWdlRmlsZW5hbWV9LnBuZ2A7XHJcbiAgICAgICAgYWRkSW1hZ2VTb3VyY2VUb1BpY3R1cmUocGljdHVyZSwgYCR7aW1hZ2VGaWxlbmFtZX0uc3ZnYCk7XHJcbiAgICAgICAgYWRkSW1hZ2VTb3VyY2VUb1BpY3R1cmUocGljdHVyZSwgbm9JbWdGYWxsYmFjayk7XHJcblxyXG4gICAgICAgIGltYWdlLnNyYyA9IG5vSW1nRmFsbGJhY2s7XHJcbiAgICAgICAgaW1hZ2UuY2xhc3NOYW1lICs9ICcgbm9pbWcnO1xyXG4gICAgICAgIC8vIFRPRE86IEZpeCBub2ltZyBzdmcgcmVzcG9uc2l2ZSBoZWlnaHRcclxuICAgICAgICAvLyBUT0RPOiBGaXggbm9pbWcgcG5nIGZhbGxiYWNrIGluIElFXHJcbiAgICAgICAgLy8gVE9ETzogQ2FjaGUgbm9pbWcgc3ZnIGFuZCBwbmdcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gZ2V0IGFsbCBwb3NzaWJsZSBuYW1lcyBvZiBhbiBpbWFnZSBkZXBlbmRpbmcgb24gaXRzIHNpemUgKHNtYWxsLCBtZWRpdW0sIGxhcmdlKVxyXG4gICAgICAgIGNvbnN0IGltYWdlc1Jlc2l6ZWQgPSBpbWFnZU5hbWVzQnlTaXplKGltYWdlRmlsZW5hbWUpO1xyXG4gICAgICAgIC8vIGFkZCBzb3VyY2UgdG8gcGljdHVyZSBlbGVtZW50IGZvciBtZWRpdW0gc2NyZWVuc1xyXG4gICAgICAgIGFkZEltYWdlU291cmNlVG9QaWN0dXJlKHBpY3R1cmUsIGltYWdlc1Jlc2l6ZWQubWVkaXVtLCAnKG1pbi13aWR0aDogMzYzcHgpIGFuZCAobWF4LXdpZHRoOjQ3OXB4KScpO1xyXG5cclxuICAgICAgICBpbWFnZS5zcmMgPSBpbWFnZXNSZXNpemVkLnNtYWxsOyAgIC8vIHNtYWxsIGltYWdlIGJ5IGRlZmF1bHRcclxuICAgIH1cclxuXHJcbiAgICBwaWN0dXJlLmFwcGVuZChpbWFnZSk7XHJcbiAgICBsaS5hcHBlbmQocGljdHVyZSk7XHJcblxyXG4gICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gzJyk7XHJcbiAgICBsaS5hcHBlbmQobmFtZSk7XHJcblxyXG4gICAgY29uc3QgbW9yZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgIG1vcmUuaHJlZiA9IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgICBtb3JlLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcclxuICAgIG1vcmUudGFiSW5kZXggPSAwO1xyXG4gICAgbmFtZS5hcHBlbmQobW9yZSk7XHJcblxyXG4gICAgY29uc3QgbmVpZ2hib3Job29kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgbmVpZ2hib3Job29kLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmVpZ2hib3Job29kO1xyXG4gICAgbGkuYXBwZW5kKG5laWdoYm9yaG9vZCk7XHJcblxyXG4gICAgY29uc3QgYWRkcmVzcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIGFkZHJlc3MuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5hZGRyZXNzO1xyXG4gICAgbGkuYXBwZW5kKGFkZHJlc3MpO1xyXG5cclxuICAgIHJldHVybiBsaVxyXG59XHJcblxyXG4vKipcclxuICogQWRkIG1hcmtlcnMgZm9yIGN1cnJlbnQgcmVzdGF1cmFudHMgdG8gdGhlIG1hcC5cclxuICovXHJcbmNvbnN0IGFkZE1hcmtlcnNUb01hcCA9IChyZXN0YXVyYW50cyA9IHNlbGYucmVzdGF1cmFudHMpID0+IHtcclxuICAgIHJlc3RhdXJhbnRzLmZvckVhY2gocmVzdGF1cmFudCA9PiB7XHJcbiAgICAgICAgLy8gQWRkIG1hcmtlciB0byB0aGUgbWFwXHJcbiAgICAgICAgY29uc3QgbWFya2VyID0gREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBzZWxmLm1hcCk7XHJcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCAnY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gbWFya2VyLnVybFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNlbGYubWFya2Vycy5wdXNoKG1hcmtlcik7XHJcbiAgICB9KTtcclxufVxyXG4iXX0=
