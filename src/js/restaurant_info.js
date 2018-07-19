import './../css/styles.css';
import {addImageSourceToPicture, imageNamesBySize, getGoogleMapsApi, getLazyLoadPlugin} from './helper.js';
import DBHelper from './dbhelper.js';

let restaurant;
var map;

document.addEventListener('DOMContentLoaded', (event) => {
    fetchRestaurantFromURL(error => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            fillRestaurantHTML();
            fillBreadcrumb();

            // Include LazyLoad plugin
            getLazyLoadPlugin();

            // Include maps api dynamically only after everything else has been done
            getGoogleMapsApi();
        }
    });
});

// Toggle 'mark as favorite' toggle and add the appropriate styles and aria-label
// depending on whether restaurant is favorite or not
document.getElementById('restaurant-isfavorite').addEventListener('click', (event) => {
    const isfavoriteButton = document.getElementById('restaurant-isfavorite');
    const isfavoriteIcon = document.getElementById('restaurant-isfavorite-icon');
    const id = getParameterByName('id');
    if (!isfavoriteButton.classList.contains('selected')) {
        // Favorite restaurant and update server and idb
        DBHelper.favoriteRestaurantById(id)
                .then(() => {
                    isfavoriteIcon.classList.add('fas');
                    isfavoriteIcon.classList.remove('far');
                    isfavoriteButton.classList.add('selected');
                    isfavoriteButton.setAttribute('aria-label', 'Unfavorite restaurant');
                }, (msg) => console.log(msg));
    } else {
        // Unavorite restaurant and update server and idb
        DBHelper.unfavoriteRestaurantById(id)
                .then(() => {
                    isfavoriteIcon.classList.add('far');
                    isfavoriteIcon.classList.remove('fas');
                    isfavoriteButton.classList.remove('selected');
                    isfavoriteButton.setAttribute('aria-label', 'Favorite restaurant');
                }, (msg) => console.log(msg));
    }
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: self.restaurant.latlng,
        scrollwheel: false
    });

    // Add markers to the map after being initialized
    DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null);
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL'
        callback(error);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }

            callback(null);
        });
    }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img lazy';
    image.alt = restaurant.name;

    const imageFilename = DBHelper.imageUrlForRestaurant(restaurant);
    if (imageFilename == 'noimg') {
        const restaurantImgSourcesPicture = document.getElementById('restaurant-img-sources');
        // Remove sources and image from picture to add the noimg sources
        while (restaurantImgSourcesPicture.firstChild) {
            restaurantImgSourcesPicture.removeChild(restaurantImgSourcesPicture.firstChild);
        }

// If restaurant has not an image, display a no image svg
// and use its corresponding png as a fallback.
// Author of the noimg.svg and noimg.png is credited at page's footer.
        const noImgFallback = `${imageFilename}.png`;
        addImageSourceToPicture(restaurantImgSourcesPicture, `${imageFilename}.svg`);
        addImageSourceToPicture(restaurantImgSourcesPicture, noImgFallback);

        image.setAttribute('data-src', noImgFallback);
        image.className += ' noimg';

        restaurantImgSourcesPicture.append(image);
        // TODO: Fix noimg png fallback in IE
    } else {
// get all possible names of an image depending on its size (small, medium, large)
        const imagesResized = imageNamesBySize(imageFilename);

        // assign srcset attribute for medium picture source (medium screens)
        const restaurantImgMedium = document.getElementById('restaurant-img-medium');
        restaurantImgMedium.setAttribute('data-srcset', imagesResized.medium);

        // assign srcset attribute for large picture source (medium screens)
        const restaurantImgMediumLarge = document.getElementById('restaurant-img-medium-large');
        restaurantImgMediumLarge.setAttribute('data-srcset', imagesResized.large);

        // assign srcset attribute for large picture source (large screens)
        const restaurantImgLarge = document.getElementById('restaurant-img-large');
        restaurantImgLarge.setAttribute('data-srcset', `${imagesResized.medium} 1x, ${imagesResized.large} 2x`);

        image.setAttribute('data-src', imagesResized.small); // small image by default
    }

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;
    cuisine.setAttribute('aria-label', `Restaurant cuisine type ${restaurant.cuisine_type}`);

    // Stylize 'mark as favorite' toggle depending on whether restaurant is favorite or not
    // and add the appropriate aria-label
    const isfavoriteButton = document.getElementById('restaurant-isfavorite');
    if (restaurant.is_favorite) {
        const isfavoriteIcon = document.getElementById('restaurant-isfavorite-icon');
        isfavoriteButton.classList.add('selected');
        isfavoriteButton.setAttribute('aria-label', 'Unfavorite restaurant');
        isfavoriteIcon.classList.remove('far');
        isfavoriteIcon.classList.add('fas');
    } else {
        isfavoriteButton.setAttribute('aria-label', 'Favorite restaurant');
    }

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
// fill reviews
    fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
}
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById('reviews-container');
    container.setAttribute('aria-labelledby', 'reviews-heading');

    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    title.id = 'reviews-heading';
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = review.date;
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    li.tabIndex = 0;

    return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');

    const li = document.createElement('li');
    breadcrumb.appendChild(li);

    const a = document.createElement('a');
    a.href = '#';
    a.innerHTML = restaurant.name;
    a.setAttribute('aria-current', 'page');
    li.appendChild(a);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
            results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
