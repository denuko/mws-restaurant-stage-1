'use strict';

var restaurant = void 0;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = function () {
    fetchRestaurantFromURL(function (error, restaurant) {
        if (error) {
            // Got an error!
            console.error(error);
        } else {
            self.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 16,
                center: restaurant.latlng,
                scrollwheel: false
            });
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        }
    });
};

/**
 * Get current restaurant from page URL.
 */
var fetchRestaurantFromURL = function fetchRestaurantFromURL(callback) {
    if (self.restaurant) {
        // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    var id = getParameterByName('id');
    if (!id) {
        // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, function (error, restaurant) {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3RhdXJhbnRfaW5mby5qcyJdLCJuYW1lcyI6WyJyZXN0YXVyYW50IiwibWFwIiwid2luZG93IiwiaW5pdE1hcCIsImZldGNoUmVzdGF1cmFudEZyb21VUkwiLCJlcnJvciIsImNvbnNvbGUiLCJzZWxmIiwiZ29vZ2xlIiwibWFwcyIsIk1hcCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJ6b29tIiwiY2VudGVyIiwibGF0bG5nIiwic2Nyb2xsd2hlZWwiLCJmaWxsQnJlYWRjcnVtYiIsIkRCSGVscGVyIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsImNhbGxiYWNrIiwiaWQiLCJnZXRQYXJhbWV0ZXJCeU5hbWUiLCJmZXRjaFJlc3RhdXJhbnRCeUlkIiwiZmlsbFJlc3RhdXJhbnRIVE1MIiwibmFtZSIsImlubmVySFRNTCIsImFkZHJlc3MiLCJpbWFnZSIsImNsYXNzTmFtZSIsImFsdCIsImltYWdlRmlsZW5hbWUiLCJpbWFnZVVybEZvclJlc3RhdXJhbnQiLCJyZXN0YXVyYW50SW1nU291cmNlc1BpY3R1cmUiLCJmaXJzdENoaWxkIiwicmVtb3ZlQ2hpbGQiLCJub0ltZ0ZhbGxiYWNrIiwiYWRkSW1hZ2VTb3VyY2VUb1BpY3R1cmUiLCJzcmMiLCJhcHBlbmQiLCJpbWFnZXNSZXNpemVkIiwiaW1hZ2VOYW1lc0J5U2l6ZSIsInJlc3RhdXJhbnRJbWdNZWRpdW0iLCJzcmNzZXQiLCJtZWRpdW0iLCJyZXN0YXVyYW50SW1nTWVkaXVtTGFyZ2UiLCJsYXJnZSIsInJlc3RhdXJhbnRJbWdMYXJnZSIsInNtYWxsIiwiY3Vpc2luZSIsImN1aXNpbmVfdHlwZSIsInNldEF0dHJpYnV0ZSIsIm9wZXJhdGluZ19ob3VycyIsImZpbGxSZXN0YXVyYW50SG91cnNIVE1MIiwiZmlsbFJldmlld3NIVE1MIiwib3BlcmF0aW5nSG91cnMiLCJob3VycyIsImtleSIsInJvdyIsImNyZWF0ZUVsZW1lbnQiLCJkYXkiLCJhcHBlbmRDaGlsZCIsInRpbWUiLCJyZXZpZXdzIiwiY29udGFpbmVyIiwidGl0bGUiLCJub1Jldmlld3MiLCJ1bCIsImZvckVhY2giLCJjcmVhdGVSZXZpZXdIVE1MIiwicmV2aWV3IiwibGkiLCJkYXRlIiwicmF0aW5nIiwiY29tbWVudHMiLCJ0YWJJbmRleCIsImJyZWFkY3J1bWIiLCJhIiwiaHJlZiIsInVybCIsImxvY2F0aW9uIiwicmVwbGFjZSIsInJlZ2V4IiwiUmVnRXhwIiwicmVzdWx0cyIsImV4ZWMiLCJkZWNvZGVVUklDb21wb25lbnQiXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBSUEsbUJBQUo7QUFDQSxJQUFJQyxHQUFKOztBQUVBOzs7QUFHQUMsT0FBT0MsT0FBUCxHQUFpQixZQUFNO0FBQ25CQywyQkFBdUIsVUFBQ0MsS0FBRCxFQUFRTCxVQUFSLEVBQXVCO0FBQzFDLFlBQUlLLEtBQUosRUFBVztBQUFFO0FBQ1RDLG9CQUFRRCxLQUFSLENBQWNBLEtBQWQ7QUFDSCxTQUZELE1BRU87QUFDSEUsaUJBQUtOLEdBQUwsR0FBVyxJQUFJTyxPQUFPQyxJQUFQLENBQVlDLEdBQWhCLENBQW9CQyxTQUFTQyxjQUFULENBQXdCLEtBQXhCLENBQXBCLEVBQW9EO0FBQzNEQyxzQkFBTSxFQURxRDtBQUUzREMsd0JBQVFkLFdBQVdlLE1BRndDO0FBRzNEQyw2QkFBYTtBQUg4QyxhQUFwRCxDQUFYO0FBS0FDO0FBQ0FDLHFCQUFTQyxzQkFBVCxDQUFnQ1osS0FBS1AsVUFBckMsRUFBaURPLEtBQUtOLEdBQXREO0FBQ0g7QUFDSixLQVpEO0FBYUgsQ0FkRDs7QUFnQkE7OztBQUdBLElBQU1HLHlCQUF5QixTQUF6QkEsc0JBQXlCLENBQUNnQixRQUFELEVBQWM7QUFDekMsUUFBSWIsS0FBS1AsVUFBVCxFQUFxQjtBQUFFO0FBQ25Cb0IsaUJBQVMsSUFBVCxFQUFlYixLQUFLUCxVQUFwQjtBQUNBO0FBQ0g7QUFDRCxRQUFNcUIsS0FBS0MsbUJBQW1CLElBQW5CLENBQVg7QUFDQSxRQUFJLENBQUNELEVBQUwsRUFBUztBQUFFO0FBQ1BoQixnQkFB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O0FBQ3JELFFBQU00RSxhQUFhakUsU0FBU0MsY0FBVCxDQUF3QixZQUF4QixDQUFuQjs7QUFFQSxRQUFNMkQsS0FBSzVELFNBQVNnRCxhQUFULENBQXVCLElBQXZCLENBQVg7QUFDQWlCLGVBQVdmLFdBQVgsQ0FBdUJVLEVBQXZCOztBQUVBLFFBQU1NLElBQUlsRSxTQUFTZ0QsYUFBVCxDQUF1QixHQUF2QixDQUFWO0FBQ0FrQixNQUFFQyxJQUFGLEdBQVMsR0FBVDtBQUNBRCxNQUFFbkQsU0FBRixHQUFjMUIsV0FBV3lCLElBQXpCO0FBQ0FvRCxNQUFFMUIsWUFBRixDQUFlLGNBQWYsRUFBK0IsTUFBL0I7QUFDQW9CLE9BQUdWLFdBQUgsQ0FBZWdCLENBQWY7QUFDSCxDQVhEOztBQWFBOzs7QUFHQSxJQUFNdkQscUJBQXFCLFNBQXJCQSxrQkFBcUIsQ0FBQ0csSUFBRCxFQUFPc0QsR0FBUCxFQUFlO0FBQ3RDLFFBQUksQ0FBQ0EsR0FBTCxFQUNJQSxNQUFNN0UsT0FBTzhFLFFBQVAsQ0FBZ0JGLElBQXRCO0FBQ0pyRCxXQUFPQSxLQUFLd0QsT0FBTCxDQUFhLFNBQWIsRUFBd0IsTUFBeEIsQ0FBUDtBQUNBLFFBQU1DLFFBQVEsSUFBSUMsTUFBSixVQUFrQjFELElBQWxCLHVCQUFkO0FBQUEsUUFDUTJELFVBQVVGLE1BQU1HLElBQU4sQ0FBV04sR0FBWCxDQURsQjtBQUVBLFFBQUksQ0FBQ0ssT0FBTCxFQUNJLE9BQU8sSUFBUDtBQUNKLFFBQUksQ0FBQ0EsUUFBUSxDQUFSLENBQUwsRUFDSSxPQUFPLEVBQVA7QUFDSixXQUFPRSxtQkFBbUJGLFFBQVEsQ0FBUixFQUFXSCxPQUFYLENBQW1CLEtBQW5CLEVBQTBCLEdBQTFCLENBQW5CLENBQVA7QUFDSCxDQVhEIiwiZmlsZSI6InJlc3RhdXJhbnRfaW5mby5qcyIsInNvdXJjZXNDb250ZW50IjpbImxldCByZXN0YXVyYW50O1xyXG52YXIgbWFwO1xyXG5cclxuLyoqXHJcbiAqIEluaXRpYWxpemUgR29vZ2xlIG1hcCwgY2FsbGVkIGZyb20gSFRNTC5cclxuICovXHJcbndpbmRvdy5pbml0TWFwID0gKCkgPT4ge1xyXG4gICAgZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCgoZXJyb3IsIHJlc3RhdXJhbnQpID0+IHtcclxuICAgICAgICBpZiAoZXJyb3IpIHsgLy8gR290IGFuIGVycm9yIVxyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZWxmLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpLCB7XHJcbiAgICAgICAgICAgICAgICB6b29tOiAxNixcclxuICAgICAgICAgICAgICAgIGNlbnRlcjogcmVzdGF1cmFudC5sYXRsbmcsXHJcbiAgICAgICAgICAgICAgICBzY3JvbGx3aGVlbDogZmFsc2VcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGZpbGxCcmVhZGNydW1iKCk7XHJcbiAgICAgICAgICAgIERCSGVscGVyLm1hcE1hcmtlckZvclJlc3RhdXJhbnQoc2VsZi5yZXN0YXVyYW50LCBzZWxmLm1hcCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXQgY3VycmVudCByZXN0YXVyYW50IGZyb20gcGFnZSBVUkwuXHJcbiAqL1xyXG5jb25zdCBmZXRjaFJlc3RhdXJhbnRGcm9tVVJMID0gKGNhbGxiYWNrKSA9PiB7XHJcbiAgICBpZiAoc2VsZi5yZXN0YXVyYW50KSB7IC8vIHJlc3RhdXJhbnQgYWxyZWFkeSBmZXRjaGVkIVxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHNlbGYucmVzdGF1cmFudClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBpZCA9IGdldFBhcmFtZXRlckJ5TmFtZSgnaWQnKTtcclxuICAgIGlmICghaWQpIHsgLy8gbm8gaWQgZm91bmQgaW4gVVJMXHJcbiAgICAgICAgZXJyb3IgPSAnTm8gcmVzdGF1cmFudCBpZCBpbiBVUkwnXHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRCeUlkKGlkLCAoZXJyb3IsIHJlc3RhdXJhbnQpID0+IHtcclxuICAgICAgICAgICAgc2VsZi5yZXN0YXVyYW50ID0gcmVzdGF1cmFudDtcclxuICAgICAgICAgICAgaWYgKCFyZXN0YXVyYW50KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmaWxsUmVzdGF1cmFudEhUTUwoKTtcclxuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudClcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSByZXN0YXVyYW50IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZVxyXG4gKi9cclxuY29uc3QgZmlsbFJlc3RhdXJhbnRIVE1MID0gKHJlc3RhdXJhbnQgPSBzZWxmLnJlc3RhdXJhbnQpID0+IHtcclxuICAgIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1uYW1lJyk7XHJcbiAgICBuYW1lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcclxuXHJcbiAgICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtYWRkcmVzcycpO1xyXG4gICAgYWRkcmVzcy5pbm5lckhUTUwgPSByZXN0YXVyYW50LmFkZHJlc3M7XHJcblxyXG4gICAgY29uc3QgaW1hZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1pbWcnKTtcclxuICAgIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZyc7XHJcbiAgICBpbWFnZS5hbHQgPSByZXN0YXVyYW50Lm5hbWU7XHJcblxyXG4gICAgY29uc3QgaW1hZ2VGaWxlbmFtZSA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICAgIGlmIChpbWFnZUZpbGVuYW1lID09ICdub2ltZycpIHtcclxuICAgICAgICBjb25zdCByZXN0YXVyYW50SW1nU291cmNlc1BpY3R1cmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1pbWctc291cmNlcycpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBzb3VyY2VzIGFuZCBpbWFnZSBmcm9tIHBpY3R1cmUgdG8gYWRkIHRoZSBub2ltZyBzb3VyY2VzXHJcbiAgICAgICAgd2hpbGUgKHJlc3RhdXJhbnRJbWdTb3VyY2VzUGljdHVyZS5maXJzdENoaWxkKSB7XHJcbiAgICAgICAgICAgIHJlc3RhdXJhbnRJbWdTb3VyY2VzUGljdHVyZS5yZW1vdmVDaGlsZChyZXN0YXVyYW50SW1nU291cmNlc1BpY3R1cmUuZmlyc3RDaGlsZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiByZXN0YXVyYW50IGhhcyBub3QgYW4gaW1hZ2UsIGRpc3BsYXkgYSBubyBpbWFnZSBzdmdcclxuICAgICAgICAvLyBhbmQgdXNlIGl0cyBjb3JyZXNwb25kaW5nIHBuZyBhcyBhIGZhbGxiYWNrLlxyXG4gICAgICAgIC8vIEF1dGhvciBvZiB0aGUgbm9pbWcuc3ZnIGFuZCBub2ltZy5wbmcgaXMgY3JlZGl0ZWQgYXQgcGFnZSdzIGZvb3Rlci5cclxuICAgICAgICBjb25zdCBub0ltZ0ZhbGxiYWNrID0gYCR7aW1hZ2VGaWxlbmFtZX0ucG5nYDtcclxuICAgICAgICBhZGRJbWFnZVNvdXJjZVRvUGljdHVyZShyZXN0YXVyYW50SW1nU291cmNlc1BpY3R1cmUsIGAke2ltYWdlRmlsZW5hbWV9LnN2Z2ApO1xyXG4gICAgICAgIGFkZEltYWdlU291cmNlVG9QaWN0dXJlKHJlc3RhdXJhbnRJbWdTb3VyY2VzUGljdHVyZSwgbm9JbWdGYWxsYmFjayk7XHJcblxyXG4gICAgICAgIGltYWdlLnNyYyA9IG5vSW1nRmFsbGJhY2s7XHJcbiAgICAgICAgaW1hZ2UuY2xhc3NOYW1lICs9ICcgbm9pbWcnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJlc3RhdXJhbnRJbWdTb3VyY2VzUGljdHVyZS5hcHBlbmQoaW1hZ2UpO1xyXG4gICAgICAgIC8vIFRPRE86IEZpeCBub2ltZyBzdmcgcmVzcG9uc2l2ZSBoZWlnaHRcclxuICAgICAgICAvLyBUT0RPOiBGaXggbm9pbWcgcG5nIGZhbGxiYWNrIGluIElFXHJcbiAgICAgICAgLy8gVE9ETzogQ2FjaGUgbm9pbWcgc3ZnIGFuZCBwbmdcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gZ2V0IGFsbCBwb3NzaWJsZSBuYW1lcyBvZiBhbiBpbWFnZSBkZXBlbmRpbmcgb24gaXRzIHNpemUgKHNtYWxsLCBtZWRpdW0sIGxhcmdlKVxyXG4gICAgICAgIGNvbnN0IGltYWdlc1Jlc2l6ZWQgPSBpbWFnZU5hbWVzQnlTaXplKGltYWdlRmlsZW5hbWUpO1xyXG5cclxuICAgICAgICAvLyBhc3NpZ24gc3Jjc2V0IGF0dHJpYnV0ZSBmb3IgbWVkaXVtIHBpY3R1cmUgc291cmNlIChtZWRpdW0gc2NyZWVucylcclxuICAgICAgICBjb25zdCByZXN0YXVyYW50SW1nTWVkaXVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nLW1lZGl1bScpO1xyXG4gICAgICAgIHJlc3RhdXJhbnRJbWdNZWRpdW0uc3Jjc2V0ID0gaW1hZ2VzUmVzaXplZC5tZWRpdW07XHJcblxyXG4gICAgICAgIC8vIGFzc2lnbiBzcmNzZXQgYXR0cmlidXRlIGZvciBsYXJnZSBwaWN0dXJlIHNvdXJjZSAobWVkaXVtIHNjcmVlbnMpXHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudEltZ01lZGl1bUxhcmdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nLW1lZGl1bS1sYXJnZScpO1xyXG4gICAgICAgIHJlc3RhdXJhbnRJbWdNZWRpdW1MYXJnZS5zcmNzZXQgPSBpbWFnZXNSZXNpemVkLmxhcmdlO1xyXG5cclxuICAgICAgICAvLyBhc3NpZ24gc3Jjc2V0IGF0dHJpYnV0ZSBmb3IgbGFyZ2UgcGljdHVyZSBzb3VyY2UgKGxhcmdlIHNjcmVlbnMpXHJcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudEltZ0xhcmdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nLWxhcmdlJyk7XHJcbiAgICAgICAgcmVzdGF1cmFudEltZ0xhcmdlLnNyY3NldCA9IGAke2ltYWdlc1Jlc2l6ZWQubWVkaXVtfSAxeCwgJHtpbWFnZXNSZXNpemVkLmxhcmdlfSAyeGA7XHJcblxyXG4gICAgICAgIGltYWdlLnNyYyA9IGltYWdlc1Jlc2l6ZWQuc21hbGw7ICAgLy8gc21hbGwgaW1hZ2UgYnkgZGVmYXVsdFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGN1aXNpbmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1jdWlzaW5lJyk7XHJcbiAgICBjdWlzaW5lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuY3Vpc2luZV90eXBlO1xyXG4gICAgY3Vpc2luZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCBgUmVzdGF1cmFudCBjdWlzaW5lIHR5cGUgJHtyZXN0YXVyYW50LmN1aXNpbmVfdHlwZX1gKTtcclxuXHJcbiAgICAvLyBmaWxsIG9wZXJhdGluZyBob3Vyc1xyXG4gICAgaWYgKHJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSB7XHJcbiAgICAgICAgZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwoKTtcclxuICAgIH1cclxuICAgIC8vIGZpbGwgcmV2aWV3c1xyXG4gICAgZmlsbFJldmlld3NIVE1MKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBvcGVyYXRpbmcgaG91cnMgSFRNTCB0YWJsZSBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxyXG4gKi9cclxuY29uc3QgZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwgPSAob3BlcmF0aW5nSG91cnMgPSBzZWxmLnJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSA9PiB7XHJcbiAgICBjb25zdCBob3VycyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50LWhvdXJzJyk7XHJcbiAgICBmb3IgKGxldCBrZXkgaW4gb3BlcmF0aW5nSG91cnMpIHtcclxuICAgICAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xyXG5cclxuICAgICAgICBjb25zdCBkYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xyXG4gICAgICAgIGRheS5pbm5lckhUTUwgPSBrZXk7XHJcbiAgICAgICAgcm93LmFwcGVuZENoaWxkKGRheSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHRpbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xyXG4gICAgICAgIHRpbWUuaW5uZXJIVE1MID0gb3BlcmF0aW5nSG91cnNba2V5XTtcclxuICAgICAgICByb3cuYXBwZW5kQ2hpbGQodGltZSk7XHJcblxyXG4gICAgICAgIGhvdXJzLmFwcGVuZENoaWxkKHJvdyk7XHJcbn1cclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhbGwgcmV2aWV3cyBIVE1MIGFuZCBhZGQgdGhlbSB0byB0aGUgd2VicGFnZS5cclxuICovXHJcbmNvbnN0IGZpbGxSZXZpZXdzSFRNTCA9IChyZXZpZXdzID0gc2VsZi5yZXN0YXVyYW50LnJldmlld3MpID0+IHtcclxuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWNvbnRhaW5lcicpO1xyXG4gICAgY29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbGxlZGJ5JywgJ3Jldmlld3MtaGVhZGluZycpO1xyXG5cclxuICAgIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDMnKTtcclxuICAgIHRpdGxlLmlubmVySFRNTCA9ICdSZXZpZXdzJztcclxuICAgIHRpdGxlLmlkID0gJ3Jldmlld3MtaGVhZGluZyc7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGl0bGUpO1xyXG5cclxuICAgIGlmICghcmV2aWV3cykge1xyXG4gICAgICAgIGNvbnN0IG5vUmV2aWV3cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgICAgICBub1Jldmlld3MuaW5uZXJIVE1MID0gJ05vIHJldmlld3MgeWV0ISc7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG5vUmV2aWV3cyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XHJcbiAgICByZXZpZXdzLmZvckVhY2gocmV2aWV3ID0+IHtcclxuICAgICAgICB1bC5hcHBlbmRDaGlsZChjcmVhdGVSZXZpZXdIVE1MKHJldmlldykpO1xyXG4gICAgfSk7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodWwpO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIHJldmlldyBIVE1MIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2UuXHJcbiAqL1xyXG5jb25zdCBjcmVhdGVSZXZpZXdIVE1MID0gKHJldmlldykgPT4ge1xyXG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIG5hbWUuaW5uZXJIVE1MID0gcmV2aWV3Lm5hbWU7XHJcbiAgICBsaS5hcHBlbmRDaGlsZChuYW1lKTtcclxuXHJcbiAgICBjb25zdCBkYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gICAgZGF0ZS5pbm5lckhUTUwgPSByZXZpZXcuZGF0ZTtcclxuICAgIGxpLmFwcGVuZENoaWxkKGRhdGUpO1xyXG5cclxuICAgIGNvbnN0IHJhdGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgIHJhdGluZy5pbm5lckhUTUwgPSBgUmF0aW5nOiAke3Jldmlldy5yYXRpbmd9YDtcclxuICAgIGxpLmFwcGVuZENoaWxkKHJhdGluZyk7XHJcblxyXG4gICAgY29uc3QgY29tbWVudHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgICBjb21tZW50cy5pbm5lckhUTUwgPSByZXZpZXcuY29tbWVudHM7XHJcbiAgICBsaS5hcHBlbmRDaGlsZChjb21tZW50cyk7XHJcblxyXG4gICAgbGkudGFiSW5kZXggPSAwO1xyXG5cclxuICAgIHJldHVybiBsaTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFkZCByZXN0YXVyYW50IG5hbWUgdG8gdGhlIGJyZWFkY3J1bWIgbmF2aWdhdGlvbiBtZW51XHJcbiAqL1xyXG5jb25zdCBmaWxsQnJlYWRjcnVtYiA9IChyZXN0YXVyYW50ID0gc2VsZi5yZXN0YXVyYW50KSA9PiB7XHJcbiAgICBjb25zdCBicmVhZGNydW1iID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JyZWFkY3J1bWInKTtcclxuXHJcbiAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgICBicmVhZGNydW1iLmFwcGVuZENoaWxkKGxpKTtcclxuXHJcbiAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgYS5ocmVmID0gJyMnO1xyXG4gICAgYS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcbiAgICBhLnNldEF0dHJpYnV0ZSgnYXJpYS1jdXJyZW50JywgJ3BhZ2UnKTtcclxuICAgIGxpLmFwcGVuZENoaWxkKGEpO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0IGEgcGFyYW1ldGVyIGJ5IG5hbWUgZnJvbSBwYWdlIFVSTC5cclxuICovXHJcbmNvbnN0IGdldFBhcmFtZXRlckJ5TmFtZSA9IChuYW1lLCB1cmwpID0+IHtcclxuICAgIGlmICghdXJsKVxyXG4gICAgICAgIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xyXG4gICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgJ1xcXFwkJicpO1xyXG4gICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGBbPyZdJHtuYW1lfSg9KFteJiNdKil8JnwjfCQpYCksXHJcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZWdleC5leGVjKHVybCk7XHJcbiAgICBpZiAoIXJlc3VsdHMpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICBpZiAoIXJlc3VsdHNbMl0pXHJcbiAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzJdLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcclxufVxyXG4iXX0=
