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

            // Include LazyLoad plugin
            getLazyLoadPlugin();

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
    image.className = 'restaurant-img lazy';
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

        image.setAttribute('data-src', noImgFallback);
        image.className += ' noimg';

        restaurantImgSourcesPicture.append(image);
        // TODO: Fix noimg png fallback in IE
    } else {
        // get all possible names of an image depending on its size (small, medium, large)
        var imagesResized = imageNamesBySize(imageFilename);

        // assign srcset attribute for medium picture source (medium screens)
        var restaurantImgMedium = document.getElementById('restaurant-img-medium');
        restaurantImgMedium.setAttribute('data-srcset', imagesResized.medium);

        // assign srcset attribute for large picture source (medium screens)
        var restaurantImgMediumLarge = document.getElementById('restaurant-img-medium-large');
        restaurantImgMediumLarge.setAttribute('data-srcset', imagesResized.large);

        // assign srcset attribute for large picture source (large screens)
        var restaurantImgLarge = document.getElementById('restaurant-img-large');
        restaurantImgLarge.setAttribute('data-srcset', imagesResized.medium + ' 1x, ' + imagesResized.large + ' 2x');

        image.setAttribute('data-src', imagesResized.small); // small image by default
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwibWFwIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJmZXRjaFJlc3RhdXJhbnRGcm9tVVJMIiwiZXJyb3IiLCJjb25zb2xlIiwiZmlsbFJlc3RhdXJhbnRIVE1MIiwiZmlsbEJyZWFkY3J1bWIiLCJnZXRMYXp5TG9hZFBsdWdpbiIsImdldEdvb2dsZU1hcHNBcGkiLCJ3aW5kb3ciLCJpbml0TWFwIiwic2VsZiIsImdvb2dsZSIsIm1hcHMiLCJNYXAiLCJnZXRFbGVtZW50QnlJZCIsInpvb20iLCJjZW50ZXIiLCJsYXRsbmciLCJzY3JvbGx3aGVlbCIsIkRCSGVscGVyIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsImNhbGxiYWNrIiwiaWQiLCJnZXRQYXJhbWV0ZXJCeU5hbWUiLCJmZXRjaFJlc3RhdXJhbnRCeUlkIiwibmFtZSIsImlubmVySFRNTCIsImFkZHJlc3MiLCJpbWFnZSIsImNsYXNzTmFtZSIsImFsdCIsImltYWdlRmlsZW5hbWUiLCJpbWFnZVVybEZvclJlc3RhdXJhbnQiLCJyZXN0YXVyYW50SW1nU291cmNlc1BpY3R1cmUiLCJmaXJzdENoaWxkIiwicmVtb3ZlQ2hpbGQiLCJub0ltZ0ZhbGxiYWNrIiwiYWRkSW1hZ2VTb3VyY2VUb1BpY3R1cmUiLCJzZXRBdHRyaWJ1dGUiLCJhcHBlbmQiLCJpbWFnZXNSZXNpemVkIiwiaW1hZ2VOYW1lc0J5U2l6ZSIsInJlc3RhdXJhbnRJbWdNZWRpdW0iLCJtZWRpdW0iLCJyZXN0YXVyYW50SW1nTWVkaXVtTGFyZ2UiLCJsYXJnZSIsInJlc3RhdXJhbnRJbWdMYXJnZSIsInNtYWxsIiwiY3Vpc2luZSIsImN1aXNpbmVfdHlwZSIsIm9wZXJhdGluZ19ob3VycyIsImZpbGxSZXN0YXVyYW50SG91cnNIVE1MIiwiZmlsbFJldmlld3NIVE1MIiwib3BlcmF0aW5nSG91cnMiLCJob3VycyIsImtleSIsInJvdyIsImNyZWF0ZUVsZW1lbnQiLCJkYXkiLCJhcHBlbmRDaGlsZCIsInRpbWUiLCJyZXZpZXdzIiwiY29udGFpbmVyIiwidGl0bGUiLCJub1Jldmlld3MiLCJ1bCIsImZvckVhY2giLCJjcmVhdGVSZXZpZXdIVE1MIiwicmV2aWV3IiwibGkiLCJkYXRlIiwicmF0aW5nIiwiY29tbWVudHMiLCJ0YWJJbmRleCIsImJyZWFkY3J1bWIiLCJhIiwiaHJlZiIsInVybCIsImxvY2F0aW9uIiwicmVwbGFjZSIsInJlZ2V4IiwiUmVnRXhwIiwicmVzdWx0cyIsImV4ZWMiLCJkZWNvZGVVUklDb21wb25lbnQiXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBSUEsbUJBQUo7QUFDQSxJQUFJQyxHQUFKOztBQUVBQyxTQUFTQyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsVUFBQ0MsS0FBRCxFQUFXO0FBQ3JEQywyQkFBdUIsaUJBQVM7QUFDNUIsWUFBSUMsS0FBSixFQUFXO0FBQUU7QUFDVEMsb0JBQVFELEtBQVIsQ0FBY0EsS0FBZDtBQUNILFNBRkQsTUFFTztBQUNIRTtBQUNBQzs7QUFFQTtBQUNBQzs7QUFFQTtBQUNBQztBQUNIO0FBQ0osS0FiRDtBQWNILENBZkQ7O0FBaUJBOzs7QUFHQUMsT0FBT0MsT0FBUCxHQUFpQixZQUFNO0FBQ25CQyxTQUFLYixHQUFMLEdBQVcsSUFBSWMsT0FBT0MsSUFBUCxDQUFZQyxHQUFoQixDQUFvQmYsU0FBU2dCLGNBQVQsQ0FBd0IsS0FBeEIsQ0FBcEIsRUFBb0Q7QUFDM0RDLGNBQU0sRUFEcUQ7QUFFM0RDLGdCQUFRTixLQUFLZCxVQUFMLENBQWdCcUIsTUFGbUM7QUFHM0RDLHFCQUFhO0FBSDhDLEtBQXBELENBQVg7O0FBTUE7QUFDQUMsYUFBU0Msc0JBQVQsQ0FBZ0NWLEtBQUtkLFVBQXJDLEVBQWlEYyxLQUFLYixHQUF0RDtBQUNILENBVEQ7O0FBV0E7OztBQUdBLElBQU1JLHlCQUF5QixTQUF6QkEsc0JBQXlCLENBQUNvQixRQUFELEVBQWM7QUFDekMsUUFBSVgsS0FBS2QsVUFBVCxFQUFxQjtBQUFFO0FBQ25CeUIsaUJBQVMsSUFBVDtBQUNBO0FBQ0g7QUFDRCxRQUFNQyxLQUFLQyxtQkFBbUIsSUFBbkIsQ0FBWDtBQUNBLFFBQUksQ0FBQ0QsRUFBTCxFQUFTO0FBQUU7QUFDUHBCLGdCQUFRLHlCQUFSO0FBQ0FtQixpQkFBU25CLEtBQVQ7QUFDSCxLQUhELE1BR087QUFDSGlCLGlCQUFTSyxtQkFBVCxDQUE2QkYsRUFBN0IsRUFBaUMsVUFBQ3BCLEtBQUQsRUFBUU4sVUFBUixFQUF1QjtBQUNwRGMsaUJBQUtkLFVBQUwsR0FBa0JBLFVBQWxCO0FBQ0EsZ0JBQUksQ0FBQ0EsVUFBTCxFQUFpQjtBQUNiTyx3QkFBUUQsS0FBUixDQUFjQSxLQUFkO0FBQ0E7QUFDSDs7QUFFRG1CLHFCQUFTLElBQVQ7QUFDSCxTQVJEO0FBU0g7QUFDSixDQXBCRDs7QUFzQkE7OztBQUdBLElBQU1qQixxQkFBcUIsU0FBckJBLGtCQUFxQixHQUFrQztBQUFBLFFBQWpDUixVQUFpQyx1RUFBcEJjLEtBQUtkLFVBQWU7O0FBQ3pELFFBQU02QixPQUFPM0IsU0FBU2dCLGNBQVQsQ0FBd0IsaUJBQXhCLENBQWI7QUFDQVcsU0FBS0MsU0FBTCxHQUFpQjlCLFdBQVc2QixJQUE1Qjs7QUFFQSxRQUFNRSxVQUFVN0IsU0FBU2dCLGNBQVQsQ0FBd0Isb0JBQXhCLENBQWhCO0FBQ0FhLFlBQVFELFNBQVIsR0FBb0I5QixXQUFXK0IsT0FBL0I7O0FBRUEsUUFBTUMsUUFBUTlCLFNBQVNnQixjQUFULENBQXdCLGdCQUF4QixDQUFkO0FBQ0FjLFVBQU1DLFNBQU4sR0FBa0IscUJBQWxCO0FBQ0FELFVBQU1FLEdBQU4sR0FBWWxDLFdBQVc2QixJQUF2Qjs7QUFFQSxRQUFNTSxnQkFBZ0JaLFNBQVNhLHFCQUFULENBQStCcEMsVUFBL0IsQ0FBdEI7QUFDQSxRQUFJbUMsaUJBQWlCLE9BQXJCLEVBQThCO0FBQzFCLFlBQU1FLDhCQUE4Qm5DLFNBQVNnQixjQUFULENBQXdCLHdCQUF4QixDQUFwQztBQUNBO0FBQ0EsZUFBT21CLDRCQUE0QkMsVUFBbkMsRUFBK0M7QUFDM0NELHdDQUE0QkUsV0FBNUIsQ0FBd0NGLDRCQUE0QkMsVUFBcEU7QUFDSDs7QUFFVDtBQUNBO0FBQ0E7QUFDUSxZQUFNRSxnQkFBbUJMLGFBQW5CLFNBQU47QUFDQU0sZ0NBQXdCSiwyQkFBeEIsRUFBd0RGLGFBQXhEO0FBQ0FNLGdDQUF3QkosMkJBQXhCLEVBQXFERyxhQUFyRDs7QUFFQVIsY0FBTVUsWUFBTixDQUFtQixVQUFuQixFQUErQkYsYUFBL0I7QUFDQVIsY0FBTUMsU0FBTixJQUFtQixRQUFuQjs7QUFFQUksb0NBQTRCTSxNQUE1QixDQUFtQ1gsS0FBbkM7QUFDQTtBQUNILEtBbkJELE1BbUJPO0FBQ1g7QUFDUSxZQUFNWSxnQkFBZ0JDLGlCQUFpQlYsYUFBakIsQ0FBdEI7O0FBRUE7QUFDQSxZQUFNVyxzQkFBc0I1QyxTQUFTZ0IsY0FBVCxDQUF3Qix1QkFBeEIsQ0FBNUI7QUFDQTRCLDRCQUFvQkosWUFBcEIsQ0FBaUMsYUFBakMsRUFBZ0RFLGNBQWNHLE1BQTlEOztBQUVBO0FBQ0EsWUFBTUMsMkJBQTJCOUMsU0FBU2dCLGNBQVQsQ0FBd0IsNkJBQXhCLENBQWpDO0FBQ0E4QixpQ0FBeUJOLFlBQXpCLENBQXNDLGFBQXRDLEVBQXFERSxjQUFjSyxLQUFuRTs7QUFFQTtBQUNBLFlBQU1DLHFCQUFxQmhELFNBQVNnQixjQUFULENBQXdCLHNCQUF4QixDQUEzQjtBQUNBZ0MsMkJBQW1CUixZQUFuQixDQUFnQyxhQUFoQyxFQUFrREUsY0FBY0csTUFBaEUsYUFBOEVILGNBQWNLLEtBQTVGOztBQUVBakIsY0FBTVUsWUFBTixDQUFtQixVQUFuQixFQUErQkUsY0FBY08sS0FBN0MsRUFoQkcsQ0FnQmtEO0FBQ3hEOztBQUVELFFBQU1DLFVBQVVsRCxTQUFTZ0IsY0FBVCxDQUF3QixvQkFBeEIsQ0FBaEI7QUFDQWtDLFlBQVF0QixTQUFSLEdBQW9COUIsV0FBV3FELFlBQS9CO0FBQ0FELFlBQVFWLFlBQVIsQ0FBcUIsWUFBckIsK0JBQThEMUMsV0FBV3FELFlBQXpFOztBQUVBO0FBQ0EsUUFBSXJELFdBQVdzRCxlQUFmLEVBQWdDO0FBQzVCQztBQUNIO0FBQ0w7QUFDSUM7QUFDSCxDQTVERDs7QUE4REE7OztBQUdBLElBQU1ELDBCQUEwQixTQUExQkEsdUJBQTBCLEdBQXNEO0FBQUEsUUFBckRFLGNBQXFELHVFQUFwQzNDLEtBQUtkLFVBQUwsQ0FBZ0JzRCxlQUFvQjs7QUFDbEYsUUFBTUksUUFBUXhELFNBQVNnQixjQUFULENBQXdCLGtCQUF4QixDQUFkO0FBQ0EsU0FBSyxJQUFJeUMsR0FBVCxJQUFnQkYsY0FBaEIsRUFBZ0M7QUFDNUIsWUFBTUcsTUFBTTFELFNBQVMyRCxhQUFULENBQXVCLElBQXZCLENBQVo7O0FBRUEsWUFBTUMsTUFBTTVELFNBQVMyRCxhQUFULENBQXVCLElBQXZCLENBQVo7QUFDQUMsWUFBSWhDLFNBQUosR0FBZ0I2QixHQUFoQjtBQUNBQyxZQUFJRyxXQUFKLENBQWdCRCxHQUFoQjs7QUFFQSxZQUFNRSxPQUFPOUQsU0FBUzJELGFBQVQsQ0FBdUIsSUFBdkIsQ0FBYjtBQUNBRyxhQUFLbEMsU0FBTCxHQUFpQjJCLGVBQWVFLEdBQWYsQ0FBakI7QUFDQUMsWUFBSUcsV0FBSixDQUFnQkMsSUFBaEI7O0FBRUFOLGNBQU1LLFdBQU4sQ0FBa0JILEdBQWxCO0FBQ1A7QUFDQSxDQWZEOztBQWlCQTs7O0FBR0EsSUFBTUosa0JBQWtCLFNBQWxCQSxlQUFrQixHQUF1QztBQUFBLFFBQXRDUyxPQUFzQyx1RUFBNUJuRCxLQUFLZCxVQUFMLENBQWdCaUUsT0FBWTs7QUFDM0QsUUFBTUMsWUFBWWhFLFNBQVNnQixjQUFULENBQXdCLG1CQUF4QixDQUFsQjtBQUNBZ0QsY0FBVXhCLFlBQVYsQ0FBdUIsaUJBQXZCLEVBQTBDLGlCQUExQzs7QUFFQSxRQUFNeUIsUUFBUWpFLFNBQVMyRCxhQUFULENBQXVCLElBQXZCLENBQWQ7QUFDQU0sVUFBTXJDLFNBQU4sR0FBa0IsU0FBbEI7QUFDQXFDLFVBQU16QyxFQUFOLEdBQVcsaUJBQVg7QUFDQXdDLGNBQVVILFdBQVYsQ0FBc0JJLEtBQXRCOztBQUVBLFFBQUksQ0FBQ0YsT0FBTCxFQUFjO0FBQ1YsWUFBTUcsWUFBWWxFLFNBQVMyRCxhQUFULENBQXVCLEdBQXZCLENBQWxCO0FBQ0FPLGtCQUFVdEMsU0FBVixHQUFzQixpQkFBdEI7QUFDQW9DLGtCQUFVSCxXQUFWLENBQXNCSyxTQUF0QjtBQUNBO0FBQ0g7QUFDRCxRQUFNQyxLQUFLbkUsU0FBU2dCLGNBQVQsQ0FBd0IsY0FBeEIsQ0FBWDtBQUNBK0MsWUFBUUssT0FBUixDQUFnQixrQkFBVTtBQUN0QkQsV0FBR04sV0FBSCxDQUFlUSxpQkFBaUJDLE1BQWpCLENBQWY7QUFDSCxLQUZEO0FBR0FOLGNBQVVILFdBQVYsQ0FBc0JNLEVBQXRCO0FBQ0gsQ0FwQkQ7O0FBc0JBOzs7QUFHQSxJQUFNRSxtQkFBbUIsU0FBbkJBLGdCQUFtQixDQUFDQyxNQUFELEVBQVk7QUFDakMsUUFBTUMsS0FBS3ZFLFNBQVMyRCxhQUFULENBQXVCLElBQXZCLENBQVg7QUFDQSxRQUFNaEMsT0FBTzNCLFNBQVMyRCxhQUFULENBQXVCLEdBQXZCLENBQWI7QUFDQWhDLFNBQUtDLFNBQUwsR0FBaUIwQyxPQUFPM0MsSUFBeEI7QUFDQTRDLE9BQUdWLFdBQUgsQ0FBZWxDLElBQWY7O0FBRUEsUUFBTTZDLE9BQU94RSxTQUFTMkQsYUFBVCxDQUF1QixHQUF2QixDQUFiO0FBQ0FhLFNBQUs1QyxTQUFMLEdBQWlCMEMsT0FBT0UsSUFBeEI7QUFDQUQsT0FBR1YsV0FBSCxDQUFlVyxJQUFmOztBQUVBLFFBQU1DLFNBQVN6RSxTQUFTMkQsYUFBVCxDQUF1QixHQUF2QixDQUFmO0FBQ0FjLFdBQU83QyxTQUFQLGdCQUE4QjBDLE9BQU9HLE1BQXJDO0FBQ0FGLE9BQUdWLFdBQUgsQ0FBZVksTUFBZjs7QUFFQSxRQUFNQyxXQUFXMUUsU0FBUzJELGFBQVQsQ0FBdUIsR0FBdkIsQ0FBakI7QUFDQWUsYUFBUzlDLFNBQVQsR0FBcUIwQyxPQUFPSSxRQUE1QjtBQUNBSCxPQUFHVixXQUFILENBQWVhLFFBQWY7O0FBRUFILE9BQUdJLFFBQUgsR0FBYyxDQUFkOztBQUVBLFdBQU9KLEVBQVA7QUFDSCxDQXJCRDs7QUF1QkE7OztBQUdBLElBQU1oRSxpQkFBaUIsU0FBakJBLGNBQWlCLEdBQWtDO0FBQUEsUUFBakNULFVBQWlDLHVFQUFwQmMsS0FBS2QsVUFBZTs7QUFDckQsUUFBTThFLGFBQWE1RSxTQUFTZ0IsY0FBVCxDQUF3QixZQUF4QixDQUFuQjs7QUFFQSxRQUFNdUQsS0FBS3ZFLFNBQVMyRCxhQUFULENBQXVCLElBQXZCLENBQVg7QUFDQWlCLGVBQVdmLFdBQVgsQ0FBdUJVLEVBQXZCOztBQUVBLFFBQU1NLElBQUk3RSxTQUFTMkQsYUFBVCxDQUF1QixHQUF2QixDQUFWO0FBQ0FrQixNQUFFQyxJQUFGLEdBQVMsR0FBVDtBQUNBRCxNQUFFakQsU0FBRixHQUFjOUIsV0FBVzZCLElBQXpCO0FBQ0FrRCxNQUFFckMsWUFBRixDQUFlLGNBQWYsRUFBK0IsTUFBL0I7QUFDQStCLE9BQUdWLFdBQUgsQ0FBZWdCLENBQWY7QUFDSCxDQVhEOztBQWFBOzs7QUFHQSxJQUFNcEQscUJBQXFCLFNBQXJCQSxrQkFBcUIsQ0FBQ0UsSUFBRCxFQUFPb0QsR0FBUCxFQUFlO0FBQ3RDLFFBQUksQ0FBQ0EsR0FBTCxFQUNJQSxNQUFNckUsT0FBT3NFLFFBQVAsQ0FBZ0JGLElBQXRCO0FBQ0puRCxXQUFPQSxLQUFLc0QsT0FBTCxDQUFhLFNBQWIsRUFBd0IsTUFBeEIsQ0FBUDtBQUNBLFFBQU1DLFFBQVEsSUFBSUMsTUFBSixVQUFrQnhELElBQWxCLHVCQUFkO0FBQUEsUUFDUXlELFVBQVVGLE1BQU1HLElBQU4sQ0FBV04sR0FBWCxDQURsQjtBQUVBLFFBQUksQ0FBQ0ssT0FBTCxFQUNJLE9BQU8sSUFBUDtBQUNKLFFBQUksQ0FBQ0EsUUFBUSxDQUFSLENBQUwsRUFDSSxPQUFPLEVBQVA7QUFDSixXQUFPRSxtQkFBbUJGLFFBQVEsQ0FBUixFQUFXSCxPQUFYLENBQW1CLEtBQW5CLEVBQTBCLEdBQTFCLENBQW5CLENBQVA7QUFDSCxDQVhEIiwiZmlsZSI6InJlc3RhdXJhbnRfaW5mby5qcyIsInNvdXJjZXNDb250ZW50IjpbImxldCByZXN0YXVyYW50O1xyXG52YXIgbWFwO1xyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIChldmVudCkgPT4ge1xyXG4gICAgZmV0Y2hSZXN0YXVyYW50RnJvbVVSTChlcnJvciA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7IC8vIEdvdCBhbiBlcnJvciFcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZmlsbFJlc3RhdXJhbnRIVE1MKCk7XHJcbiAgICAgICAgICAgIGZpbGxCcmVhZGNydW1iKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBJbmNsdWRlIExhenlMb2FkIHBsdWdpblxyXG4gICAgICAgICAgICBnZXRMYXp5TG9hZFBsdWdpbigpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5jbHVkZSBtYXBzIGFwaSBkeW5hbWljYWxseSBvbmx5IGFmdGVyIGV2ZXJ5dGhpbmcgZWxzZSBoYXMgYmVlbiBkb25lXHJcbiAgICAgICAgICAgIGdldEdvb2dsZU1hcHNBcGkoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBHb29nbGUgbWFwLCBjYWxsZWQgZnJvbSBIVE1MLlxyXG4gKi9cclxud2luZG93LmluaXRNYXAgPSAoKSA9PiB7XHJcbiAgICBzZWxmLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpLCB7XHJcbiAgICAgICAgem9vbTogMTYsXHJcbiAgICAgICAgY2VudGVyOiBzZWxmLnJlc3RhdXJhbnQubGF0bG5nLFxyXG4gICAgICAgIHNjcm9sbHdoZWVsOiBmYWxzZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQWRkIG1hcmtlcnMgdG8gdGhlIG1hcCBhZnRlciBiZWluZyBpbml0aWFsaXplZFxyXG4gICAgREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChzZWxmLnJlc3RhdXJhbnQsIHNlbGYubWFwKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldCBjdXJyZW50IHJlc3RhdXJhbnQgZnJvbSBwYWdlIFVSTC5cclxuICovXHJcbmNvbnN0IGZldGNoUmVzdGF1cmFudEZyb21VUkwgPSAoY2FsbGJhY2spID0+IHtcclxuICAgIGlmIChzZWxmLnJlc3RhdXJhbnQpIHsgLy8gcmVzdGF1cmFudCBhbHJlYWR5IGZldGNoZWQhXHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgaWQgPSBnZXRQYXJhbWV0ZXJCeU5hbWUoJ2lkJyk7XHJcbiAgICBpZiAoIWlkKSB7IC8vIG5vIGlkIGZvdW5kIGluIFVSTFxyXG4gICAgICAgIGVycm9yID0gJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJ1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgKGVycm9yLCByZXN0YXVyYW50KSA9PiB7XHJcbiAgICAgICAgICAgIHNlbGYucmVzdGF1cmFudCA9IHJlc3RhdXJhbnQ7XHJcbiAgICAgICAgICAgIGlmICghcmVzdGF1cmFudCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIHJlc3RhdXJhbnQgSFRNTCBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlXHJcbiAqL1xyXG5jb25zdCBmaWxsUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCA9IHNlbGYucmVzdGF1cmFudCkgPT4ge1xyXG4gICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LW5hbWUnKTtcclxuICAgIG5hbWUuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xyXG5cclxuICAgIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1hZGRyZXNzJyk7XHJcbiAgICBhZGRyZXNzLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuYWRkcmVzcztcclxuXHJcbiAgICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWltZycpO1xyXG4gICAgaW1hZ2UuY2xhc3NOYW1lID0gJ3Jlc3RhdXJhbnQtaW1nIGxhenknO1xyXG4gICAgaW1hZ2UuYWx0ID0gcmVzdGF1cmFudC5uYW1lO1xyXG5cclxuICAgIGNvbnN0IGltYWdlRmlsZW5hbWUgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgICBpZiAoaW1hZ2VGaWxlbmFtZSA9PSAnbm9pbWcnKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudEltZ1NvdXJjZXNQaWN0dXJlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nLXNvdXJjZXMnKTtcclxuICAgICAgICAvLyBSZW1vdmUgc291cmNlcyBhbmQgaW1hZ2UgZnJvbSBwaWN0dXJlIHRvIGFkZCB0aGUgbm9pbWcgc291cmNlc1xyXG4gICAgICAgIHdoaWxlIChyZXN0YXVyYW50SW1nU291cmNlc1BpY3R1cmUuZmlyc3RDaGlsZCkge1xyXG4gICAgICAgICAgICByZXN0YXVyYW50SW1nU291cmNlc1BpY3R1cmUucmVtb3ZlQ2hpbGQocmVzdGF1cmFudEltZ1NvdXJjZXNQaWN0dXJlLmZpcnN0Q2hpbGQpO1xyXG4gICAgICAgIH1cclxuXHJcbi8vIElmIHJlc3RhdXJhbnQgaGFzIG5vdCBhbiBpbWFnZSwgZGlzcGxheSBhIG5vIGltYWdlIHN2Z1xyXG4vLyBhbmQgdXNlIGl0cyBjb3JyZXNwb25kaW5nIHBuZyBhcyBhIGZhbGxiYWNrLlxyXG4vLyBBdXRob3Igb2YgdGhlIG5vaW1nLnN2ZyBhbmQgbm9pbWcucG5nIGlzIGNyZWRpdGVkIGF0IHBhZ2UncyBmb290ZXIuXHJcbiAgICAgICAgY29uc3Qgbm9JbWdGYWxsYmFjayA9IGAke2ltYWdlRmlsZW5hbWV9LnBuZ2A7XHJcbiAgICAgICAgYWRkSW1hZ2VTb3VyY2VUb1BpY3R1cmUocmVzdGF1cmFudEltZ1NvdXJjZXNQaWN0dXJlLCBgJHtpbWFnZUZpbGVuYW1lfS5zdmdgKTtcclxuICAgICAgICBhZGRJbWFnZVNvdXJjZVRvUGljdHVyZShyZXN0YXVyYW50SW1nU291cmNlc1BpY3R1cmUsIG5vSW1nRmFsbGJhY2spO1xyXG5cclxuICAgICAgICBpbWFnZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtc3JjJywgbm9JbWdGYWxsYmFjayk7XHJcbiAgICAgICAgaW1hZ2UuY2xhc3NOYW1lICs9ICcgbm9pbWcnO1xyXG5cclxuICAgICAgICByZXN0YXVyYW50SW1nU291cmNlc1BpY3R1cmUuYXBwZW5kKGltYWdlKTtcclxuICAgICAgICAvLyBUT0RPOiBGaXggbm9pbWcgcG5nIGZhbGxiYWNrIGluIElFXHJcbiAgICB9IGVsc2Uge1xyXG4vLyBnZXQgYWxsIHBvc3NpYmxlIG5hbWVzIG9mIGFuIGltYWdlIGRlcGVuZGluZyBvbiBpdHMgc2l6ZSAoc21hbGwsIG1lZGl1bSwgbGFyZ2UpXHJcbiAgICAgICAgY29uc3QgaW1hZ2VzUmVzaXplZCA9IGltYWdlTmFtZXNCeVNpemUoaW1hZ2VGaWxlbmFtZSk7XHJcblxyXG4gICAgICAgIC8vIGFzc2lnbiBzcmNzZXQgYXR0cmlidXRlIGZvciBtZWRpdW0gcGljdHVyZSBzb3VyY2UgKG1lZGl1bSBzY3JlZW5zKVxyXG4gICAgICAgIGNvbnN0IHJlc3RhdXJhbnRJbWdNZWRpdW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1pbWctbWVkaXVtJyk7XHJcbiAgICAgICAgcmVzdGF1cmFudEltZ01lZGl1bS5zZXRBdHRyaWJ1dGUoJ2RhdGEtc3Jjc2V0JywgaW1hZ2VzUmVzaXplZC5tZWRpdW0pO1xyXG5cclxuICAgICAgICAvLyBhc3NpZ24gc3Jjc2V0IGF0dHJpYnV0ZSBmb3IgbGFyZ2UgcGljdHVyZSBzb3VyY2UgKG1lZGl1bSBzY3JlZW5zKVxyXG4gICAgICAgIGNvbnN0IHJlc3RhdXJhbnRJbWdNZWRpdW1MYXJnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWltZy1tZWRpdW0tbGFyZ2UnKTtcclxuICAgICAgICByZXN0YXVyYW50SW1nTWVkaXVtTGFyZ2Uuc2V0QXR0cmlidXRlKCdkYXRhLXNyY3NldCcsIGltYWdlc1Jlc2l6ZWQubGFyZ2UpO1xyXG5cclxuICAgICAgICAvLyBhc3NpZ24gc3Jjc2V0IGF0dHJpYnV0ZSBmb3IgbGFyZ2UgcGljdHVyZSBzb3VyY2UgKGxhcmdlIHNjcmVlbnMpXHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudEltZ0xhcmdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nLWxhcmdlJyk7XHJcbiAgICAgICAgcmVzdGF1cmFudEltZ0xhcmdlLnNldEF0dHJpYnV0ZSgnZGF0YS1zcmNzZXQnLCBgJHtpbWFnZXNSZXNpemVkLm1lZGl1bX0gMXgsICR7aW1hZ2VzUmVzaXplZC5sYXJnZX0gMnhgKTtcclxuXHJcbiAgICAgICAgaW1hZ2Uuc2V0QXR0cmlidXRlKCdkYXRhLXNyYycsIGltYWdlc1Jlc2l6ZWQuc21hbGwpOyAvLyBzbWFsbCBpbWFnZSBieSBkZWZhdWx0XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY3Vpc2luZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWN1aXNpbmUnKTtcclxuICAgIGN1aXNpbmUuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5jdWlzaW5lX3R5cGU7XHJcbiAgICBjdWlzaW5lLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIGBSZXN0YXVyYW50IGN1aXNpbmUgdHlwZSAke3Jlc3RhdXJhbnQuY3Vpc2luZV90eXBlfWApO1xyXG5cclxuICAgIC8vIGZpbGwgb3BlcmF0aW5nIGhvdXJzXHJcbiAgICBpZiAocmVzdGF1cmFudC5vcGVyYXRpbmdfaG91cnMpIHtcclxuICAgICAgICBmaWxsUmVzdGF1cmFudEhvdXJzSFRNTCgpO1xyXG4gICAgfVxyXG4vLyBmaWxsIHJldmlld3NcclxuICAgIGZpbGxSZXZpZXdzSFRNTCgpO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIHJlc3RhdXJhbnQgb3BlcmF0aW5nIGhvdXJzIEhUTUwgdGFibGUgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZS5cclxuICovXHJcbmNvbnN0IGZpbGxSZXN0YXVyYW50SG91cnNIVE1MID0gKG9wZXJhdGluZ0hvdXJzID0gc2VsZi5yZXN0YXVyYW50Lm9wZXJhdGluZ19ob3VycykgPT4ge1xyXG4gICAgY29uc3QgaG91cnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1ob3VycycpO1xyXG4gICAgZm9yIChsZXQga2V5IGluIG9wZXJhdGluZ0hvdXJzKSB7XHJcbiAgICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcclxuICAgICAgICBkYXkuaW5uZXJIVE1MID0ga2V5O1xyXG4gICAgICAgIHJvdy5hcHBlbmRDaGlsZChkYXkpO1xyXG5cclxuICAgICAgICBjb25zdCB0aW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcclxuICAgICAgICB0aW1lLmlubmVySFRNTCA9IG9wZXJhdGluZ0hvdXJzW2tleV07XHJcbiAgICAgICAgcm93LmFwcGVuZENoaWxkKHRpbWUpO1xyXG5cclxuICAgICAgICBob3Vycy5hcHBlbmRDaGlsZChyb3cpO1xyXG59XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgYWxsIHJldmlld3MgSFRNTCBhbmQgYWRkIHRoZW0gdG8gdGhlIHdlYnBhZ2UuXHJcbiAqL1xyXG5jb25zdCBmaWxsUmV2aWV3c0hUTUwgPSAocmV2aWV3cyA9IHNlbGYucmVzdGF1cmFudC5yZXZpZXdzKSA9PiB7XHJcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1jb250YWluZXInKTtcclxuICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWxsZWRieScsICdyZXZpZXdzLWhlYWRpbmcnKTtcclxuXHJcbiAgICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gzJyk7XHJcbiAgICB0aXRsZS5pbm5lckhUTUwgPSAnUmV2aWV3cyc7XHJcbiAgICB0aXRsZS5pZCA9ICdyZXZpZXdzLWhlYWRpbmcnO1xyXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRpdGxlKTtcclxuXHJcbiAgICBpZiAoIXJldmlld3MpIHtcclxuICAgICAgICBjb25zdCBub1Jldmlld3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICAgICAgbm9SZXZpZXdzLmlubmVySFRNTCA9ICdObyByZXZpZXdzIHlldCEnO1xyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChub1Jldmlld3MpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld3MtbGlzdCcpO1xyXG4gICAgcmV2aWV3cy5mb3JFYWNoKHJldmlldyA9PiB7XHJcbiAgICAgICAgdWwuYXBwZW5kQ2hpbGQoY3JlYXRlUmV2aWV3SFRNTChyZXZpZXcpKTtcclxuICAgIH0pO1xyXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHVsKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSByZXZpZXcgSFRNTCBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxyXG4gKi9cclxuY29uc3QgY3JlYXRlUmV2aWV3SFRNTCA9IChyZXZpZXcpID0+IHtcclxuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBuYW1lLmlubmVySFRNTCA9IHJldmlldy5uYW1lO1xyXG4gICAgbGkuYXBwZW5kQ2hpbGQobmFtZSk7XHJcblxyXG4gICAgY29uc3QgZGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIGRhdGUuaW5uZXJIVE1MID0gcmV2aWV3LmRhdGU7XHJcbiAgICBsaS5hcHBlbmRDaGlsZChkYXRlKTtcclxuXHJcbiAgICBjb25zdCByYXRpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICByYXRpbmcuaW5uZXJIVE1MID0gYFJhdGluZzogJHtyZXZpZXcucmF0aW5nfWA7XHJcbiAgICBsaS5hcHBlbmRDaGlsZChyYXRpbmcpO1xyXG5cclxuICAgIGNvbnN0IGNvbW1lbnRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgY29tbWVudHMuaW5uZXJIVE1MID0gcmV2aWV3LmNvbW1lbnRzO1xyXG4gICAgbGkuYXBwZW5kQ2hpbGQoY29tbWVudHMpO1xyXG5cclxuICAgIGxpLnRhYkluZGV4ID0gMDtcclxuXHJcbiAgICByZXR1cm4gbGk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBZGQgcmVzdGF1cmFudCBuYW1lIHRvIHRoZSBicmVhZGNydW1iIG5hdmlnYXRpb24gbWVudVxyXG4gKi9cclxuY29uc3QgZmlsbEJyZWFkY3J1bWIgPSAocmVzdGF1cmFudCA9IHNlbGYucmVzdGF1cmFudCkgPT4ge1xyXG4gICAgY29uc3QgYnJlYWRjcnVtYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdicmVhZGNydW1iJyk7XHJcblxyXG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgYnJlYWRjcnVtYi5hcHBlbmRDaGlsZChsaSk7XHJcblxyXG4gICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgIGEuaHJlZiA9ICcjJztcclxuICAgIGEuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xyXG4gICAgYS5zZXRBdHRyaWJ1dGUoJ2FyaWEtY3VycmVudCcsICdwYWdlJyk7XHJcbiAgICBsaS5hcHBlbmRDaGlsZChhKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldCBhIHBhcmFtZXRlciBieSBuYW1lIGZyb20gcGFnZSBVUkwuXHJcbiAqL1xyXG5jb25zdCBnZXRQYXJhbWV0ZXJCeU5hbWUgPSAobmFtZSwgdXJsKSA9PiB7XHJcbiAgICBpZiAoIXVybClcclxuICAgICAgICB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcclxuICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoL1tcXFtcXF1dL2csICdcXFxcJCYnKTtcclxuICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgWz8mXSR7bmFtZX0oPShbXiYjXSopfCZ8I3wkKWApLFxyXG4gICAgICAgICAgICByZXN1bHRzID0gcmVnZXguZXhlYyh1cmwpO1xyXG4gICAgaWYgKCFyZXN1bHRzKVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgaWYgKCFyZXN1bHRzWzJdKVxyXG4gICAgICAgIHJldHVybiAnJztcclxuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocmVzdWx0c1syXS5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XHJcbn1cclxuIl19
