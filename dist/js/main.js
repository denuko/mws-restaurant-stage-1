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
        if (DBHelper.addRestaurants()) {
            DBHelper.addRestaurantToDatabase(restaurant);
        }
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsicmVzdGF1cmFudHMiLCJuZWlnaGJvcmhvb2RzIiwiY3Vpc2luZXMiLCJtYXAiLCJtYXJrZXJzIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJmZXRjaE5laWdoYm9yaG9vZHMiLCJmZXRjaEN1aXNpbmVzIiwiREJIZWxwZXIiLCJlcnJvciIsImNvbnNvbGUiLCJzZWxmIiwiZmlsbE5laWdoYm9yaG9vZHNIVE1MIiwic2VsZWN0IiwiZ2V0RWxlbWVudEJ5SWQiLCJmb3JFYWNoIiwib3B0aW9uIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsIm5laWdoYm9yaG9vZCIsInZhbHVlIiwiYXBwZW5kIiwiZmlsbEN1aXNpbmVzSFRNTCIsImN1aXNpbmUiLCJ3aW5kb3ciLCJpbml0TWFwIiwibG9jIiwibGF0IiwibG5nIiwiZ29vZ2xlIiwibWFwcyIsIk1hcCIsInpvb20iLCJjZW50ZXIiLCJzY3JvbGx3aGVlbCIsInVwZGF0ZVJlc3RhdXJhbnRzIiwiY1NlbGVjdCIsIm5TZWxlY3QiLCJjSW5kZXgiLCJzZWxlY3RlZEluZGV4IiwibkluZGV4IiwiZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kIiwicmVzZXRSZXN0YXVyYW50cyIsImZpbGxSZXN0YXVyYW50c0hUTUwiLCJ1bCIsIm0iLCJzZXRNYXAiLCJhZGRSZXN0YXVyYW50cyIsImFkZFJlc3RhdXJhbnRUb0RhdGFiYXNlIiwicmVzdGF1cmFudCIsImNyZWF0ZVJlc3RhdXJhbnRIVE1MIiwiYWRkTWFya2Vyc1RvTWFwIiwibGkiLCJwaWN0dXJlIiwiaW1hZ2UiLCJjbGFzc05hbWUiLCJhbHQiLCJuYW1lIiwiaW1hZ2VGaWxlbmFtZSIsImltYWdlVXJsRm9yUmVzdGF1cmFudCIsIm5vSW1nRmFsbGJhY2siLCJhZGRJbWFnZVNvdXJjZVRvUGljdHVyZSIsInNyYyIsImltYWdlc1Jlc2l6ZWQiLCJpbWFnZU5hbWVzQnlTaXplIiwibWVkaXVtIiwic21hbGwiLCJtb3JlIiwiaHJlZiIsInVybEZvclJlc3RhdXJhbnQiLCJ0YWJJbmRleCIsImFkZHJlc3MiLCJtYXJrZXIiLCJtYXBNYXJrZXJGb3JSZXN0YXVyYW50IiwiYWRkTGlzdGVuZXIiLCJsb2NhdGlvbiIsInVybCIsInB1c2giXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBSUEsb0JBQUo7QUFBQSxJQUNRQyxzQkFEUjtBQUFBLElBRVFDLGlCQUZSO0FBR0EsSUFBSUMsR0FBSjtBQUNBLElBQUlDLFVBQVUsRUFBZDs7QUFFQTs7O0FBR0FDLFNBQVNDLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxVQUFDQyxLQUFELEVBQVc7QUFDckRDO0FBQ0FDO0FBQ0gsQ0FIRDs7QUFLQTs7O0FBR0EsSUFBTUQscUJBQXFCLFNBQXJCQSxrQkFBcUIsR0FBTTtBQUM3QkUsYUFBU0Ysa0JBQVQsQ0FBNEIsVUFBQ0csS0FBRCxFQUFRVixhQUFSLEVBQTBCO0FBQ2xELFlBQUlVLEtBQUosRUFBVztBQUFFO0FBQ1RDLG9CQUFRRCxLQUFSLENBQWNBLEtBQWQ7QUFDSCxTQUZELE1BRU87QUFDSEUsaUJBQUtaLGFBQUwsR0FBcUJBLGFBQXJCO0FBQ0FhO0FBQ0g7QUFDSixLQVBEO0FBUUgsQ0FURDs7QUFXQTs7O0FBR0EsSUFBTUEsd0JBQXdCLFNBQXhCQSxxQkFBd0IsR0FBd0M7QUFBQSxRQUF2Q2IsYUFBdUMsdUVBQXZCWSxLQUFLWixhQUFrQjs7QUFDbEUsUUFBTWMsU0FBU1YsU0FBU1csY0FBVCxDQUF3QixzQkFBeEIsQ0FBZjtBQUNBZixrQkFBY2dCLE9BQWQsQ0FBc0Isd0JBQWdCO0FBQ2xDLFlBQU1DLFNBQVNiLFNBQVNjLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBZjtBQUNBRCxlQUFPRSxTQUFQLEdBQW1CQyxZQUFuQjtBQUNBSCxlQUFPSSxLQUFQLEdBQWVELFlBQWY7QUFDQU4sZUFBT1EsTUFBUCxDQUFjTCxNQUFkO0FBQ0gsS0FMRDtBQU1ILENBUkQ7O0FBVUE7OztBQUdBLElBQU1ULGdCQUFnQixTQUFoQkEsYUFBZ0IsR0FBTTtBQUN4QkMsYUFBU0QsYUFBVCxDQUF1QixVQUFDRSxLQUFELEVBQVFULFFBQVIsRUFBcUI7QUFDeEMsWUFBSVMsS0FBSixFQUFXO0FBQUU7QUFDVEMsb0JBQVFELEtBQVIsQ0FBY0EsS0FBZDtBQUNILFNBRkQsTUFFTztBQUNIRSxpQkFBS1gsUUFBTCxHQUFnQkEsUUFBaEI7QUFDQXNCO0FBQ0g7QUFDSixLQVBEO0FBUUgsQ0FURDs7QUFXQTs7O0FBR0EsSUFBTUEsbUJBQW1CLFNBQW5CQSxnQkFBbUIsR0FBOEI7QUFBQSxRQUE3QnRCLFFBQTZCLHVFQUFsQlcsS0FBS1gsUUFBYTs7QUFDbkQsUUFBTWEsU0FBU1YsU0FBU1csY0FBVCxDQUF3QixpQkFBeEIsQ0FBZjs7QUFFQWQsYUFBU2UsT0FBVCxDQUFpQixtQkFBVztBQUN4QixZQUFNQyxTQUFTYixTQUFTYyxhQUFULENBQXVCLFFBQXZCLENBQWY7QUFDQUQsZUFBT0UsU0FBUCxHQUFtQkssT0FBbkI7QUFDQVAsZUFBT0ksS0FBUCxHQUFlRyxPQUFmO0FBQ0FWLGVBQU9RLE1BQVAsQ0FBY0wsTUFBZDtBQUNILEtBTEQ7QUFNSCxDQVREOztBQVdBOzs7QUFHQVEsT0FBT0MsT0FBUCxHQUFpQixZQUFNO0FBQ25CLFFBQUlDLE1BQU07QUFDTkMsYUFBSyxTQURDO0FBRU5DLGFBQUssQ0FBQztBQUZBLEtBQVY7QUFJQWpCLFNBQUtWLEdBQUwsR0FBVyxJQUFJNEIsT0FBT0MsSUFBUCxDQUFZQyxHQUFoQixDQUFvQjVCLFNBQVNXLGNBQVQsQ0FBd0IsS0FBeEIsQ0FBcEIsRUFBb0Q7QUFDM0RrQixjQUFNLEVBRHFEO0FBRTNEQyxnQkFBUVAsR0FGbUQ7QUFHM0RRLHFCQUFhO0FBSDhDLEtBQXBELENBQVg7QUFLQUM7QUFDSCxDQVhEOztBQWFBOzs7QUFHQSxJQUFNQSxvQkFBb0IsU0FBcEJBLGlCQUFvQixHQUFNO0FBQzVCLFFBQU1DLFVBQVVqQyxTQUFTVyxjQUFULENBQXdCLGlCQUF4QixDQUFoQjtBQUNBLFFBQU11QixVQUFVbEMsU0FBU1csY0FBVCxDQUF3QixzQkFBeEIsQ0FBaEI7O0FBRUEsUUFBTXdCLFNBQVNGLFFBQVFHLGFBQXZCO0FBQ0EsUUFBTUMsU0FBU0gsUUFBUUUsYUFBdkI7O0FBRUEsUUFBTWhCLFVBQVVhLFFBQVFFLE1BQVIsRUFBZ0JsQixLQUFoQztBQUNBLFFBQU1ELGVBQWVrQixRQUFRRyxNQUFSLEVBQWdCcEIsS0FBckM7O0FBRUFaLGFBQVNpQyx1Q0FBVCxDQUFpRGxCLE9BQWpELEVBQTBESixZQUExRCxFQUF3RSxVQUFDVixLQUFELEVBQVFYLFdBQVIsRUFBd0I7QUFDNUYsWUFBSVcsS0FBSixFQUFXO0FBQUU7QUFDVEMsb0JBQVFELEtBQVIsQ0FBY0EsS0FBZDtBQUNILFNBRkQsTUFFTztBQUNIaUMsNkJBQWlCNUMsV0FBakI7QUFDQTZDO0FBQ0g7QUFDSixLQVBEO0FBUUgsQ0FsQkQ7O0FBb0JBOzs7QUFHQSxJQUFNRCxtQkFBbUIsU0FBbkJBLGdCQUFtQixDQUFDNUMsV0FBRCxFQUFpQjtBQUN0QztBQUNBYSxTQUFLYixXQUFMLEdBQW1CLEVBQW5CO0FBQ0EsUUFBTThDLEtBQUt6QyxTQUFTVyxjQUFULENBQXdCLGtCQUF4QixDQUFYO0FBQ0E4QixPQUFHMUIsU0FBSCxHQUFlLEVBQWY7O0FBRUE7QUFDQVAsU0FBS1QsT0FBTCxDQUFhYSxPQUFiLENBQXFCO0FBQUEsZUFBSzhCLEVBQUVDLE1BQUYsQ0FBUyxJQUFULENBQUw7QUFBQSxLQUFyQjtBQUNBbkMsU0FBS1QsT0FBTCxHQUFlLEVBQWY7QUFDQVMsU0FBS2IsV0FBTCxHQUFtQkEsV0FBbkI7QUFDSCxDQVZEOztBQVlBOzs7QUFHQSxJQUFNNkMsc0JBQXNCLFNBQXRCQSxtQkFBc0IsR0FBb0M7QUFBQSxRQUFuQzdDLFdBQW1DLHVFQUFyQmEsS0FBS2IsV0FBZ0I7O0FBQzVELFFBQU04QyxLQUFLekMsU0FBU1csY0FBVCxDQUF3QixrQkFBeEIsQ0FBWDtBQUNBaEIsZ0JBQVlpQixPQUFaLENBQW9CLHNCQUFjO0FBQzlCLFlBQUlQLFNBQVN1QyxjQUFULEVBQUosRUFBK0I7QUFDM0J2QyxxQkFBU3dDLHVCQUFULENBQWlDQyxVQUFqQztBQUNIO0FBQ0RMLFdBQUd2QixNQUFILENBQVU2QixxQkFBcUJELFVBQXJCLENBQVY7QUFDSCxLQUxEO0FBTUFFO0FBQ0gsQ0FURDs7QUFXQTs7O0FBR0EsSUFBTUQsdUJBQXVCLFNBQXZCQSxvQkFBdUIsQ0FBQ0QsVUFBRCxFQUFnQjtBQUN6QyxRQUFNRyxLQUFLakQsU0FBU2MsYUFBVCxDQUF1QixJQUF2QixDQUFYOztBQUVBO0FBQ0EsUUFBTW9DLFVBQVVsRCxTQUFTYyxhQUFULENBQXVCLFNBQXZCLENBQWhCO0FBQ0EsUUFBTXFDLFFBQVFuRCxTQUFTYyxhQUFULENBQXVCLEtBQXZCLENBQWQ7QUFDQXFDLFVBQU1DLFNBQU4sR0FBa0IsZ0JBQWxCO0FBQ0FELFVBQU1FLEdBQU4sR0FBWVAsV0FBV1EsSUFBdkI7O0FBRUEsUUFBTUMsZ0JBQWdCbEQsU0FBU21ELHFCQUFULENBQStCVixVQUEvQixDQUF0QjtBQUNBLFFBQUlTLGlCQUFpQixPQUFyQixFQUE4QjtBQUMxQjtBQUNBO0FBQ0E7QUFDQSxZQUFNRSxnQkFBbUJGLGFBQW5CLFNBQU47QUFDQUcsZ0NBQXdCUixPQUF4QixFQUFvQ0ssYUFBcEM7QUFDQUcsZ0NBQXdCUixPQUF4QixFQUFpQ08sYUFBakM7O0FBRUFOLGNBQU1RLEdBQU4sR0FBWUYsYUFBWjtBQUNBTixjQUFNQyxTQUFOLElBQW1CLFFBQW5CO0FBQ0E7QUFDQTtBQUNBO0FBQ0gsS0FiRCxNQWFPO0FBQ0g7QUFDQSxZQUFNUSxnQkFBZ0JDLGlCQUFpQk4sYUFBakIsQ0FBdEI7QUFDQTtBQUNBRyxnQ0FBd0JSLE9BQXhCLEVBQWlDVSxjQUFjRSxNQUEvQyxFQUF1RCwwQ0FBdkQ7O0FBRUFYLGNBQU1RLEdBQU4sR0FBWUMsY0FBY0csS0FBMUIsQ0FORyxDQU1nQztBQUN0Qzs7QUFFRGIsWUFBUWhDLE1BQVIsQ0FBZWlDLEtBQWY7QUFDQUYsT0FBRy9CLE1BQUgsQ0FBVWdDLE9BQVY7O0FBRUEsUUFBTUksT0FBT3RELFNBQVNjLGFBQVQsQ0FBdUIsSUFBdkIsQ0FBYjtBQUNBbUMsT0FBRy9CLE1BQUgsQ0FBVW9DLElBQVY7O0FBRUEsUUFBTVUsT0FBT2hFLFNBQVNjLGFBQVQsQ0FBdUIsR0FBdkIsQ0FBYjtBQUNBa0QsU0FBS0MsSUFBTCxHQUFZNUQsU0FBUzZELGdCQUFULENBQTBCcEIsVUFBMUIsQ0FBWjtBQUNBa0IsU0FBS2pELFNBQUwsR0FBaUIrQixXQUFXUSxJQUE1QjtBQUNBVSxTQUFLRyxRQUFMLEdBQWdCLENBQWhCO0FBQ0FiLFNBQUtwQyxNQUFMLENBQVk4QyxJQUFaOztBQUVBLFFBQU1oRCxlQUFlaEIsU0FBU2MsYUFBVCxDQUF1QixHQUF2QixDQUFyQjtBQUNBRSxpQkFBYUQsU0FBYixHQUF5QitCLFdBQVc5QixZQUFwQztBQUNBaUMsT0FBRy9CLE1BQUgsQ0FBVUYsWUFBVjs7QUFFQSxRQUFNb0QsVUFBVXBFLFNBQVNjLGFBQVQsQ0FBdUIsR0FBdkIsQ0FBaEI7QUFDQXNELFlBQVFyRCxTQUFSLEdBQW9CK0IsV0FBV3NCLE9BQS9CO0FBQ0FuQixPQUFHL0IsTUFBSCxDQUFVa0QsT0FBVjs7QUFFQSxXQUFPbkIsRUFBUDtBQUNILENBckREOztBQXVEQTs7O0FBR0EsSUFBTUQsa0JBQWtCLFNBQWxCQSxlQUFrQixHQUFvQztBQUFBLFFBQW5DckQsV0FBbUMsdUVBQXJCYSxLQUFLYixXQUFnQjs7QUFDeERBLGdCQUFZaUIsT0FBWixDQUFvQixzQkFBYztBQUM5QjtBQUNBLFlBQU15RCxTQUFTaEUsU0FBU2lFLHNCQUFULENBQWdDeEIsVUFBaEMsRUFBNEN0QyxLQUFLVixHQUFqRCxDQUFmO0FBQ0E0QixlQUFPQyxJQUFQLENBQVl6QixLQUFaLENBQWtCcUUsV0FBbEIsQ0FBOEJGLE1BQTlCLEVBQXNDLE9BQXRDLEVBQStDLFlBQU07QUFDakRoRCxtQkFBT21ELFFBQVAsQ0FBZ0JQLElBQWhCLEdBQXVCSSxPQUFPSSxHQUE5QjtBQUNILFNBRkQ7QUFHQWpFLGFBQUtULE9BQUwsQ0FBYTJFLElBQWIsQ0FBa0JMLE1BQWxCO0FBQ0gsS0FQRDtBQVFILENBVEQiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImxldCByZXN0YXVyYW50cyxcclxuICAgICAgICBuZWlnaGJvcmhvb2RzLFxyXG4gICAgICAgIGN1aXNpbmVzXHJcbnZhciBtYXBcclxudmFyIG1hcmtlcnMgPSBbXVxyXG5cclxuLyoqXHJcbiAqIEZldGNoIG5laWdoYm9yaG9vZHMgYW5kIGN1aXNpbmVzIGFzIHNvb24gYXMgdGhlIHBhZ2UgaXMgbG9hZGVkLlxyXG4gKi9cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIChldmVudCkgPT4ge1xyXG4gICAgZmV0Y2hOZWlnaGJvcmhvb2RzKCk7XHJcbiAgICBmZXRjaEN1aXNpbmVzKCk7XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIGFuZCBzZXQgdGhlaXIgSFRNTC5cclxuICovXHJcbmNvbnN0IGZldGNoTmVpZ2hib3Job29kcyA9ICgpID0+IHtcclxuICAgIERCSGVscGVyLmZldGNoTmVpZ2hib3Job29kcygoZXJyb3IsIG5laWdoYm9yaG9vZHMpID0+IHtcclxuICAgICAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yXHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNlbGYubmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHM7XHJcbiAgICAgICAgICAgIGZpbGxOZWlnaGJvcmhvb2RzSFRNTCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0IG5laWdoYm9yaG9vZHMgSFRNTC5cclxuICovXHJcbmNvbnN0IGZpbGxOZWlnaGJvcmhvb2RzSFRNTCA9IChuZWlnaGJvcmhvb2RzID0gc2VsZi5uZWlnaGJvcmhvb2RzKSA9PiB7XHJcbiAgICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmVpZ2hib3Job29kcy1zZWxlY3QnKTtcclxuICAgIG5laWdoYm9yaG9vZHMuZm9yRWFjaChuZWlnaGJvcmhvb2QgPT4ge1xyXG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xyXG4gICAgICAgIG9wdGlvbi5pbm5lckhUTUwgPSBuZWlnaGJvcmhvb2Q7XHJcbiAgICAgICAgb3B0aW9uLnZhbHVlID0gbmVpZ2hib3Job29kO1xyXG4gICAgICAgIHNlbGVjdC5hcHBlbmQob3B0aW9uKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogRmV0Y2ggYWxsIGN1aXNpbmVzIGFuZCBzZXQgdGhlaXIgSFRNTC5cclxuICovXHJcbmNvbnN0IGZldGNoQ3Vpc2luZXMgPSAoKSA9PiB7XHJcbiAgICBEQkhlbHBlci5mZXRjaEN1aXNpbmVzKChlcnJvciwgY3Vpc2luZXMpID0+IHtcclxuICAgICAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yIVxyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZWxmLmN1aXNpbmVzID0gY3Vpc2luZXM7XHJcbiAgICAgICAgICAgIGZpbGxDdWlzaW5lc0hUTUwoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldCBjdWlzaW5lcyBIVE1MLlxyXG4gKi9cclxuY29uc3QgZmlsbEN1aXNpbmVzSFRNTCA9IChjdWlzaW5lcyA9IHNlbGYuY3Vpc2luZXMpID0+IHtcclxuICAgIGNvbnN0IHNlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdWlzaW5lcy1zZWxlY3QnKTtcclxuXHJcbiAgICBjdWlzaW5lcy5mb3JFYWNoKGN1aXNpbmUgPT4ge1xyXG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xyXG4gICAgICAgIG9wdGlvbi5pbm5lckhUTUwgPSBjdWlzaW5lO1xyXG4gICAgICAgIG9wdGlvbi52YWx1ZSA9IGN1aXNpbmU7XHJcbiAgICAgICAgc2VsZWN0LmFwcGVuZChvcHRpb24pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbml0aWFsaXplIEdvb2dsZSBtYXAsIGNhbGxlZCBmcm9tIEhUTUwuXHJcbiAqL1xyXG53aW5kb3cuaW5pdE1hcCA9ICgpID0+IHtcclxuICAgIGxldCBsb2MgPSB7XHJcbiAgICAgICAgbGF0OiA0MC43MjIyMTYsXHJcbiAgICAgICAgbG5nOiAtNzMuOTg3NTAxXHJcbiAgICB9O1xyXG4gICAgc2VsZi5tYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKSwge1xyXG4gICAgICAgIHpvb206IDEyLFxyXG4gICAgICAgIGNlbnRlcjogbG9jLFxyXG4gICAgICAgIHNjcm9sbHdoZWVsOiBmYWxzZVxyXG4gICAgfSk7XHJcbiAgICB1cGRhdGVSZXN0YXVyYW50cygpO1xyXG59XHJcblxyXG4vKipcclxuICogVXBkYXRlIHBhZ2UgYW5kIG1hcCBmb3IgY3VycmVudCByZXN0YXVyYW50cy5cclxuICovXHJcbmNvbnN0IHVwZGF0ZVJlc3RhdXJhbnRzID0gKCkgPT4ge1xyXG4gICAgY29uc3QgY1NlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdWlzaW5lcy1zZWxlY3QnKTtcclxuICAgIGNvbnN0IG5TZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmVpZ2hib3Job29kcy1zZWxlY3QnKTtcclxuXHJcbiAgICBjb25zdCBjSW5kZXggPSBjU2VsZWN0LnNlbGVjdGVkSW5kZXg7XHJcbiAgICBjb25zdCBuSW5kZXggPSBuU2VsZWN0LnNlbGVjdGVkSW5kZXg7XHJcblxyXG4gICAgY29uc3QgY3Vpc2luZSA9IGNTZWxlY3RbY0luZGV4XS52YWx1ZTtcclxuICAgIGNvbnN0IG5laWdoYm9yaG9vZCA9IG5TZWxlY3RbbkluZGV4XS52YWx1ZTtcclxuXHJcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kLCAoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzZXRSZXN0YXVyYW50cyhyZXN0YXVyYW50cyk7XHJcbiAgICAgICAgICAgIGZpbGxSZXN0YXVyYW50c0hUTUwoKTtcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG4vKipcclxuICogQ2xlYXIgY3VycmVudCByZXN0YXVyYW50cywgdGhlaXIgSFRNTCBhbmQgcmVtb3ZlIHRoZWlyIG1hcCBtYXJrZXJzLlxyXG4gKi9cclxuY29uc3QgcmVzZXRSZXN0YXVyYW50cyA9IChyZXN0YXVyYW50cykgPT4ge1xyXG4gICAgLy8gUmVtb3ZlIGFsbCByZXN0YXVyYW50c1xyXG4gICAgc2VsZi5yZXN0YXVyYW50cyA9IFtdO1xyXG4gICAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudHMtbGlzdCcpO1xyXG4gICAgdWwuaW5uZXJIVE1MID0gJyc7XHJcblxyXG4gICAgLy8gUmVtb3ZlIGFsbCBtYXAgbWFya2Vyc1xyXG4gICAgc2VsZi5tYXJrZXJzLmZvckVhY2gobSA9PiBtLnNldE1hcChudWxsKSk7XHJcbiAgICBzZWxmLm1hcmtlcnMgPSBbXTtcclxuICAgIHNlbGYucmVzdGF1cmFudHMgPSByZXN0YXVyYW50cztcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhbGwgcmVzdGF1cmFudHMgSFRNTCBhbmQgYWRkIHRoZW0gdG8gdGhlIHdlYnBhZ2UuXHJcbiAqL1xyXG5jb25zdCBmaWxsUmVzdGF1cmFudHNIVE1MID0gKHJlc3RhdXJhbnRzID0gc2VsZi5yZXN0YXVyYW50cykgPT4ge1xyXG4gICAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudHMtbGlzdCcpO1xyXG4gICAgcmVzdGF1cmFudHMuZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgICAgICBpZiAoREJIZWxwZXIuYWRkUmVzdGF1cmFudHMoKSkge1xyXG4gICAgICAgICAgICBEQkhlbHBlci5hZGRSZXN0YXVyYW50VG9EYXRhYmFzZShyZXN0YXVyYW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdWwuYXBwZW5kKGNyZWF0ZVJlc3RhdXJhbnRIVE1MKHJlc3RhdXJhbnQpKTtcclxuICAgIH0pO1xyXG4gICAgYWRkTWFya2Vyc1RvTWFwKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBIVE1MLlxyXG4gKi9cclxuY29uc3QgY3JlYXRlUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCkgPT4ge1xyXG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG5cclxuICAgIC8vIGNyZWF0ZSBwaWN0dXJlIGVsZW1lbnQgZm9yIHJlc3RhdXJhbnQgaW1hZ2UgaW4gcmVzdGF1cmFudCBsaXN0XHJcbiAgICBjb25zdCBwaWN0dXJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncGljdHVyZScpO1xyXG4gICAgY29uc3QgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICAgIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZyc7XHJcbiAgICBpbWFnZS5hbHQgPSByZXN0YXVyYW50Lm5hbWU7XHJcblxyXG4gICAgY29uc3QgaW1hZ2VGaWxlbmFtZSA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICAgIGlmIChpbWFnZUZpbGVuYW1lID09ICdub2ltZycpIHtcclxuICAgICAgICAvLyBJZiByZXN0YXVyYW50IGhhcyBub3QgYW4gaW1hZ2UsIGRpc3BsYXkgYSBubyBpbWFnZSBzdmdcclxuICAgICAgICAvLyBhbmQgdXNlIGl0cyBjb3JyZXNwb25kaW5nIHBuZyBhcyBhIGZhbGxiYWNrLlxyXG4gICAgICAgIC8vIEF1dGhvciBvZiB0aGUgbm9pbWcuc3ZnIGFuZCBub2ltZy5wbmcgaXMgY3JlZGl0ZWQgYXQgcGFnZSdzIGZvb3Rlci5cclxuICAgICAgICBjb25zdCBub0ltZ0ZhbGxiYWNrID0gYCR7aW1hZ2VGaWxlbmFtZX0ucG5nYDtcclxuICAgICAgICBhZGRJbWFnZVNvdXJjZVRvUGljdHVyZShwaWN0dXJlLCBgJHtpbWFnZUZpbGVuYW1lfS5zdmdgKTtcclxuICAgICAgICBhZGRJbWFnZVNvdXJjZVRvUGljdHVyZShwaWN0dXJlLCBub0ltZ0ZhbGxiYWNrKTtcclxuXHJcbiAgICAgICAgaW1hZ2Uuc3JjID0gbm9JbWdGYWxsYmFjaztcclxuICAgICAgICBpbWFnZS5jbGFzc05hbWUgKz0gJyBub2ltZyc7XHJcbiAgICAgICAgLy8gVE9ETzogRml4IG5vaW1nIHN2ZyByZXNwb25zaXZlIGhlaWdodFxyXG4gICAgICAgIC8vIFRPRE86IEZpeCBub2ltZyBwbmcgZmFsbGJhY2sgaW4gSUVcclxuICAgICAgICAvLyBUT0RPOiBDYWNoZSBub2ltZyBzdmcgYW5kIHBuZ1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBnZXQgYWxsIHBvc3NpYmxlIG5hbWVzIG9mIGFuIGltYWdlIGRlcGVuZGluZyBvbiBpdHMgc2l6ZSAoc21hbGwsIG1lZGl1bSwgbGFyZ2UpXHJcbiAgICAgICAgY29uc3QgaW1hZ2VzUmVzaXplZCA9IGltYWdlTmFtZXNCeVNpemUoaW1hZ2VGaWxlbmFtZSk7XHJcbiAgICAgICAgLy8gYWRkIHNvdXJjZSB0byBwaWN0dXJlIGVsZW1lbnQgZm9yIG1lZGl1bSBzY3JlZW5zXHJcbiAgICAgICAgYWRkSW1hZ2VTb3VyY2VUb1BpY3R1cmUocGljdHVyZSwgaW1hZ2VzUmVzaXplZC5tZWRpdW0sICcobWluLXdpZHRoOiAzNjNweCkgYW5kIChtYXgtd2lkdGg6NDc5cHgpJyk7XHJcblxyXG4gICAgICAgIGltYWdlLnNyYyA9IGltYWdlc1Jlc2l6ZWQuc21hbGw7ICAgLy8gc21hbGwgaW1hZ2UgYnkgZGVmYXVsdFxyXG4gICAgfVxyXG5cclxuICAgIHBpY3R1cmUuYXBwZW5kKGltYWdlKTtcclxuICAgIGxpLmFwcGVuZChwaWN0dXJlKTtcclxuXHJcbiAgICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDMnKTtcclxuICAgIGxpLmFwcGVuZChuYW1lKTtcclxuXHJcbiAgICBjb25zdCBtb3JlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgbW9yZS5ocmVmID0gREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICAgIG1vcmUuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xyXG4gICAgbW9yZS50YWJJbmRleCA9IDA7XHJcbiAgICBuYW1lLmFwcGVuZChtb3JlKTtcclxuXHJcbiAgICBjb25zdCBuZWlnaGJvcmhvb2QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBuZWlnaGJvcmhvb2QuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uZWlnaGJvcmhvb2Q7XHJcbiAgICBsaS5hcHBlbmQobmVpZ2hib3Job29kKTtcclxuXHJcbiAgICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgYWRkcmVzcy5pbm5lckhUTUwgPSByZXN0YXVyYW50LmFkZHJlc3M7XHJcbiAgICBsaS5hcHBlbmQoYWRkcmVzcyk7XHJcblxyXG4gICAgcmV0dXJuIGxpXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBZGQgbWFya2VycyBmb3IgY3VycmVudCByZXN0YXVyYW50cyB0byB0aGUgbWFwLlxyXG4gKi9cclxuY29uc3QgYWRkTWFya2Vyc1RvTWFwID0gKHJlc3RhdXJhbnRzID0gc2VsZi5yZXN0YXVyYW50cykgPT4ge1xyXG4gICAgcmVzdGF1cmFudHMuZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgICAgICAvLyBBZGQgbWFya2VyIHRvIHRoZSBtYXBcclxuICAgICAgICBjb25zdCBtYXJrZXIgPSBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHNlbGYubWFwKTtcclxuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsICdjbGljaycsICgpID0+IHtcclxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBtYXJrZXIudXJsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc2VsZi5tYXJrZXJzLnB1c2gobWFya2VyKTtcclxuICAgIH0pO1xyXG59XHJcbiJdfQ==
