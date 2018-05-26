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

    var imageFilename = DBHelper.imageUrlForRestaurant(restaurant);
    // get all possible names of an image depending on its size (small, medium, large)
    var imagesResized = imageNamesBySize(imageFilename);

    // create picture element for restaurant image in restaurant list
    var picture = document.createElement('picture');
    // add source to picture element for medium screens
    addImageSourceToPicture(picture, '(min-width: 363px) and (max-width:479px)', imagesResized.medium);

    var image = document.createElement('img');
    image.className = 'restaurant-img';
    image.src = imagesResized.small; // small image by default
    image.alt = restaurant.name;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsicmVzdGF1cmFudHMiLCJuZWlnaGJvcmhvb2RzIiwiY3Vpc2luZXMiLCJtYXAiLCJtYXJrZXJzIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJmZXRjaE5laWdoYm9yaG9vZHMiLCJmZXRjaEN1aXNpbmVzIiwiREJIZWxwZXIiLCJlcnJvciIsImNvbnNvbGUiLCJzZWxmIiwiZmlsbE5laWdoYm9yaG9vZHNIVE1MIiwic2VsZWN0IiwiZ2V0RWxlbWVudEJ5SWQiLCJmb3JFYWNoIiwib3B0aW9uIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsIm5laWdoYm9yaG9vZCIsInZhbHVlIiwiYXBwZW5kIiwiZmlsbEN1aXNpbmVzSFRNTCIsImN1aXNpbmUiLCJ3aW5kb3ciLCJpbml0TWFwIiwibG9jIiwibGF0IiwibG5nIiwiZ29vZ2xlIiwibWFwcyIsIk1hcCIsInpvb20iLCJjZW50ZXIiLCJzY3JvbGx3aGVlbCIsInVwZGF0ZVJlc3RhdXJhbnRzIiwiY1NlbGVjdCIsIm5TZWxlY3QiLCJjSW5kZXgiLCJzZWxlY3RlZEluZGV4IiwibkluZGV4IiwiZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kIiwicmVzZXRSZXN0YXVyYW50cyIsImZpbGxSZXN0YXVyYW50c0hUTUwiLCJ1bCIsIm0iLCJzZXRNYXAiLCJjcmVhdGVSZXN0YXVyYW50SFRNTCIsInJlc3RhdXJhbnQiLCJhZGRNYXJrZXJzVG9NYXAiLCJsaSIsImltYWdlRmlsZW5hbWUiLCJpbWFnZVVybEZvclJlc3RhdXJhbnQiLCJpbWFnZXNSZXNpemVkIiwiaW1hZ2VOYW1lc0J5U2l6ZSIsInBpY3R1cmUiLCJhZGRJbWFnZVNvdXJjZVRvUGljdHVyZSIsIm1lZGl1bSIsImltYWdlIiwiY2xhc3NOYW1lIiwic3JjIiwic21hbGwiLCJhbHQiLCJuYW1lIiwibW9yZSIsImhyZWYiLCJ1cmxGb3JSZXN0YXVyYW50IiwidGFiSW5kZXgiLCJhZGRyZXNzIiwibWFya2VyIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsImFkZExpc3RlbmVyIiwibG9jYXRpb24iLCJ1cmwiLCJwdXNoIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQUlBLG9CQUFKO0FBQUEsSUFDUUMsc0JBRFI7QUFBQSxJQUVRQyxpQkFGUjtBQUdBLElBQUlDLEdBQUo7QUFDQSxJQUFJQyxVQUFVLEVBQWQ7O0FBRUE7OztBQUdBQyxTQUFTQyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsVUFBQ0MsS0FBRCxFQUFXO0FBQ3JEQztBQUNBQztBQUNILENBSEQ7O0FBS0E7OztBQUdBLElBQU1ELHFCQUFxQixTQUFyQkEsa0JBQXFCLEdBQU07QUFDN0JFLGFBQVNGLGtCQUFULENBQTRCLFVBQUNHLEtBQUQsRUFBUVYsYUFBUixFQUEwQjtBQUNsRCxZQUFJVSxLQUFKLEVBQVc7QUFBRTtBQUNUQyxvQkFBUUQsS0FBUixDQUFjQSxLQUFkO0FBQ0gsU0FGRCxNQUVPO0FBQ0hFLGlCQUFLWixhQUFMLEdBQXFCQSxhQUFyQjtBQUNBYTtBQUNIO0FBQ0osS0FQRDtBQVFILENBVEQ7O0FBV0E7OztBQUdBLElBQU1BLHdCQUF3QixTQUF4QkEscUJBQXdCLEdBQXdDO0FBQUEsUUFBdkNiLGFBQXVDLHVFQUF2QlksS0FBS1osYUFBa0I7O0FBQ2xFLFFBQU1jLFNBQVNWLFNBQVNXLGNBQVQsQ0FBd0Isc0JBQXhCLENBQWY7QUFDQWYsa0JBQWNnQixPQUFkLENBQXNCLHdCQUFnQjtBQUNsQyxZQUFNQyxTQUFTYixTQUFTYyxhQUFULENBQXVCLFFBQXZCLENBQWY7QUFDQUQsZUFBT0UsU0FBUCxHQUFtQkMsWUFBbkI7QUFDQUgsZUFBT0ksS0FBUCxHQUFlRCxZQUFmO0FBQ0FOLGVBQU9RLE1BQVAsQ0FBY0wsTUFBZDtBQUNILEtBTEQ7QUFNSCxDQVJEOztBQVVBOzs7QUFHQSxJQUFNVCxnQkFBZ0IsU0FBaEJBLGFBQWdCLEdBQU07QUFDeEJDLGFBQVNELGFBQVQsQ0FBdUIsVUFBQ0UsS0FBRCxF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WUFBcEM7QUFDQStCLE9BQUc3QixNQUFILENBQVVGLFlBQVY7O0FBRUEsUUFBTWlELFVBQVVqRSxTQUFTYyxhQUFULENBQXVCLEdBQXZCLENBQWhCO0FBQ0FtRCxZQUFRbEQsU0FBUixHQUFvQjhCLFdBQVdvQixPQUEvQjtBQUNBbEIsT0FBRzdCLE1BQUgsQ0FBVStDLE9BQVY7O0FBRUEsV0FBT2xCLEVBQVA7QUFDSCxDQXJDRDs7QUF1Q0E7OztBQUdBLElBQU1ELGtCQUFrQixTQUFsQkEsZUFBa0IsR0FBb0M7QUFBQSxRQUFuQ25ELFdBQW1DLHVFQUFyQmEsS0FBS2IsV0FBZ0I7O0FBQ3hEQSxnQkFBWWlCLE9BQVosQ0FBb0Isc0JBQWM7QUFDOUI7QUFDQSxZQUFNc0QsU0FBUzdELFNBQVM4RCxzQkFBVCxDQUFnQ3RCLFVBQWhDLEVBQTRDckMsS0FBS1YsR0FBakQsQ0FBZjtBQUNBNEIsZUFBT0MsSUFBUCxDQUFZekIsS0FBWixDQUFrQmtFLFdBQWxCLENBQThCRixNQUE5QixFQUFzQyxPQUF0QyxFQUErQyxZQUFNO0FBQ2pEN0MsbUJBQU9nRCxRQUFQLENBQWdCUCxJQUFoQixHQUF1QkksT0FBT0ksR0FBOUI7QUFDSCxTQUZEO0FBR0E5RCxhQUFLVCxPQUFMLENBQWF3RSxJQUFiLENBQWtCTCxNQUFsQjtBQUNILEtBUEQ7QUFRSCxDQVREIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgcmVzdGF1cmFudHMsXHJcbiAgICAgICAgbmVpZ2hib3Job29kcyxcclxuICAgICAgICBjdWlzaW5lc1xyXG52YXIgbWFwXHJcbnZhciBtYXJrZXJzID0gW11cclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBuZWlnaGJvcmhvb2RzIGFuZCBjdWlzaW5lcyBhcyBzb29uIGFzIHRoZSBwYWdlIGlzIGxvYWRlZC5cclxuICovXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoZXZlbnQpID0+IHtcclxuICAgIGZldGNoTmVpZ2hib3Job29kcygpO1xyXG4gICAgZmV0Y2hDdWlzaW5lcygpO1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5jb25zdCBmZXRjaE5laWdoYm9yaG9vZHMgPSAoKSA9PiB7XHJcbiAgICBEQkhlbHBlci5mZXRjaE5laWdoYm9yaG9vZHMoKGVycm9yLCBuZWlnaGJvcmhvb2RzKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvclxyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZWxmLm5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzO1xyXG4gICAgICAgICAgICBmaWxsTmVpZ2hib3Job29kc0hUTUwoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldCBuZWlnaGJvcmhvb2RzIEhUTUwuXHJcbiAqL1xyXG5jb25zdCBmaWxsTmVpZ2hib3Job29kc0hUTUwgPSAobmVpZ2hib3Job29kcyA9IHNlbGYubmVpZ2hib3Job29kcykgPT4ge1xyXG4gICAgY29uc3Qgc2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25laWdoYm9yaG9vZHMtc2VsZWN0Jyk7XHJcbiAgICBuZWlnaGJvcmhvb2RzLmZvckVhY2gobmVpZ2hib3Job29kID0+IHtcclxuICAgICAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgICAgICBvcHRpb24uaW5uZXJIVE1MID0gbmVpZ2hib3Job29kO1xyXG4gICAgICAgIG9wdGlvbi52YWx1ZSA9IG5laWdoYm9yaG9vZDtcclxuICAgICAgICBzZWxlY3QuYXBwZW5kKG9wdGlvbik7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZldGNoIGFsbCBjdWlzaW5lcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5jb25zdCBmZXRjaEN1aXNpbmVzID0gKCkgPT4ge1xyXG4gICAgREJIZWxwZXIuZmV0Y2hDdWlzaW5lcygoZXJyb3IsIGN1aXNpbmVzKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2VsZi5jdWlzaW5lcyA9IGN1aXNpbmVzO1xyXG4gICAgICAgICAgICBmaWxsQ3Vpc2luZXNIVE1MKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXQgY3Vpc2luZXMgSFRNTC5cclxuICovXHJcbmNvbnN0IGZpbGxDdWlzaW5lc0hUTUwgPSAoY3Vpc2luZXMgPSBzZWxmLmN1aXNpbmVzKSA9PiB7XHJcbiAgICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3Vpc2luZXMtc2VsZWN0Jyk7XHJcblxyXG4gICAgY3Vpc2luZXMuZm9yRWFjaChjdWlzaW5lID0+IHtcclxuICAgICAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgICAgICBvcHRpb24uaW5uZXJIVE1MID0gY3Vpc2luZTtcclxuICAgICAgICBvcHRpb24udmFsdWUgPSBjdWlzaW5lO1xyXG4gICAgICAgIHNlbGVjdC5hcHBlbmQob3B0aW9uKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBHb29nbGUgbWFwLCBjYWxsZWQgZnJvbSBIVE1MLlxyXG4gKi9cclxud2luZG93LmluaXRNYXAgPSAoKSA9PiB7XHJcbiAgICBsZXQgbG9jID0ge1xyXG4gICAgICAgIGxhdDogNDAuNzIyMjE2LFxyXG4gICAgICAgIGxuZzogLTczLjk4NzUwMVxyXG4gICAgfTtcclxuICAgIHNlbGYubWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyksIHtcclxuICAgICAgICB6b29tOiAxMixcclxuICAgICAgICBjZW50ZXI6IGxvYyxcclxuICAgICAgICBzY3JvbGx3aGVlbDogZmFsc2VcclxuICAgIH0pO1xyXG4gICAgdXBkYXRlUmVzdGF1cmFudHMoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFVwZGF0ZSBwYWdlIGFuZCBtYXAgZm9yIGN1cnJlbnQgcmVzdGF1cmFudHMuXHJcbiAqL1xyXG5jb25zdCB1cGRhdGVSZXN0YXVyYW50cyA9ICgpID0+IHtcclxuICAgIGNvbnN0IGNTZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3Vpc2luZXMtc2VsZWN0Jyk7XHJcbiAgICBjb25zdCBuU2VsZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25laWdoYm9yaG9vZHMtc2VsZWN0Jyk7XHJcblxyXG4gICAgY29uc3QgY0luZGV4ID0gY1NlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG4gICAgY29uc3QgbkluZGV4ID0gblNlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICAgIGNvbnN0IGN1aXNpbmUgPSBjU2VsZWN0W2NJbmRleF0udmFsdWU7XHJcbiAgICBjb25zdCBuZWlnaGJvcmhvb2QgPSBuU2VsZWN0W25JbmRleF0udmFsdWU7XHJcblxyXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZCwgKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlc2V0UmVzdGF1cmFudHMocmVzdGF1cmFudHMpO1xyXG4gICAgICAgICAgICBmaWxsUmVzdGF1cmFudHNIVE1MKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuLyoqXHJcbiAqIENsZWFyIGN1cnJlbnQgcmVzdGF1cmFudHMsIHRoZWlyIEhUTUwgYW5kIHJlbW92ZSB0aGVpciBtYXAgbWFya2Vycy5cclxuICovXHJcbmNvbnN0IHJlc2V0UmVzdGF1cmFudHMgPSAocmVzdGF1cmFudHMpID0+IHtcclxuICAgIC8vIFJlbW92ZSBhbGwgcmVzdGF1cmFudHNcclxuICAgIHNlbGYucmVzdGF1cmFudHMgPSBbXTtcclxuICAgIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuICAgIHVsLmlubmVySFRNTCA9ICcnO1xyXG5cclxuICAgIC8vIFJlbW92ZSBhbGwgbWFwIG1hcmtlcnNcclxuICAgIHNlbGYubWFya2Vycy5mb3JFYWNoKG0gPT4gbS5zZXRNYXAobnVsbCkpO1xyXG4gICAgc2VsZi5tYXJrZXJzID0gW107XHJcbiAgICBzZWxmLnJlc3RhdXJhbnRzID0gcmVzdGF1cmFudHM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgYWxsIHJlc3RhdXJhbnRzIEhUTUwgYW5kIGFkZCB0aGVtIHRvIHRoZSB3ZWJwYWdlLlxyXG4gKi9cclxuY29uc3QgZmlsbFJlc3RhdXJhbnRzSFRNTCA9IChyZXN0YXVyYW50cyA9IHNlbGYucmVzdGF1cmFudHMpID0+IHtcclxuICAgIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuICAgIHJlc3RhdXJhbnRzLmZvckVhY2gocmVzdGF1cmFudCA9PiB7XHJcbiAgICAgICAgdWwuYXBwZW5kKGNyZWF0ZVJlc3RhdXJhbnRIVE1MKHJlc3RhdXJhbnQpKTtcclxuICAgIH0pO1xyXG4gICAgYWRkTWFya2Vyc1RvTWFwKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBIVE1MLlxyXG4gKi9cclxuY29uc3QgY3JlYXRlUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCkgPT4ge1xyXG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG5cclxuICAgIGNvbnN0IGltYWdlRmlsZW5hbWUgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgICAvLyBnZXQgYWxsIHBvc3NpYmxlIG5hbWVzIG9mIGFuIGltYWdlIGRlcGVuZGluZyBvbiBpdHMgc2l6ZSAoc21hbGwsIG1lZGl1bSwgbGFyZ2UpXHJcbiAgICBjb25zdCBpbWFnZXNSZXNpemVkID0gaW1hZ2VOYW1lc0J5U2l6ZShpbWFnZUZpbGVuYW1lKTtcclxuXHJcbiAgICAvLyBjcmVhdGUgcGljdHVyZSBlbGVtZW50IGZvciByZXN0YXVyYW50IGltYWdlIGluIHJlc3RhdXJhbnQgbGlzdFxyXG4gICAgY29uc3QgcGljdHVyZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3BpY3R1cmUnKTtcclxuICAgIC8vIGFkZCBzb3VyY2UgdG8gcGljdHVyZSBlbGVtZW50IGZvciBtZWRpdW0gc2NyZWVuc1xyXG4gICAgYWRkSW1hZ2VTb3VyY2VUb1BpY3R1cmUocGljdHVyZSwgJyhtaW4td2lkdGg6IDM2M3B4KSBhbmQgKG1heC13aWR0aDo0NzlweCknLCBpbWFnZXNSZXNpemVkLm1lZGl1bSk7XHJcblxyXG4gICAgY29uc3QgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICAgIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZyc7XHJcbiAgICBpbWFnZS5zcmMgPSBpbWFnZXNSZXNpemVkLnNtYWxsOyAgIC8vIHNtYWxsIGltYWdlIGJ5IGRlZmF1bHRcclxuICAgIGltYWdlLmFsdCA9IHJlc3RhdXJhbnQubmFtZTtcclxuICAgIHBpY3R1cmUuYXBwZW5kKGltYWdlKTtcclxuICAgIGxpLmFwcGVuZChwaWN0dXJlKTtcclxuXHJcbiAgICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDMnKTtcclxuICAgIGxpLmFwcGVuZChuYW1lKTtcclxuICAgIFxyXG4gICAgY29uc3QgbW9yZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgIG1vcmUuaHJlZiA9IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgICBtb3JlLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcclxuICAgIG1vcmUudGFiSW5kZXggPSAwO1xyXG4gICAgbmFtZS5hcHBlbmQobW9yZSk7XHJcblxyXG4gICAgY29uc3QgbmVpZ2hib3Job29kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgbmVpZ2hib3Job29kLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmVpZ2hib3Job29kO1xyXG4gICAgbGkuYXBwZW5kKG5laWdoYm9yaG9vZCk7XHJcblxyXG4gICAgY29uc3QgYWRkcmVzcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIGFkZHJlc3MuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5hZGRyZXNzO1xyXG4gICAgbGkuYXBwZW5kKGFkZHJlc3MpO1xyXG5cclxuICAgIHJldHVybiBsaVxyXG59XHJcblxyXG4vKipcclxuICogQWRkIG1hcmtlcnMgZm9yIGN1cnJlbnQgcmVzdGF1cmFudHMgdG8gdGhlIG1hcC5cclxuICovXHJcbmNvbnN0IGFkZE1hcmtlcnNUb01hcCA9IChyZXN0YXVyYW50cyA9IHNlbGYucmVzdGF1cmFudHMpID0+IHtcclxuICAgIHJlc3RhdXJhbnRzLmZvckVhY2gocmVzdGF1cmFudCA9PiB7XHJcbiAgICAgICAgLy8gQWRkIG1hcmtlciB0byB0aGUgbWFwXHJcbiAgICAgICAgY29uc3QgbWFya2VyID0gREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBzZWxmLm1hcCk7XHJcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCAnY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gbWFya2VyLnVybFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNlbGYubWFya2Vycy5wdXNoKG1hcmtlcik7XHJcbiAgICB9KTtcclxufVxyXG4iXX0=
