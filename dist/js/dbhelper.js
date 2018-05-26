'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Common database helper functions.
 */
var DBHelper = function () {
    function DBHelper() {
        _classCallCheck(this, DBHelper);
    }

    _createClass(DBHelper, null, [{
        key: 'fetchRestaurants',


        /**
         * Fetch all restaurants.
         */
        value: function fetchRestaurants(callback) {
            fetch(DBHelper.DATABASE_URL).then(function (response) {
                return response.json();
            }).then(function (restaurants) {
                callback(null, restaurants);
            }).catch(function (error) {
                callback(error, null);
            });
        }

        /**
         * Fetch a restaurant by its ID.
         */

    }, {
        key: 'fetchRestaurantById',
        value: function fetchRestaurantById(id, callback) {
            // fetch all restaurants with proper error handling.
            DBHelper.fetchRestaurants(function (error, restaurants) {
                if (error) {
                    callback(error, null);
                } else {
                    var restaurant = restaurants.find(function (r) {
                        return r.id == id;
                    });
                    if (restaurant) {
                        // Got the restaurant
                        callback(null, restaurant);
                    } else {
                        // Restaurant does not exist in the database
                        callback('Restaurant does not exist', null);
                    }
                }
            });
        }

        /**
         * Fetch restaurants by a cuisine type with proper error handling.
         */

    }, {
        key: 'fetchRestaurantByCuisine',
        value: function fetchRestaurantByCuisine(cuisine, callback) {
            // Fetch all restaurants  with proper error handling
            DBHelper.fetchRestaurants(function (error, restaurants) {
                if (error) {
                    callback(error, null);
                } else {
                    // Filter restaurants to have only given cuisine type
                    var results = restaurants.filter(function (r) {
                        return r.cuisine_type == cuisine;
                    });
                    callback(null, results);
                }
            });
        }

        /**
         * Fetch restaurants by a neighborhood with proper error handling.
         */

    }, {
        key: 'fetchRestaurantByNeighborhood',
        value: function fetchRestaurantByNeighborhood(neighborhood, callback) {
            // Fetch all restaurants
            DBHelper.fetchRestaurants(function (error, restaurants) {
                if (error) {
                    callback(error, null);
                } else {
                    // Filter restaurants to have only given neighborhood
                    var results = restaurants.filter(function (r) {
                        return r.neighborhood == neighborhood;
                    });
                    callback(null, results);
                }
            });
        }

        /**
         * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
         */

    }, {
        key: 'fetchRestaurantByCuisineAndNeighborhood',
        value: function fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
            // Fetch all restaurants
            DBHelper.fetchRestaurants(function (error, restaurants) {
                if (error) {
                    callback(error, null);
                } else {
                    var results = restaurants;
                    if (cuisine != 'all') {
                        // filter by cuisine
                        results = results.filter(function (r) {
                            return r.cuisine_type == cuisine;
                        });
                    }
                    if (neighborhood != 'all') {
                        // filter by neighborhood
                        results = results.filter(function (r) {
                            return r.neighborhood == neighborhood;
                        });
                    }
                    callback(null, results);
                }
            });
        }

        /**
         * Fetch all neighborhoods with proper error handling.
         */

    }, {
        key: 'fetchNeighborhoods',
        value: function fetchNeighborhoods(callback) {
            // Fetch all restaurants
            DBHelper.fetchRestaurants(function (error, restaurants) {
                if (error) {
                    callback(error, null);
                } else {
                    // Get all neighborhoods from all restaurants
                    var neighborhoods = restaurants.map(function (v, i) {
                        return restaurants[i].neighborhood;
                    });
                    // Remove duplicates from neighborhoods
                    var uniqueNeighborhoods = neighborhoods.filter(function (v, i) {
                        return neighborhoods.indexOf(v) == i;
                    });
                    callback(null, uniqueNeighborhoods);
                }
            });
        }

        /**
         * Fetch all cuisines with proper error handling.
         */

    }, {
        key: 'fetchCuisines',
        value: function fetchCuisines(callback) {
            // Fetch all restaurants
            DBHelper.fetchRestaurants(function (error, restaurants) {
                if (error) {
                    callback(error, null);
                } else {
                    // Get all cuisines from all restaurants
                    var cuisines = restaurants.map(function (v, i) {
                        return restaurants[i].cuisine_type;
                    });
                    // Remove duplicates from cuisines
                    var uniqueCuisines = cuisines.filter(function (v, i) {
                        return cuisines.indexOf(v) == i;
                    });
                    callback(null, uniqueCuisines);
                }
            });
        }

        /**
         * Restaurant page URL.
         */

    }, {
        key: 'urlForRestaurant',
        value: function urlForRestaurant(restaurant) {
            return './restaurant.html?id=' + restaurant.id;
        }

        /**
         * Restaurant image URL.
         */

    }, {
        key: 'imageUrlForRestaurant',
        value: function imageUrlForRestaurant(restaurant) {
            return '/img/' + restaurant.photograph;
        }

        /**
         * Map marker for a restaurant.
         */

    }, {
        key: 'mapMarkerForRestaurant',
        value: function mapMarkerForRestaurant(restaurant, map) {
            var marker = new google.maps.Marker({
                position: restaurant.latlng,
                title: restaurant.name,
                url: DBHelper.urlForRestaurant(restaurant),
                map: map,
                animation: google.maps.Animation.DROP });
            return marker;
        }
    }, {
        key: 'DATABASE_URL',


        /**
         * Database URL.
         * Change this to restaurants.json file location on your server.
         */
        get: function get() {
            var port = 1337; // Change this to your server port
            return 'http://localhost:' + port + '/restaurants';
        }
    }]);

    return DBHelper;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIl0sIm5hbWVzIjpbIkRCSGVscGVyIiwiY2FsbGJhY2siLCJmZXRjaCIsIkRBVEFCQVNFX1VSTCIsInRoZW4iLCJyZXNwb25zZSIsImpzb24iLCJyZXN0YXVyYW50cyIsImNhdGNoIiwiZXJyb3IiLCJpZCIsImZldGNoUmVzdGF1cmFudHMiLCJyZXN0YXVyYW50IiwiZmluZCIsInIiLCJjdWlzaW5lIiwicmVzdWx0cyIsImZpbHRlciIsImN1aXNpbmVfdHlwZSIsIm5laWdoYm9yaG9vZCIsIm5laWdoYm9yaG9vZHMiLCJtYXAiLCJ2IiwiaSIsInVuaXF1ZU5laWdoYm9yaG9vZHMiLCJpbmRleE9mIiwiY3Vpc2luZXMiLCJ1bmlxdWVDdWlzaW5lcyIsInBob3RvZ3JhcGgiLCJtYXJrZXIiLCJnb29nbGUiLCJtYXBzIiwiTWFya2VyIiwicG9zaXRpb24iLCJsYXRsbmciLCJ0aXRsZSIsIm5hbWUiLCJ1cmwiLCJ1cmxGb3JSZXN0YXVyYW50IiwiYW5pbWF0aW9uIiwiQW5pbWF0aW9uIiwiRFJPUCIsInBvcnQiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7SUFHTUEsUTs7Ozs7Ozs7O0FBV0Y7Ozt5Q0FHd0JDLFEsRUFBVTtBQUM5QkMsa0JBQU1GLFNBQVNHLFlBQWYsRUFDU0MsSUFEVCxDQUNjO0FBQUEsdUJBQVlDLFNBQVNDLElBQVQsRUFBWjtBQUFBLGFBRGQsRUFFU0YsSUFGVCxDQUVjLHVCQUFlO0FBQ2pCSCx5QkFBUyxJQUFULEVBQWVNLFdBQWY7QUFDSCxhQUpULEVBS1NDLEtBTFQsQ0FLZSxVQUFDQyxLQUFELEVBQVc7QUFDZFIseUJBQVNRLEtBQVQsRUFBZ0IsSUFBaEI7QUFDSCxhQVBUO0FBUUg7O0FBRUQ7Ozs7Ozs0Q0FHMkJDLEUsRUFBSVQsUSxFQUFVO0FBQ3JDO0FBQ0FELHFCQUFTVyxnQkFBVCxDQUEwQixVQUFDRixLQUFELEVBQVFGLFdBQVIsRUFBd0I7QUFDOUMsb0JBQUlFLEtBQUosRUFBVztBQUNQUiw2QkFBU1Es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QUFPLElBQWIsQ0FEc0IsQ0FDSDtBQUNuQix5Q0FBMkJBLElBQTNCO0FBQ0giLCJmaWxlIjoiZGJoZWxwZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ29tbW9uIGRhdGFiYXNlIGhlbHBlciBmdW5jdGlvbnMuXHJcbiAqL1xyXG5jbGFzcyBEQkhlbHBlciB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEYXRhYmFzZSBVUkwuXHJcbiAgICAgKiBDaGFuZ2UgdGhpcyB0byByZXN0YXVyYW50cy5qc29uIGZpbGUgbG9jYXRpb24gb24geW91ciBzZXJ2ZXIuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBnZXQgREFUQUJBU0VfVVJMKCkge1xyXG4gICAgICAgIGNvbnN0IHBvcnQgPSAxMzM3OyAvLyBDaGFuZ2UgdGhpcyB0byB5b3VyIHNlcnZlciBwb3J0XHJcbiAgICAgICAgcmV0dXJuIGBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vcmVzdGF1cmFudHNgO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggYWxsIHJlc3RhdXJhbnRzLlxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50cyhjYWxsYmFjaykge1xyXG4gICAgICAgIGZldGNoKERCSGVscGVyLkRBVEFCQVNFX1VSTClcclxuICAgICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcclxuICAgICAgICAgICAgICAgIC50aGVuKHJlc3RhdXJhbnRzID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50cyk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggYSByZXN0YXVyYW50IGJ5IGl0cyBJRC5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5SWQoaWQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgLy8gZmV0Y2ggYWxsIHJlc3RhdXJhbnRzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAgICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3RhdXJhbnQgPSByZXN0YXVyYW50cy5maW5kKHIgPT4gci5pZCA9PSBpZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdGF1cmFudCkgeyAvLyBHb3QgdGhlIHJlc3RhdXJhbnRcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8vIFJlc3RhdXJhbnQgZG9lcyBub3QgZXhpc3QgaW4gdGhlIGRhdGFiYXNlXHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soJ1Jlc3RhdXJhbnQgZG9lcyBub3QgZXhpc3QnLCBudWxsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIHR5cGUgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmUoY3Vpc2luZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHMgIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nXHJcbiAgICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBjdWlzaW5lIHR5cGVcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5TmVpZ2hib3Job29kKG5laWdoYm9yaG9vZCwgY2FsbGJhY2spIHtcclxuICAgICAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIG5laWdoYm9yaG9vZFxyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIGFuZCBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdHMgPSByZXN0YXVyYW50c1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1aXNpbmUgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IGN1aXNpbmVcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcmhvb2QgIT0gJ2FsbCcpIHsgLy8gZmlsdGVyIGJ5IG5laWdoYm9yaG9vZFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggYWxsIG5laWdoYm9yaG9vZHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBmZXRjaE5laWdoYm9yaG9vZHMoY2FsbGJhY2spIHtcclxuICAgICAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5laWdoYm9yaG9vZHMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLm5laWdoYm9yaG9vZClcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gbmVpZ2hib3Job29kc1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdW5pcXVlTmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHMuZmlsdGVyKCh2LCBpKSA9PiBuZWlnaGJvcmhvb2RzLmluZGV4T2YodikgPT0gaSlcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZU5laWdoYm9yaG9vZHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGZXRjaCBhbGwgY3Vpc2luZXMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBmZXRjaEN1aXNpbmVzKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGFsbCBjdWlzaW5lcyBmcm9tIGFsbCByZXN0YXVyYW50c1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY3Vpc2luZXMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLmN1aXNpbmVfdHlwZSlcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gY3Vpc2luZXNcclxuICAgICAgICAgICAgICAgIGNvbnN0IHVuaXF1ZUN1aXNpbmVzID0gY3Vpc2luZXMuZmlsdGVyKCh2LCBpKSA9PiBjdWlzaW5lcy5pbmRleE9mKHYpID09IGkpXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVDdWlzaW5lcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc3RhdXJhbnQgcGFnZSBVUkwuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyB1cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcclxuICAgICAgICByZXR1cm4gKGAuL3Jlc3RhdXJhbnQuaHRtbD9pZD0ke3Jlc3RhdXJhbnQuaWR9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXN0YXVyYW50IGltYWdlIFVSTC5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XHJcbiAgICAgICAgcmV0dXJuIChgL2ltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaH1gKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE1hcCBtYXJrZXIgZm9yIGEgcmVzdGF1cmFudC5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIG1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgbWFwKSB7XHJcbiAgICAgICAgY29uc3QgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiByZXN0YXVyYW50LmxhdGxuZyxcclxuICAgICAgICAgICAgdGl0bGU6IHJlc3RhdXJhbnQubmFtZSxcclxuICAgICAgICAgICAgdXJsOiBEQkhlbHBlci51cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpLFxyXG4gICAgICAgICAgICBtYXA6IG1hcCxcclxuICAgICAgICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBtYXJrZXI7XHJcbiAgICB9XHJcblxyXG59XHJcbiJdfQ==
