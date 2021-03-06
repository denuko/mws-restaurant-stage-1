import './../css/styles.css';
import {addImageSourceToPicture, imageNamesBySize, getGoogleMapsApi, getLazyLoadPlugin} from './helper.js';
import DBHelper from './dbhelper.js';

let restaurants;
let neighborhoods = [];
let cuisines = [];
var map
var markers = []

/**
 * Fetch restaurants as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    updateRestaurants();
});
document.getElementById('cuisines-select').addEventListener('change', (event) => {
    updateRestaurants();
});
document.getElementById('neighborhoods-select').addEventListener('change', (event) => {
    updateRestaurants();
});

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    let loc = {
        lat: 40.722216,
        lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
    });

    // Add markers to the map after being initialized
    addMarkersToMap();
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
            // Include LazyLoad plugin
            getLazyLoadPlugin();
            // Include maps api dynamically only after everything else has been done
            getGoogleMapsApi();
        }
    })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    if (self.markers) {
        self.markers.forEach(m => m.setMap(null));
    }
    self.markers = [];
    self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        if (DBHelper.addRestaurants()) {
            DBHelper.addRestaurantToDatabase(restaurant);
        }
        ul.append(createRestaurantHTML(restaurant));

        if (!self.neighborhoods) {
            self.neighborhoods = [];
        }
        if (!self.neighborhoods.includes(restaurant.neighborhood)) {
            self.neighborhoods.push(restaurant.neighborhood);
        }

        if (!self.cuisines) {
            self.cuisines = [];
        }
        if (!self.cuisines.includes(restaurant.cuisine_type)) {
            self.cuisines.push(restaurant.cuisine_type);
        }
    });

    fillNeighborhoodsHTML();
    fillCuisinesHTML();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
    const li = document.createElement('li');

    // create picture element for restaurant image in restaurant list
    const picture = document.createElement('picture');
    const image = document.createElement('img');
    image.className = 'restaurant-img lazy';
    image.alt = restaurant.name;

    const imageFilename = DBHelper.imageUrlForRestaurant(restaurant);
    if (imageFilename == 'noimg') {
        // If restaurant has not an image, display a no image svg
        // and use its corresponding png as a fallback.
        // Author of the noimg.svg and noimg.png is credited at page's footer.
        const noImgFallback = `${imageFilename}.png`;
        addImageSourceToPicture(picture, `${imageFilename}.svg`);
        addImageSourceToPicture(picture, noImgFallback);

        image.setAttribute('data-src', noImgFallback);
        image.className += ' noimg';
        // TODO: Fix noimg png fallback in IE
    } else {
        // get all possible names of an image depending on its size (small, medium, large)
        const imagesResized = imageNamesBySize(imageFilename);
        // add source to picture element for medium screens
        addImageSourceToPicture(picture, imagesResized.medium, '(min-width: 363px) and (max-width:479px)');

        image.setAttribute('data-src', imagesResized.small);
    }

    picture.append(image);
    li.append(picture);

    const name = document.createElement('h3');
    li.append(name);

    const more = document.createElement('a');
    more.href = DBHelper.urlForRestaurant(restaurant);
    more.innerHTML = restaurant.name;
    more.tabIndex = 0;
    name.append(more);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    return li
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
        google.maps.event.addListener(marker, 'click', () => {
            window.location.href = marker.url
        });
        self.markers.push(marker);
    });
}
