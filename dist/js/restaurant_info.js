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
        // TODO: Fix noimg png fallback in IE
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwibWFwIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJmZXRjaFJlc3RhdXJhbnRGcm9tVVJMIiwiZXJyb3IiLCJjb25zb2xlIiwiZmlsbFJlc3RhdXJhbnRIVE1MIiwiZmlsbEJyZWFkY3J1bWIiLCJnZXRHb29nbGVNYXBzQXBpIiwid2luZG93IiwiaW5pdE1hcCIsInNlbGYiLCJnb29nbGUiLCJtYXBzIiwiTWFwIiwiZ2V0RWxlbWVudEJ5SWQiLCJ6b29tIiwiY2VudGVyIiwibGF0bG5nIiwic2Nyb2xsd2hlZWwiLCJEQkhlbHBlciIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJjYWxsYmFjayIsImlkIiwiZ2V0UGFyYW1ldGVyQnlOYW1lIiwiZmV0Y2hSZXN0YXVyYW50QnlJZCIsIm5hbWUiLCJpbm5lckhUTUwiLCJhZGRyZXNzIiwiaW1hZ2UiLCJjbGFzc05hbWUiLCJhbHQiLCJpbWFnZUZpbGVuYW1lIiwiaW1hZ2VVcmxGb3JSZXN0YXVyYW50IiwicmVzdGF1cmFudEltZ1NvdXJjZXNQaWN0dXJlIiwiZmlyc3RDaGlsZCIsInJlbW92ZUNoaWxkIiwibm9JbWdGYWxsYmFjayIsImFkZEltYWdlU291cmNlVG9QaWN0dXJlIiwic3JjIiwiYXBwZW5kIiwiaW1hZ2VzUmVzaXplZCIsImltYWdlTmFtZXNCeVNpemUiLCJyZXN0YXVyYW50SW1nTWVkaXVtIiwic3Jjc2V0IiwibWVkaXVtIiwicmVzdGF1cmFudEltZ01lZGl1bUxhcmdlIiwibGFyZ2UiLCJyZXN0YXVyYW50SW1nTGFyZ2UiLCJzbWFsbCIsImN1aXNpbmUiLCJjdWlzaW5lX3R5cGUiLCJzZXRBdHRyaWJ1dGUiLCJvcGVyYXRpbmdfaG91cnMiLCJmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCIsImZpbGxSZXZpZXdzSFRNTCIsIm9wZXJhdGluZ0hvdXJzIiwiaG91cnMiLCJrZXkiLCJyb3ciLCJjcmVhdGVFbGVtZW50IiwiZGF5IiwiYXBwZW5kQ2hpbGQiLCJ0aW1lIiwicmV2aWV3cyIsImNvbnRhaW5lciIsInRpdGxlIiwibm9SZXZpZXdzIiwidWwiLCJmb3JFYWNoIiwiY3JlYXRlUmV2aWV3SFRNTCIsInJldmlldyIsImxpIiwiZGF0ZSIsInJhdGluZyIsImNvbW1lbnRzIiwidGFiSW5kZXgiLCJicmVhZGNydW1iIiwiYSIsImhyZWYiLCJ1cmwiLCJsb2NhdGlvbiIsInJlcGxhY2UiLCJyZWdleCIsIlJlZ0V4cCIsInJlc3VsdHMiLCJleGVjIiwiZGVjb2RlVVJJQ29tcG9uZW50Il0sIm1hcHBpbmdzIjoiOztBQUFBLElBQUlBLG1CQUFKO0FBQ0EsSUFBSUMsR0FBSjs7QUFFQUMsU0FBU0MsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFVBQUNDLEtBQUQsRUFBVztBQUNyREMsMkJBQXVCLGlCQUFTO0FBQzVCLFlBQUlDLEtBQUosRUFBVztBQUFFO0FBQ1RDLG9CQUFRRCxLQUFSLENBQWNBLEtBQWQ7QUFDSCxTQUZELE1BRU87QUFDSEU7QUFDQUM7O0FBRUE7QUFDQUM7QUFDSDtBQUNKLEtBVkQ7QUFXSCxDQVpEOztBQWNBOzs7QUFHQUMsT0FBT0MsT0FBUCxHQUFpQixZQUFNO0FBQ25CQyxTQUFLWixHQUFMLEdBQVcsSUFBSWEsT0FBT0MsSUFBUCxDQUFZQyxHQUFoQixDQUFvQmQsU0FBU2UsY0FBVCxDQUF3QixLQUF4QixDQUFwQixFQUFvRDtBQUMzREMsY0FBTSxFQURxRDtBQUUzREMsZ0JBQVFOLEtBQUtiLFVBQUwsQ0FBZ0JvQixNQUZtQztBQUczREMscUJBQWE7QUFIOEMsS0FBcEQsQ0FBWDs7QUFNQTtBQUNBQyxhQUFTQyxzQkFBVCxDQUFnQ1YsS0FBS2IsVUFBckMsRUFBaURhLEtBQUtaLEdBQXREO0FBQ0gsQ0FURDs7QUFXQTs7O0FBR0EsSUFBTUkseUJBQXlCLFNBQXpCQSxzQkFBeUIsQ0FBQ21CLFFBQUQsRUFBYztBQUN6QyxRQUFJWCxLQUFLYixVQUFULEVBQXFCO0FBQUU7QUFD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YXIgbWFwO1xyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIChldmVudCkgPT4ge1xyXG4gICAgZmV0Y2hSZXN0YXVyYW50RnJvbVVSTChlcnJvciA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZmlsbFJlc3RhdXJhbnRIVE1MKCk7XHJcbiAgICAgICAgICAgIGZpbGxCcmVhZGNydW1iKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBJbmNsdWRlIG1hcHMgYXBpIGR5bmFtaWNhbGx5IG9ubHkgYWZ0ZXIgZXZlcnl0aGluZyBlbHNlIGhhcyBiZWVuIGRvbmVcclxuICAgICAgICAgICAgZ2V0R29vZ2xlTWFwc0FwaSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBJbml0aWFsaXplIEdvb2dsZSBtYXAsIGNhbGxlZCBmcm9tIEhUTUwuXHJcbiAqL1xyXG53aW5kb3cuaW5pdE1hcCA9ICgpID0+IHtcclxuICAgIHNlbGYubWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyksIHtcclxuICAgICAgICB6b29tOiAxNixcclxuICAgICAgICBjZW50ZXI6IHNlbGYucmVzdGF1cmFudC5sYXRsbmcsXHJcbiAgICAgICAgc2Nyb2xsd2hlZWw6IGZhbHNlXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBZGQgbWFya2VycyB0byB0aGUgbWFwIGFmdGVyIGJlaW5nIGluaXRpYWxpemVkXHJcbiAgICBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHNlbGYucmVzdGF1cmFudCwgc2VsZi5tYXApO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0IGN1cnJlbnQgcmVzdGF1cmFudCBmcm9tIHBhZ2UgVVJMLlxyXG4gKi9cclxuY29uc3QgZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCA9IChjYWxsYmFjaykgPT4ge1xyXG4gICAgaWYgKHNlbGYucmVzdGF1cmFudCkgeyAvLyByZXN0YXVyYW50IGFscmVhZHkgZmV0Y2hlZCFcclxuICAgICAgICBjYWxsYmFjayhudWxsKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBpZCA9IGdldFBhcmFtZXRlckJ5TmFtZSgnaWQnKTtcclxuICAgIGlmICghaWQpIHsgLy8gbm8gaWQgZm91bmQgaW4gVVJMXHJcbiAgICAgICAgZXJyb3IgPSAnTm8gcmVzdGF1cmFudCBpZCBpbiBVUkwnXHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRCeUlkKGlkLCAoZXJyb3IsIHJlc3RhdXJhbnQpID0+IHtcclxuICAgICAgICAgICAgc2VsZi5yZXN0YXVyYW50ID0gcmVzdGF1cmFudDtcclxuICAgICAgICAgICAgaWYgKCFyZXN0YXVyYW50KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBIVE1MIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2VcclxuICovXHJcbmNvbnN0IGZpbGxSZXN0YXVyYW50SFRNTCA9IChyZXN0YXVyYW50ID0gc2VsZi5yZXN0YXVyYW50KSA9PiB7XHJcbiAgICBjb25zdCBuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtbmFtZScpO1xyXG4gICAgbmFtZS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcblxyXG4gICAgY29uc3QgYWRkcmVzcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWFkZHJlc3MnKTtcclxuICAgIGFkZHJlc3MuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5hZGRyZXNzO1xyXG5cclxuICAgIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nJyk7XHJcbiAgICBpbWFnZS5jbGFzc05hbWUgPSAncmVzdGF1cmFudC1pbWcnO1xyXG4gICAgaW1hZ2UuYWx0ID0gcmVzdGF1cmFudC5uYW1lO1xyXG5cclxuICAgIGNvbnN0IGltYWdlRmlsZW5hbWUgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgICBpZiAoaW1hZ2VGaWxlbmFtZSA9PSAnbm9pbWcnKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudEltZ1NvdXJjZXNQaWN0dXJlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nLXNvdXJjZXMnKTtcclxuICAgICAgICAvLyBSZW1vdmUgc291cmNlcyBhbmQgaW1hZ2UgZnJvbSBwaWN0dXJlIHRvIGFkZCB0aGUgbm9pbWcgc291cmNlc1xyXG4gICAgICAgIHdoaWxlIChyZXN0YXVyYW50SW1nU291cmNlc1BpY3R1cmUuZmlyc3RDaGlsZCkge1xyXG4gICAgICAgICAgICByZXN0YXVyYW50SW1nU291cmNlc1BpY3R1cmUucmVtb3ZlQ2hpbGQocmVzdGF1cmFudEltZ1NvdXJjZXNQaWN0dXJlLmZpcnN0Q2hpbGQpO1xyXG4gICAgICAgIH1cclxuXHJcbi8vIElmIHJlc3RhdXJhbnQgaGFzIG5vdCBhbiBpbWFnZSwgZGlzcGxheSBhIG5vIGltYWdlIHN2Z1xyXG4vLyBhbmQgdXNlIGl0cyBjb3JyZXNwb25kaW5nIHBuZyBhcyBhIGZhbGxiYWNrLlxyXG4vLyBBdXRob3Igb2YgdGhlIG5vaW1nLnN2ZyBhbmQgbm9pbWcucG5nIGlzIGNyZWRpdGVkIGF0IHBhZ2UncyBmb290ZXIuXHJcbiAgICAgICAgY29uc3Qgbm9JbWdGYWxsYmFjayA9IGAke2ltYWdlRmlsZW5hbWV9LnBuZ2A7XHJcbiAgICAgICAgYWRkSW1hZ2VTb3VyY2VUb1BpY3R1cmUocmVzdGF1cmFudEltZ1NvdXJjZXNQaWN0dXJlLCBgJHtpbWFnZUZpbGVuYW1lfS5zdmdgKTtcclxuICAgICAgICBhZGRJbWFnZVNvdXJjZVRvUGljdHVyZShyZXN0YXVyYW50SW1nU291cmNlc1BpY3R1cmUsIG5vSW1nRmFsbGJhY2spO1xyXG5cclxuICAgICAgICBpbWFnZS5zcmMgPSBub0ltZ0ZhbGxiYWNrO1xyXG4gICAgICAgIGltYWdlLmNsYXNzTmFtZSArPSAnIG5vaW1nJztcclxuXHJcbiAgICAgICAgcmVzdGF1cmFudEltZ1NvdXJjZXNQaWN0dXJlLmFwcGVuZChpbWFnZSk7XHJcbiAgICAgICAgLy8gVE9ETzogRml4IG5vaW1nIHBuZyBmYWxsYmFjayBpbiBJRVxyXG4gICAgfSBlbHNlIHtcclxuLy8gZ2V0IGFsbCBwb3NzaWJsZSBuYW1lcyBvZiBhbiBpbWFnZSBkZXBlbmRpbmcgb24gaXRzIHNpemUgKHNtYWxsLCBtZWRpdW0sIGxhcmdlKVxyXG4gICAgICAgIGNvbnN0IGltYWdlc1Jlc2l6ZWQgPSBpbWFnZU5hbWVzQnlTaXplKGltYWdlRmlsZW5hbWUpO1xyXG5cclxuICAgICAgICAvLyBhc3NpZ24gc3Jjc2V0IGF0dHJpYnV0ZSBmb3IgbWVkaXVtIHBpY3R1cmUgc291cmNlIChtZWRpdW0gc2NyZWVucylcclxuICAgICAgICBjb25zdCByZXN0YXVyYW50SW1nTWVkaXVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nLW1lZGl1bScpO1xyXG4gICAgICAgIHJlc3RhdXJhbnRJbWdNZWRpdW0uc3Jjc2V0ID0gaW1hZ2VzUmVzaXplZC5tZWRpdW07XHJcblxyXG4gICAgICAgIC8vIGFzc2lnbiBzcmNzZXQgYXR0cmlidXRlIGZvciBsYXJnZSBwaWN0dXJlIHNvdXJjZSAobWVkaXVtIHNjcmVlbnMpXHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudEltZ01lZGl1bUxhcmdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nLW1lZGl1bS1sYXJnZScpO1xyXG4gICAgICAgIHJlc3RhdXJhbnRJbWdNZWRpdW1MYXJnZS5zcmNzZXQgPSBpbWFnZXNSZXNpemVkLmxhcmdlO1xyXG5cclxuICAgICAgICAvLyBhc3NpZ24gc3Jjc2V0IGF0dHJpYnV0ZSBmb3IgbGFyZ2UgcGljdHVyZSBzb3VyY2UgKGxhcmdlIHNjcmVlbnMpXHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudEltZ0xhcmdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nLWxhcmdlJyk7XHJcbiAgICAgICAgcmVzdGF1cmFudEltZ0xhcmdlLnNyY3NldCA9IGAke2ltYWdlc1Jlc2l6ZWQubWVkaXVtfSAxeCwgJHtpbWFnZXNSZXNpemVkLmxhcmdlfSAyeGA7XHJcblxyXG4gICAgICAgIGltYWdlLnNyYyA9IGltYWdlc1Jlc2l6ZWQuc21hbGw7ICAgLy8gc21hbGwgaW1hZ2UgYnkgZGVmYXVsdFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1jdWlzaW5lJyk7XHJcbiAgICBjdWlzaW5lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuY3Vpc2luZV90eXBlO1xyXG4gICAgY3Vpc2luZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCBgUmVzdGF1cmFudCBjdWlzaW5lIHR5cGUgJHtyZXN0YXVyYW50LmN1aXNpbmVfdHlwZX1gKTtcclxuXHJcbiAgICAvLyBmaWxsIG9wZXJhdGluZyBob3Vyc1xyXG4gICAgaWYgKHJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSB7XHJcbiAgICAgICAgZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwoKTtcclxuICAgIH1cclxuLy8gZmlsbCByZXZpZXdzXHJcbiAgICBmaWxsUmV2aWV3c0hUTUwoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSByZXN0YXVyYW50IG9wZXJhdGluZyBob3VycyBIVE1MIHRhYmxlIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2UuXHJcbiAqL1xyXG5jb25zdCBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCA9IChvcGVyYXRpbmdIb3VycyA9IHNlbGYucmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpID0+IHtcclxuICAgIGNvbnN0IGhvdXJzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaG91cnMnKTtcclxuICAgIGZvciAobGV0IGtleSBpbiBvcGVyYXRpbmdIb3Vycykge1xyXG4gICAgICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICAgICAgZGF5LmlubmVySFRNTCA9IGtleTtcclxuICAgICAgICByb3cuYXBwZW5kQ2hpbGQoZGF5KTtcclxuXHJcbiAgICAgICAgY29uc3QgdGltZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XHJcbiAgICAgICAgdGltZS5pbm5lckhUTUwgPSBvcGVyYXRpbmdIb3Vyc1trZXldO1xyXG4gICAgICAgIHJvdy5hcHBlbmRDaGlsZCh0aW1lKTtcclxuXHJcbiAgICAgICAgaG91cnMuYXBwZW5kQ2hpbGQocm93KTtcclxufVxyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIGFsbCByZXZpZXdzIEhUTUwgYW5kIGFkZCB0aGVtIHRvIHRoZSB3ZWJwYWdlLlxyXG4gKi9cclxuY29uc3QgZmlsbFJldmlld3NIVE1MID0gKHJldmlld3MgPSBzZWxmLnJlc3RhdXJhbnQucmV2aWV3cykgPT4ge1xyXG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtY29udGFpbmVyJyk7XHJcbiAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsbGVkYnknLCAncmV2aWV3cy1oZWFkaW5nJyk7XHJcblxyXG4gICAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMycpO1xyXG4gICAgdGl0bGUuaW5uZXJIVE1MID0gJ1Jldmlld3MnO1xyXG4gICAgdGl0bGUuaWQgPSAncmV2aWV3cy1oZWFkaW5nJztcclxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aXRsZSk7XHJcblxyXG4gICAgaWYgKCFyZXZpZXdzKSB7XHJcbiAgICAgICAgY29uc3Qgbm9SZXZpZXdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgICAgIG5vUmV2aWV3cy5pbm5lckhUTUwgPSAnTm8gcmV2aWV3cyB5ZXQhJztcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobm9SZXZpZXdzKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWxpc3QnKTtcclxuICAgIHJldmlld3MuZm9yRWFjaChyZXZpZXcgPT4ge1xyXG4gICAgICAgIHVsLmFwcGVuZENoaWxkKGNyZWF0ZVJldmlld0hUTUwocmV2aWV3KSk7XHJcbiAgICB9KTtcclxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh1bCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgcmV2aWV3IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZS5cclxuICovXHJcbmNvbnN0IGNyZWF0ZVJldmlld0hUTUwgPSAocmV2aWV3KSA9PiB7XHJcbiAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgbmFtZS5pbm5lckhUTUwgPSByZXZpZXcubmFtZTtcclxuICAgIGxpLmFwcGVuZENoaWxkKG5hbWUpO1xyXG5cclxuICAgIGNvbnN0IGRhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBkYXRlLmlubmVySFRNTCA9IHJldmlldy5kYXRlO1xyXG4gICAgbGkuYXBwZW5kQ2hpbGQoZGF0ZSk7XHJcblxyXG4gICAgY29uc3QgcmF0aW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgcmF0aW5nLmlubmVySFRNTCA9IGBSYXRpbmc6ICR7cmV2aWV3LnJhdGluZ31gO1xyXG4gICAgbGkuYXBwZW5kQ2hpbGQocmF0aW5nKTtcclxuXHJcbiAgICBjb25zdCBjb21tZW50cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIGNvbW1lbnRzLmlubmVySFRNTCA9IHJldmlldy5jb21tZW50cztcclxuICAgIGxpLmFwcGVuZENoaWxkKGNvbW1lbnRzKTtcclxuXHJcbiAgICBsaS50YWJJbmRleCA9IDA7XHJcblxyXG4gICAgcmV0dXJuIGxpO1xyXG59XHJcblxyXG4vKipcclxuICogQWRkIHJlc3RhdXJhbnQgbmFtZSB0byB0aGUgYnJlYWRjcnVtYiBuYXZpZ2F0aW9uIG1lbnVcclxuICovXHJcbmNvbnN0IGZpbGxCcmVhZGNydW1iID0gKHJlc3RhdXJhbnQgPSBzZWxmLnJlc3RhdXJhbnQpID0+IHtcclxuICAgIGNvbnN0IGJyZWFkY3J1bWIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnJlYWRjcnVtYicpO1xyXG5cclxuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgIGJyZWFkY3J1bWIuYXBwZW5kQ2hpbGQobGkpO1xyXG5cclxuICAgIGNvbnN0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICBhLmhyZWYgPSAnIyc7XHJcbiAgICBhLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcclxuICAgIGEuc2V0QXR0cmlidXRlKCdhcmlhLWN1cnJlbnQnLCAncGFnZScpO1xyXG4gICAgbGkuYXBwZW5kQ2hpbGQoYSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXQgYSBwYXJhbWV0ZXIgYnkgbmFtZSBmcm9tIHBhZ2UgVVJMLlxyXG4gKi9cclxuY29uc3QgZ2V0UGFyYW1ldGVyQnlOYW1lID0gKG5hbWUsIHVybCkgPT4ge1xyXG4gICAgaWYgKCF1cmwpXHJcbiAgICAgICAgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcbiAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXFxdXS9nLCAnXFxcXCQmJyk7XHJcbiAgICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoYFs/Jl0ke25hbWV9KD0oW14mI10qKXwmfCN8JClgKSxcclxuICAgICAgICAgICAgcmVzdWx0cyA9IHJlZ2V4LmV4ZWModXJsKTtcclxuICAgIGlmICghcmVzdWx0cylcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIGlmICghcmVzdWx0c1syXSlcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMl0ucmVwbGFjZSgvXFwrL2csICcgJykpO1xyXG59XHJcbiJdfQ==
