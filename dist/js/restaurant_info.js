'use strict';

var restaurant = void 0;
var map;

document.addEventListener('DOMContentLoaded', function (event) {
    fetchRestaurantFromURL(function (error) {
        if (error) {
            // Got an error!
            console.error(error);
        } else {
            fillRestaurantHTML();
            fillBreadcrumb();

            // Include maps api dynamically only after everything else has been done
            getGoogleMapsApi();
        }
    });
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = function () {
    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: self.restaurant.latlng,
        scrollwheel: false
    });

    // Add markers to the map after being initialized
    DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
};

/**
 * Get current restaurant from page URL.
 */
var fetchRestaurantFromURL = function fetchRestaurantFromURL(callback) {
    if (self.restaurant) {
        // restaurant already fetched!
        callback(null);
        return;
    }
    var id = getParameterByName('id');
    if (!id) {
        // no id found in URL
        error = 'No restaurant id in URL';
        callback(error);
    } else {
        DBHelper.fetchRestaurantById(id, function (error, restaurant) {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }

            callback(null);
        });
    }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
var fillRestaurantHTML = function fillRestaurantHTML() {
    var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

    var name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    var address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    var image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.alt = restaurant.name;

    var imageFilename = DBHelper.imageUrlForRestaurant(restaurant);
    if (imageFilename == 'noimg') {
        var restaurantImgSourcesPicture = document.getElementById('restaurant-img-sources');
        // Remove sources and image from picture to add the noimg sources
        while (restaurantImgSourcesPicture.firstChild) {
            restaurantImgSourcesPicture.removeChild(restaurantImgSourcesPicture.firstChild);
        }

        // If restaurant has not an image, display a no image svg
        // and use its corresponding png as a fallback.
        // Author of the noimg.svg and noimg.png is credited at page's footer.
        var noImgFallback = imageFilename + '.png';
        addImageSourceToPicture(restaurantImgSourcesPicture, imageFilename + '.svg');
        addImageSourceToPicture(restaurantImgSourcesPicture, noImgFallback);

        image.src = noImgFallback;
        image.className += ' noimg';

        restaurantImgSourcesPicture.append(image);
        // TODO: Fix noimg svg responsive height
        // TODO: Fix noimg png fallback in IE
        // TODO: Cache noimg svg and png
    } else {
        // get all possible names of an image depending on its size (small, medium, large)
        var imagesResized = imageNamesBySize(imageFilename);

        // assign srcset attribute for medium picture source (medium screens)
        var restaurantImgMedium = document.getElementById('restaurant-img-medium');
        restaurantImgMedium.srcset = imagesResized.medium;

        // assign srcset attribute for large picture source (medium screens)
        var restaurantImgMediumLarge = document.getElementById('restaurant-img-medium-large');
        restaurantImgMediumLarge.srcset = imagesResized.large;

        // assign srcset attribute for large picture source (large screens)
        var restaurantImgLarge = document.getElementById('restaurant-img-large');
        restaurantImgLarge.srcset = imagesResized.medium + ' 1x, ' + imagesResized.large + ' 2x';

        image.src = imagesResized.small; // small image by default
    }

    var cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;
    cuisine.setAttribute('aria-label', 'Restaurant cuisine type ' + restaurant.cuisine_type);

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
var fillRestaurantHoursHTML = function fillRestaurantHoursHTML() {
    var operatingHours = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.operating_hours;

    var hours = document.getElementById('restaurant-hours');
    for (var key in operatingHours) {
        var row = document.createElement('tr');

        var day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        var time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
var fillReviewsHTML = function fillReviewsHTML() {
    var reviews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.reviews;

    var container = document.getElementById('reviews-container');
    container.setAttribute('aria-labelledby', 'reviews-heading');

    var title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    title.id = 'reviews-heading';
    container.appendChild(title);

    if (!reviews) {
        var noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    var ul = document.getElementById('reviews-list');
    reviews.forEach(function (review) {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
var createReviewHTML = function createReviewHTML(review) {
    var li = document.createElement('li');
    var name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    var date = document.createElement('p');
    date.innerHTML = review.date;
    li.appendChild(date);

    var rating = document.createElement('p');
    rating.innerHTML = 'Rating: ' + review.rating;
    li.appendChild(rating);

    var comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    li.tabIndex = 0;

    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
var fillBreadcrumb = function fillBreadcrumb() {
    var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

    var breadcrumb = document.getElementById('breadcrumb');

    var li = document.createElement('li');
    breadcrumb.appendChild(li);

    var a = document.createElement('a');
    a.href = '#';
    a.innerHTML = restaurant.name;
    a.setAttribute('aria-current', 'page');
    li.appendChild(a);
};

/**
 * Get a parameter by name from page URL.
 */
var getParameterByName = function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwibWFwIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJmZXRjaFJlc3RhdXJhbnRGcm9tVVJMIiwiZXJyb3IiLCJjb25zb2xlIiwiZmlsbFJlc3RhdXJhbnRIVE1MIiwiZmlsbEJyZWFkY3J1bWIiLCJnZXRHb29nbGVNYXBzQXBpIiwid2luZG93IiwiaW5pdE1hcCIsInNlbGYiLCJnb29nbGUiLCJtYXBzIiwiTWFwIiwiZ2V0RWxlbWVudEJ5SWQiLCJ6b29tIiwiY2VudGVyIiwibGF0bG5nIiwic2Nyb2xsd2hlZWwiLCJEQkhlbHBlciIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJjYWxsYmFjayIsImlkIiwiZ2V0UGFyYW1ldGVyQnlOYW1lIiwiZmV0Y2hSZXN0YXVyYW50QnlJZCIsIm5hbWUiLCJpbm5lckhUTUwiLCJhZGRyZXNzIiwiaW1hZ2UiLCJjbGFzc05hbWUiLCJhbHQiLCJpbWFnZUZpbGVuYW1lIiwiaW1hZ2VVcmxGb3JSZXN0YXVyYW50IiwicmVzdGF1cmFudEltZ1NvdXJjZXNQaWN0dXJlIiwiZmlyc3RDaGlsZCIsInJlbW92ZUNoaWxkIiwibm9JbWdGYWxsYmFjayIsImFkZEltYWdlU291cmNlVG9QaWN0dXJlIiwic3JjIiwiYXBwZW5kIiwiaW1hZ2VzUmVzaXplZCIsImltYWdlTmFtZXNCeVNpemUiLCJyZXN0YXVyYW50SW1nTWVkaXVtIiwic3Jjc2V0IiwibWVkaXVtIiwicmVzdGF1cmFudEltZ01lZGl1bUxhcmdlIiwibGFyZ2UiLCJyZXN0YXVyYW50SW1nTGFyZ2UiLCJzbWFsbCIsImN1aXNpbmUiLCJjdWlzaW5lX3R5cGUiLCJzZXRBdHRyaWJ1dGUiLCJvcGVyYXRpbmdfaG91cnMiLCJmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCIsImZpbGxSZXZpZXdzSFRNTCIsIm9wZXJhdGluZ0hvdXJzIiwiaG91cnMiLCJrZXkiLCJyb3ciLCJjcmVhdGVFbGVtZW50IiwiZGF5IiwiYXBwZW5kQ2hpbGQiLCJ0aW1lIiwicmV2aWV3cyIsImNvbnRhaW5lciIsInRpdGxlIiwibm9SZXZpZXdzIiwidWwiLCJmb3JFYWNoIiwiY3JlYXRlUmV2aWV3SFRNTCIsInJldmlldyIsImxpIiwiZGF0ZSIsInJhdGluZyIsImNvbW1lbnRzIiwidGFiSW5kZXgiLCJicmVhZGNydW1iIiwiYSIsImhyZWYiLCJ1cmwiLCJsb2NhdGlvbiIsInJlcGxhY2UiLCJyZWdleCIsIlJlZ0V4cCIsInJlc3VsdHMiLCJleGVjIiwiZGVjb2RlVVJJQ29tcG9uZW50Il0sIm1hcHBpbmdzIjoiOztBQUFBLElBQUlBLG1CQUFKO0FBQ0EsSUFBSUMsR0FBSjs7QUFFQUMsU0FBU0MsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFVBQUNDLEtBQUQsRUFBVztBQUNyREMsMkJBQXVCLGlCQUFTO0FBQzVCLFlBQUlDLEtBQUosRUFBVztBQUFFO0FBQ1RDLG9CQUFRRCxLQUFSLENBQWNBLEtBQWQ7QUFDSCxTQUZELE1BRU87QUFDSEU7QUFDQUM7O0FBRUE7QUFDQUM7QUFDSDtBQUNKLEtBVkQ7QUFXSCxDQVpEOztBQWNBOzs7QUFHQUMsT0FBT0MsT0FBUCxHQUFpQixZQUFNO0FBQ25CQyxTQUFLWixHQUFMLEdBQVcsSUFBSWEsT0FBT0MsSUFBUCxDQUFZQyxHQUFoQixDQUFvQmQsU0FBU2UsY0FBVCxDQUF3QixLQUF4QixDQUFwQixFQUFvRDtBQUMzREMsY0FBTSxFQURxRDtBQUUzREMsZ0JBQVFOLEtBQUtiLFVBQUwsQ0FBZ0JvQixNQUZtQztBQUczREMscUJBQWE7QUFIOEMsS0FBcEQsQ0FBWDs7QUFNQTtBQUNBQyxhQUFTQyxzQkFBVCxDQUFnQ1YsS0FBS2IsVUFBckMsRUFBaURhLEtBQUtaLEdBQXREO0FBQ0gsQ0FURDs7QUFXQTs7O0FBR0EsSUFBTUkseUJBQXlCLFNBQXpCQSxzQkFBeUIsQ0FBQ21CLFFBQUQsRUFBYztBQUN6QyxRQUFJWCxLQUFLYixVQUFULEVBQXFCO0FBQUU7QUFD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cmFudDtcclxudmFyIG1hcDtcclxuXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoZXZlbnQpID0+IHtcclxuICAgIGZldGNoUmVzdGF1cmFudEZyb21VUkwoZXJyb3IgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZpbGxSZXN0YXVyYW50SFRNTCgpO1xyXG4gICAgICAgICAgICBmaWxsQnJlYWRjcnVtYigpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gSW5jbHVkZSBtYXBzIGFwaSBkeW5hbWljYWxseSBvbmx5IGFmdGVyIGV2ZXJ5dGhpbmcgZWxzZSBoYXMgYmVlbiBkb25lXHJcbiAgICAgICAgICAgIGdldEdvb2dsZU1hcHNBcGkoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBHb29nbGUgbWFwLCBjYWxsZWQgZnJvbSBIVE1MLlxyXG4gKi9cclxud2luZG93LmluaXRNYXAgPSAoKSA9PiB7XHJcbiAgICBzZWxmLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpLCB7XHJcbiAgICAgICAgem9vbTogMTYsXHJcbiAgICAgICAgY2VudGVyOiBzZWxmLnJlc3RhdXJhbnQubGF0bG5nLFxyXG4gICAgICAgIHNjcm9sbHdoZWVsOiBmYWxzZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQWRkIG1hcmtlcnMgdG8gdGhlIG1hcCBhZnRlciBiZWluZyBpbml0aWFsaXplZFxyXG4gICAgREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChzZWxmLnJlc3RhdXJhbnQsIHNlbGYubWFwKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldCBjdXJyZW50IHJlc3RhdXJhbnQgZnJvbSBwYWdlIFVSTC5cclxuICovXHJcbmNvbnN0IGZldGNoUmVzdGF1cmFudEZyb21VUkwgPSAoY2FsbGJhY2spID0+IHtcclxuICAgIGlmIChzZWxmLnJlc3RhdXJhbnQpIHsgLy8gcmVzdGF1cmFudCBhbHJlYWR5IGZldGNoZWQhXHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgaWQgPSBnZXRQYXJhbWV0ZXJCeU5hbWUoJ2lkJyk7XHJcbiAgICBpZiAoIWlkKSB7IC8vIG5vIGlkIGZvdW5kIGluIFVSTFxyXG4gICAgICAgIGVycm9yID0gJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJ1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgKGVycm9yLCByZXN0YXVyYW50KSA9PiB7XHJcbiAgICAgICAgICAgIHNlbGYucmVzdGF1cmFudCA9IHJlc3RhdXJhbnQ7XHJcbiAgICAgICAgICAgIGlmICghcmVzdGF1cmFudCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIHJlc3RhdXJhbnQgSFRNTCBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlXHJcbiAqL1xyXG5jb25zdCBmaWxsUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCA9IHNlbGYucmVzdGF1cmFudCkgPT4ge1xyXG4gICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LW5hbWUnKTtcclxuICAgIG5hbWUuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xyXG5cclxuICAgIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1hZGRyZXNzJyk7XHJcbiAgICBhZGRyZXNzLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuYWRkcmVzcztcclxuXHJcbiAgICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWltZycpO1xyXG4gICAgaW1hZ2UuY2xhc3NOYW1lID0gJ3Jlc3RhdXJhbnQtaW1nJztcclxuICAgIGltYWdlLmFsdCA9IHJlc3RhdXJhbnQubmFtZTtcclxuXHJcbiAgICBjb25zdCBpbWFnZUZpbGVuYW1lID0gREJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xyXG4gICAgaWYgKGltYWdlRmlsZW5hbWUgPT0gJ25vaW1nJykge1xyXG4gICAgICAgIGNvbnN0IHJlc3RhdXJhbnRJbWdTb3VyY2VzUGljdHVyZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWltZy1zb3VyY2VzJyk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIHNvdXJjZXMgYW5kIGltYWdlIGZyb20gcGljdHVyZSB0byBhZGQgdGhlIG5vaW1nIHNvdXJjZXNcclxuICAgICAgICB3aGlsZSAocmVzdGF1cmFudEltZ1NvdXJjZXNQaWN0dXJlLmZpcnN0Q2hpbGQpIHtcclxuICAgICAgICAgICAgcmVzdGF1cmFudEltZ1NvdXJjZXNQaWN0dXJlLnJlbW92ZUNoaWxkKHJlc3RhdXJhbnRJbWdTb3VyY2VzUGljdHVyZS5maXJzdENoaWxkKTtcclxuICAgICAgICB9XHJcblxyXG4vLyBJZiByZXN0YXVyYW50IGhhcyBub3QgYW4gaW1hZ2UsIGRpc3BsYXkgYSBubyBpbWFnZSBzdmdcclxuLy8gYW5kIHVzZSBpdHMgY29ycmVzcG9uZGluZyBwbmcgYXMgYSBmYWxsYmFjay5cclxuLy8gQXV0aG9yIG9mIHRoZSBub2ltZy5zdmcgYW5kIG5vaW1nLnBuZyBpcyBjcmVkaXRlZCBhdCBwYWdlJ3MgZm9vdGVyLlxyXG4gICAgICAgIGNvbnN0IG5vSW1nRmFsbGJhY2sgPSBgJHtpbWFnZUZpbGVuYW1lfS5wbmdgO1xyXG4gICAgICAgIGFkZEltYWdlU291cmNlVG9QaWN0dXJlKHJlc3RhdXJhbnRJbWdTb3VyY2VzUGljdHVyZSwgYCR7aW1hZ2VGaWxlbmFtZX0uc3ZnYCk7XHJcbiAgICAgICAgYWRkSW1hZ2VTb3VyY2VUb1BpY3R1cmUocmVzdGF1cmFudEltZ1NvdXJjZXNQaWN0dXJlLCBub0ltZ0ZhbGxiYWNrKTtcclxuXHJcbiAgICAgICAgaW1hZ2Uuc3JjID0gbm9JbWdGYWxsYmFjaztcclxuICAgICAgICBpbWFnZS5jbGFzc05hbWUgKz0gJyBub2ltZyc7XHJcblxyXG4gICAgICAgIHJlc3RhdXJhbnRJbWdTb3VyY2VzUGljdHVyZS5hcHBlbmQoaW1hZ2UpO1xyXG4gICAgICAgIC8vIFRPRE86IEZpeCBub2ltZyBzdmcgcmVzcG9uc2l2ZSBoZWlnaHRcclxuICAgICAgICAvLyBUT0RPOiBGaXggbm9pbWcgcG5nIGZhbGxiYWNrIGluIElFXHJcbiAgICAgICAgLy8gVE9ETzogQ2FjaGUgbm9pbWcgc3ZnIGFuZCBwbmdcclxuICAgIH0gZWxzZSB7XHJcbi8vIGdldCBhbGwgcG9zc2libGUgbmFtZXMgb2YgYW4gaW1hZ2UgZGVwZW5kaW5nIG9uIGl0cyBzaXplIChzbWFsbCwgbWVkaXVtLCBsYXJnZSlcclxuICAgICAgICBjb25zdCBpbWFnZXNSZXNpemVkID0gaW1hZ2VOYW1lc0J5U2l6ZShpbWFnZUZpbGVuYW1lKTtcclxuXHJcbiAgICAgICAgLy8gYXNzaWduIHNyY3NldCBhdHRyaWJ1dGUgZm9yIG1lZGl1bSBwaWN0dXJlIHNvdXJjZSAobWVkaXVtIHNjcmVlbnMpXHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudEltZ01lZGl1bSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWltZy1tZWRpdW0nKTtcclxuICAgICAgICByZXN0YXVyYW50SW1nTWVkaXVtLnNyY3NldCA9IGltYWdlc1Jlc2l6ZWQubWVkaXVtO1xyXG5cclxuICAgICAgICAvLyBhc3NpZ24gc3Jjc2V0IGF0dHJpYnV0ZSBmb3IgbGFyZ2UgcGljdHVyZSBzb3VyY2UgKG1lZGl1bSBzY3JlZW5zKVxyXG4gICAgICAgIGNvbnN0IHJlc3RhdXJhbnRJbWdNZWRpdW1MYXJnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWltZy1tZWRpdW0tbGFyZ2UnKTtcclxuICAgICAgICByZXN0YXVyYW50SW1nTWVkaXVtTGFyZ2Uuc3Jjc2V0ID0gaW1hZ2VzUmVzaXplZC5sYXJnZTtcclxuXHJcbiAgICAgICAgLy8gYXNzaWduIHNyY3NldCBhdHRyaWJ1dGUgZm9yIGxhcmdlIHBpY3R1cmUgc291cmNlIChsYXJnZSBzY3JlZW5zKVxyXG4gICAgICAgIGNvbnN0IHJlc3RhdXJhbnRJbWdMYXJnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWltZy1sYXJnZScpO1xyXG4gICAgICAgIHJlc3RhdXJhbnRJbWdMYXJnZS5zcmNzZXQgPSBgJHtpbWFnZXNSZXNpemVkLm1lZGl1bX0gMXgsICR7aW1hZ2VzUmVzaXplZC5sYXJnZX0gMnhgO1xyXG5cclxuICAgICAgICBpbWFnZS5zcmMgPSBpbWFnZXNSZXNpemVkLnNtYWxsOyAgIC8vIHNtYWxsIGltYWdlIGJ5IGRlZmF1bHRcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjdWlzaW5lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtY3Vpc2luZScpO1xyXG4gICAgY3Vpc2luZS5pbm5lckhUTUwgPSByZXN0YXVyYW50LmN1aXNpbmVfdHlwZTtcclxuICAgIGN1aXNpbmUuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgYFJlc3RhdXJhbnQgY3Vpc2luZSB0eXBlICR7cmVzdGF1cmFudC5jdWlzaW5lX3R5cGV9YCk7XHJcblxyXG4gICAgLy8gZmlsbCBvcGVyYXRpbmcgaG91cnNcclxuICAgIGlmIChyZXN0YXVyYW50Lm9wZXJhdGluZ19ob3Vycykge1xyXG4gICAgICAgIGZpbGxSZXN0YXVyYW50SG91cnNIVE1MKCk7XHJcbiAgICB9XHJcbi8vIGZpbGwgcmV2aWV3c1xyXG4gICAgZmlsbFJldmlld3NIVE1MKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBvcGVyYXRpbmcgaG91cnMgSFRNTCB0YWJsZSBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxyXG4gKi9cclxuY29uc3QgZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwgPSAob3BlcmF0aW5nSG91cnMgPSBzZWxmLnJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSA9PiB7XHJcbiAgICBjb25zdCBob3VycyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWhvdXJzJyk7XHJcbiAgICBmb3IgKGxldCBrZXkgaW4gb3BlcmF0aW5nSG91cnMpIHtcclxuICAgICAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xyXG5cclxuICAgICAgICBjb25zdCBkYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xyXG4gICAgICAgIGRheS5pbm5lckhUTUwgPSBrZXk7XHJcbiAgICAgICAgcm93LmFwcGVuZENoaWxkKGRheSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHRpbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xyXG4gICAgICAgIHRpbWUuaW5uZXJIVE1MID0gb3BlcmF0aW5nSG91cnNba2V5XTtcclxuICAgICAgICByb3cuYXBwZW5kQ2hpbGQodGltZSk7XHJcblxyXG4gICAgICAgIGhvdXJzLmFwcGVuZENoaWxkKHJvdyk7XHJcbn1cclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhbGwgcmV2aWV3cyBIVE1MIGFuZCBhZGQgdGhlbSB0byB0aGUgd2VicGFnZS5cclxuICovXHJcbmNvbnN0IGZpbGxSZXZpZXdzSFRNTCA9IChyZXZpZXdzID0gc2VsZi5yZXN0YXVyYW50LnJldmlld3MpID0+IHtcclxuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWNvbnRhaW5lcicpO1xyXG4gICAgY29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbGxlZGJ5JywgJ3Jldmlld3MtaGVhZGluZycpO1xyXG5cclxuICAgIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDMnKTtcclxuICAgIHRpdGxlLmlubmVySFRNTCA9ICdSZXZpZXdzJztcclxuICAgIHRpdGxlLmlkID0gJ3Jldmlld3MtaGVhZGluZyc7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGl0bGUpO1xyXG5cclxuICAgIGlmICghcmV2aWV3cykge1xyXG4gICAgICAgIGNvbnN0IG5vUmV2aWV3cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgICAgICBub1Jldmlld3MuaW5uZXJIVE1MID0gJ05vIHJldmlld3MgeWV0ISc7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG5vUmV2aWV3cyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XHJcbiAgICByZXZpZXdzLmZvckVhY2gocmV2aWV3ID0+IHtcclxuICAgICAgICB1bC5hcHBlbmRDaGlsZChjcmVhdGVSZXZpZXdIVE1MKHJldmlldykpO1xyXG4gICAgfSk7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodWwpO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIHJldmlldyBIVE1MIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2UuXHJcbiAqL1xyXG5jb25zdCBjcmVhdGVSZXZpZXdIVE1MID0gKHJldmlldykgPT4ge1xyXG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIG5hbWUuaW5uZXJIVE1MID0gcmV2aWV3Lm5hbWU7XHJcbiAgICBsaS5hcHBlbmRDaGlsZChuYW1lKTtcclxuXHJcbiAgICBjb25zdCBkYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgZGF0ZS5pbm5lckhUTUwgPSByZXZpZXcuZGF0ZTtcclxuICAgIGxpLmFwcGVuZENoaWxkKGRhdGUpO1xyXG5cclxuICAgIGNvbnN0IHJhdGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIHJhdGluZy5pbm5lckhUTUwgPSBgUmF0aW5nOiAke3Jldmlldy5yYXRpbmd9YDtcclxuICAgIGxpLmFwcGVuZENoaWxkKHJhdGluZyk7XHJcblxyXG4gICAgY29uc3QgY29tbWVudHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBjb21tZW50cy5pbm5lckhUTUwgPSByZXZpZXcuY29tbWVudHM7XHJcbiAgICBsaS5hcHBlbmRDaGlsZChjb21tZW50cyk7XHJcblxyXG4gICAgbGkudGFiSW5kZXggPSAwO1xyXG5cclxuICAgIHJldHVybiBsaTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFkZCByZXN0YXVyYW50IG5hbWUgdG8gdGhlIGJyZWFkY3J1bWIgbmF2aWdhdGlvbiBtZW51XHJcbiAqL1xyXG5jb25zdCBmaWxsQnJlYWRjcnVtYiA9IChyZXN0YXVyYW50ID0gc2VsZi5yZXN0YXVyYW50KSA9PiB7XHJcbiAgICBjb25zdCBicmVhZGNydW1iID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JyZWFkY3J1bWInKTtcclxuXHJcbiAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgICBicmVhZGNydW1iLmFwcGVuZENoaWxkKGxpKTtcclxuXHJcbiAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgYS5ocmVmID0gJyMnO1xyXG4gICAgYS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcbiAgICBhLnNldEF0dHJpYnV0ZSgnYXJpYS1jdXJyZW50JywgJ3BhZ2UnKTtcclxuICAgIGxpLmFwcGVuZENoaWxkKGEpO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0IGEgcGFyYW1ldGVyIGJ5IG5hbWUgZnJvbSBwYWdlIFVSTC5cclxuICovXHJcbmNvbnN0IGdldFBhcmFtZXRlckJ5TmFtZSA9IChuYW1lLCB1cmwpID0+IHtcclxuICAgIGlmICghdXJsKVxyXG4gICAgICAgIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xyXG4gICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgJ1xcXFwkJicpO1xyXG4gICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGBbPyZdJHtuYW1lfSg9KFteJiNdKil8JnwjfCQpYCksXHJcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZWdleC5leGVjKHVybCk7XHJcbiAgICBpZiAoIXJlc3VsdHMpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICBpZiAoIXJlc3VsdHNbMl0pXHJcbiAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzJdLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcclxufVxyXG4iXX0=
