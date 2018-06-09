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
        key: 'addRestaurants',


        /**
         * Call the variable defined after the DBHelper class which is a bool
         * that indicates whether to store a restaurant into database
         * before adding its html.
         */
        value: function addRestaurants() {
            return _addRestaurants;
        }
    }, {
        key: 'openDatabase',
        value: function openDatabase() {
            // If the browser doesn't support service worker,
            // we don't care about having a database
            if (!navigator.serviceWorker) {
                return Promise.resolve();
            }

            return idb.open('restaurants-db', 1, function (upgradeDb) {
                switch (upgradeDb.oldVersion) {
                    case 0:
                        upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
                        var restaurantsStore = upgradeDb.transaction.objectStore('restaurants');
                        restaurantsStore.createIndex('id', 'id');
                }
            });
        }

        /**
         * Fetch all restaurants.
         */

    }, {
        key: 'fetchRestaurants',
        value: function fetchRestaurants(callback) {
            fetch(DBHelper.DATABASE_URL).then(function (response) {
                return response.json();
            }).then(function (restaurants) {
                return callback(null, restaurants);
            }).catch(function (error) {
                return callback(error, null);
            });
        }

        /**
         * Fetch a restaurant by its ID.
         */

    }, {
        key: 'fetchRestaurantById',
        value: function fetchRestaurantById(id, callback) {
            DBHelper.DATABASE_PROMISE.then(function (db) {
                var tx = db.transaction('restaurants');

                return tx.objectStore('restaurants').index('id').openCursor();
            }).then(function checkIfRestaurantFound(cursor) {
                if (!cursor) return;
                if (cursor.value.id == id) {
                    return cursor.value;
                } else {
                    return cursor.continue().then(checkIfRestaurantFound);
                }
            }).then(function (restaurant) {
                if (restaurant) {
                    callback(null, restaurant);
                } else {
                    // fetch all restaurants with proper error handling.
                    DBHelper.fetchRestaurants(function (error, restaurants) {
                        if (error) {
                            callback(error, null);
                        } else {
                            var _restaurant = restaurants.find(function (r) {
                                return r.id == id;
                            });
                            if (_restaurant) {
                                // Got the restaurant
                                callback(null, _restaurant);
                                DBHelper.addRestaurantToDatabase(_restaurant);
                            } else {
                                // Restaurant does not exist in the database
                                callback('Restaurant does not exist', null);
                            }
                        }
                    });
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
            DBHelper.DATABASE_PROMISE.then(function (db) {
                var tx = db.transaction('restaurants');
                var restaurantsStore = tx.objectStore('restaurants');

                return tx.objectStore('restaurants').getAll();
            }).then(function (restaurants) {
                if (!restaurants.length) {
                    _addRestaurants = true;
                    // Fetch all restaurants
                    DBHelper.fetchRestaurants(function (error, restaurants) {
                        if (error) {
                            callback(error, null);
                        } else {
                            DBHelper.viewRestaurants(restaurants, cuisine, neighborhood, callback);
                            _addRestaurants = false;
                        }
                    });
                } else {
                    console.log('Restaurants:', restaurants);
                    DBHelper.viewRestaurants(restaurants, cuisine, neighborhood, callback);
                }
            }).catch(function (error) {
                return callback(error, null);
            });
        }
    }, {
        key: 'viewRestaurants',
        value: function viewRestaurants(restaurants, cuisine, neighborhood, callback) {
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
            // Check if restaurant object has a photograph
            if ('photograph' in restaurant) {
                return '/img/' + restaurant.photograph;
            } else {
                // If restaurant has not a photograph return 'noimg' so that the
                // rest of the code knows what to do
                return 'noimg';
            }
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

        /**
         * Add restaurant to database.
         */

    }, {
        key: 'addRestaurantToDatabase',
        value: function addRestaurantToDatabase(restaurant) {
            DBHelper.DATABASE_PROMISE.then(function (db) {
                var tx = db.transaction('restaurants', 'readwrite');
                var restaurantsStore = tx.objectStore('restaurants');
                restaurantsStore.put(restaurant);

                return tx.complete;
            }).then(function () {
                console.log('Restaurant added');
            });
        }
    }, {
        key: 'DATABASE_PROMISE',


        /**
         * Database Promise.
         * Returns the constant defined after the DBHelper class 
         * with the opened database.
         */
        get: function get() {
            return DATABASE_PROMISE;
        }

        /**
         * Database URL.
         * Change this to restaurants.json file location on your server.
         */

    }, {
        key: 'DATABASE_URL',
        get: function get() {
            var port = 1337; // Change this to your server port
            return 'http://localhost:' + port + '/restaurants';
        }
    }]);

    return DBHelper;
}();

var DATABASE_PROMISE = DBHelper.openDatabase();
var _addRestaurants = false;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIl0sIm5hbWVzIjpbIkRCSGVscGVyIiwiYWRkUmVzdGF1cmFudHMiLCJuYXZpZ2F0b3IiLCJzZXJ2aWNlV29ya2VyIiwiUHJvbWlzZSIsInJlc29sdmUiLCJpZGIiLCJvcGVuIiwidXBncmFkZURiIiwib2xkVmVyc2lvbiIsImNyZWF0ZU9iamVjdFN0b3JlIiwia2V5UGF0aCIsInJlc3RhdXJhbnRzU3RvcmUiLCJ0cmFuc2FjdGlvbiIsIm9iamVjdFN0b3JlIiwiY3JlYXRlSW5kZXgiLCJjYWxsYmFjayIsImZldGNoIiwiREFUQUJBU0VfVVJMIiwidGhlbiIsInJlc3BvbnNlIiwianNvbiIsInJlc3RhdXJhbnRzIiwiY2F0Y2giLCJlcnJvciIsImlkIiwiREFUQUJBU0VfUFJPTUlTRSIsInR4IiwiZGIiLCJpbmRleCIsIm9wZW5DdXJzb3IiLCJjaGVja0lmUmVzdGF1cmFudEZvdW5kIiwiY3Vyc29yIiwidmFsdWUiLCJjb250aW51ZSIsInJlc3RhdXJhbnQiLCJmZXRjaFJlc3RhdXJhbnRzIiwiZmluZCIsInIiLCJhZGRSZXN0YXVyYW50VG9EYXRhYmFzZSIsImN1aXNpbmUiLCJyZXN1bHRzIiwiZmlsdGVyIiwiY3Vpc2luZV90eXBlIiwibmVpZ2hib3Job29kIiwiZ2V0QWxsIiwibGVuZ3RoIiwidmlld1Jlc3RhdXJhbnRzIiwiY29uc29sZSIsImxvZyIsIm5laWdoYm9yaG9vZHMiLCJtYXAiLCJ2IiwiaSIsInVuaXF1ZU5laWdoYm9yaG9vZHMiLCJpbmRleE9mIiwiY3Vpc2luZXMiLCJ1bmlxdWVDdWlzaW5lcyIsInBob3RvZ3JhcGgiLCJtYXJrZXIiLCJnb29nbGUiLCJtYXBzIiwiTWFya2VyIiwicG9zaXRpb24iLCJsYXRsbmciLCJ0aXRsZSIsIm5hbWUiLCJ1cmwiLCJ1cmxGb3JSZXN0YXVyYW50IiwiYW5pbWF0aW9uIiwiQW5pbWF0aW9uIiwiRFJPUCIsInB1dCIsImNvbXBsZXRlIiwicG9ydCIsIm9wZW5EYXRhYmFzZSJdLCJt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dGFiYXNlIGhlbHBlciBmdW5jdGlvbnMuXHJcbiAqL1xyXG5jbGFzcyBEQkhlbHBlciB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEYXRhYmFzZSBQcm9taXNlLlxyXG4gICAgICogUmV0dXJucyB0aGUgY29uc3RhbnQgZGVmaW5lZCBhZnRlciB0aGUgREJIZWxwZXIgY2xhc3MgXHJcbiAgICAgKiB3aXRoIHRoZSBvcGVuZWQgZGF0YWJhc2UuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBnZXQgREFUQUJBU0VfUFJPTUlTRSgpIHtcclxuICAgICAgICByZXR1cm4gREFUQUJBU0VfUFJPTUlTRTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIERhdGFiYXNlIFVSTC5cclxuICAgICAqIENoYW5nZSB0aGlzIHRvIHJlc3RhdXJhbnRzLmpzb24gZmlsZSBsb2NhdGlvbiBvbiB5b3VyIHNlcnZlci5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGdldCBEQVRBQkFTRV9VUkwoKSB7XHJcbiAgICAgICAgY29uc3QgcG9ydCA9IDEzMzc7IC8vIENoYW5nZSB0aGlzIHRvIHlvdXIgc2VydmVyIHBvcnRcclxuICAgICAgICByZXR1cm4gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS9yZXN0YXVyYW50c2A7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsIHRoZSB2YXJpYWJsZSBkZWZpbmVkIGFmdGVyIHRoZSBEQkhlbHBlciBjbGFzcyB3aGljaCBpcyBhIGJvb2xcclxuICAgICAqIHRoYXQgaW5kaWNhdGVzIHdoZXRoZXIgdG8gc3RvcmUgYSByZXN0YXVyYW50IGludG8gZGF0YWJhc2VcclxuICAgICAqIGJlZm9yZSBhZGRpbmcgaXRzIGh0bWwuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhZGRSZXN0YXVyYW50cygpIHtcclxuICAgICAgICByZXR1cm4gYWRkUmVzdGF1cmFudHM7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIG9wZW5EYXRhYmFzZSgpIHtcclxuICAgICAgICAvLyBJZiB0aGUgYnJvd3NlciBkb2Vzbid0IHN1cHBvcnQgc2VydmljZSB3b3JrZXIsXHJcbiAgICAgICAgLy8gd2UgZG9uJ3QgY2FyZSBhYm91dCBoYXZpbmcgYSBkYXRhYmFzZVxyXG4gICAgICAgIGlmICghbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICBpZGIub3BlbigncmVzdGF1cmFudHMtZGInLCAxLCB1cGdyYWRlRGIgPT4ge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHVwZ3JhZGVEYi5vbGRWZXJzaW9uKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDA6XHJcbiAgICAgICAgICAgICAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycsIHtrZXlQYXRoOiAnaWQnfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdGF1cmFudHNTdG9yZSA9IHVwZ3JhZGVEYi50cmFuc2FjdGlvbi5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN0YXVyYW50c1N0b3JlLmNyZWF0ZUluZGV4KCdpZCcsICdpZCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGZXRjaCBhbGwgcmVzdGF1cmFudHMuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRzKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgZmV0Y2goREJIZWxwZXIuREFUQUJBU0VfVVJMKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4ocmVzdGF1cmFudHMgPT4gY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudHMpKVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IGNhbGxiYWNrKGVycm9yLCBudWxsKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGZXRjaCBhIHJlc3RhdXJhbnQgYnkgaXRzIElELlxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgY2FsbGJhY2spIHtcclxuICAgICAgICBEQkhlbHBlci5EQVRBQkFTRV9QUk9NSVNFLnRoZW4oZGIgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB0eCA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50cycpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpLmluZGV4KCdpZCcpLm9wZW5DdXJzb3IoKTtcclxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIGNoZWNrSWZSZXN0YXVyYW50Rm91bmQoY3Vyc29yKSB7XHJcbiAgICAgICAgICAgIGlmICghY3Vyc29yKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAoY3Vyc29yLnZhbHVlLmlkID09IGlkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY3Vyc29yLnZhbHVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnNvci5jb250aW51ZSgpLnRoZW4oY2hlY2tJZlJlc3RhdXJhbnRGb3VuZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KS50aGVuKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzdGF1cmFudCkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBmZXRjaCBhbGwgcmVzdGF1cmFudHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICAgICAgICAgICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3RhdXJhbnQgPSByZXN0YXVyYW50cy5maW5kKHIgPT4gci5pZCA9PSBpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN0YXVyYW50KSB7IC8vIEdvdCB0aGUgcmVzdGF1cmFudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBEQkhlbHBlci5hZGRSZXN0YXVyYW50VG9EYXRhYmFzZShyZXN0YXVyYW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgLy8gUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgZGF0YWJhc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCdSZXN0YXVyYW50IGRvZXMgbm90IGV4aXN0JywgbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIHR5cGUgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmUoY3Vpc2luZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHMgIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nXHJcbiAgICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBjdWlzaW5lIHR5cGVcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5TmVpZ2hib3Job29kKG5laWdoYm9yaG9vZCwgY2FsbGJhY2spIHtcclxuICAgICAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIG5laWdoYm9yaG9vZFxyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIGFuZCBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgREJIZWxwZXIuREFUQUJBU0VfUFJPTUlTRS50aGVuKGRiID0+IHtcclxuICAgICAgICAgICAgY29uc3QgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnKTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdGF1cmFudHNTdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpLmdldEFsbCgpO1xyXG4gICAgICAgIH0pLnRoZW4ocmVzdGF1cmFudHMgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIXJlc3RhdXJhbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgYWRkUmVzdGF1cmFudHMgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICAgICAgICAgICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIERCSGVscGVyLnZpZXdSZXN0YXVyYW50cyhyZXN0YXVyYW50cywgY3Vpc2luZSwgbmVpZ2hib3Job29kLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZFJlc3RhdXJhbnRzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUmVzdGF1cmFudHM6JywgcmVzdGF1cmFudHMpO1xyXG4gICAgICAgICAgICAgICAgREJIZWxwZXIudmlld1Jlc3RhdXJhbnRzKHJlc3RhdXJhbnRzLCBjdWlzaW5lLCBuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pLmNhdGNoKGVycm9yID0+IGNhbGxiYWNrKGVycm9yLCBudWxsKSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHZpZXdSZXN0YXVyYW50cyhyZXN0YXVyYW50cywgY3Vpc2luZSwgbmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xyXG4gICAgICAgIGxldCByZXN1bHRzID0gcmVzdGF1cmFudHNcclxuICAgICAgICBpZiAoY3Vpc2luZSAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgY3Vpc2luZVxyXG4gICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG5laWdoYm9yaG9vZCAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgbmVpZ2hib3Job29kXHJcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggYWxsIG5laWdoYm9yaG9vZHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBmZXRjaE5laWdoYm9yaG9vZHMoY2FsbGJhY2spIHtcclxuICAgICAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5laWdoYm9yaG9vZHMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLm5laWdoYm9yaG9vZClcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gbmVpZ2hib3Job29kc1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdW5pcXVlTmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHMuZmlsdGVyKCh2LCBpKSA9PiBuZWlnaGJvcmhvb2RzLmluZGV4T2YodikgPT0gaSlcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZU5laWdoYm9yaG9vZHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGZXRjaCBhbGwgY3Vpc2luZXMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBmZXRjaEN1aXNpbmVzKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGFsbCBjdWlzaW5lcyBmcm9tIGFsbCByZXN0YXVyYW50c1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY3Vpc2luZXMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLmN1aXNpbmVfdHlwZSlcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gY3Vpc2luZXNcclxuICAgICAgICAgICAgICAgIGNvbnN0IHVuaXF1ZUN1aXNpbmVzID0gY3Vpc2luZXMuZmlsdGVyKCh2LCBpKSA9PiBjdWlzaW5lcy5pbmRleE9mKHYpID09IGkpXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVDdWlzaW5lcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc3RhdXJhbnQgcGFnZSBVUkwuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyB1cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcclxuICAgICAgICByZXR1cm4gKGAuL3Jlc3RhdXJhbnQuaHRtbD9pZD0ke3Jlc3RhdXJhbnQuaWR9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXN0YXVyYW50IGltYWdlIFVSTC5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgcmVzdGF1cmFudCBvYmplY3QgaGFzIGEgcGhvdG9ncmFwaFxyXG4gICAgICAgIGlmICgncGhvdG9ncmFwaCcgaW4gcmVzdGF1cmFudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gKGAvaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBofWApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIElmIHJlc3RhdXJhbnQgaGFzIG5vdCBhIHBob3RvZ3JhcGggcmV0dXJuICdub2ltZycgc28gdGhhdCB0aGVcclxuICAgICAgICAgICAgLy8gcmVzdCBvZiB0aGUgY29kZSBrbm93cyB3aGF0IHRvIGRvXHJcbiAgICAgICAgICAgIHJldHVybiAnbm9pbWcnO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE1hcCBtYXJrZXIgZm9yIGEgcmVzdGF1cmFudC5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIG1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgbWFwKSB7XHJcbiAgICAgICAgY29uc3QgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiByZXN0YXVyYW50LmxhdGxuZyxcclxuICAgICAgICAgICAgdGl0bGU6IHJlc3RhdXJhbnQubmFtZSxcclxuICAgICAgICAgICAgdXJsOiBEQkhlbHBlci51cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpLFxyXG4gICAgICAgICAgICBtYXA6IG1hcCxcclxuICAgICAgICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBtYXJrZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQgcmVzdGF1cmFudCB0byBkYXRhYmFzZS5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFkZFJlc3RhdXJhbnRUb0RhdGFiYXNlKHJlc3RhdXJhbnQpIHtcclxuICAgICAgICBEQkhlbHBlci5EQVRBQkFTRV9QUk9NSVNFLnRoZW4oZnVuY3Rpb24oZGIpIHtcclxuICAgICAgICAgICAgdmFyIHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgICAgICAgICB2YXIgcmVzdGF1cmFudHNTdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xyXG4gICAgICAgICAgICByZXN0YXVyYW50c1N0b3JlLnB1dChyZXN0YXVyYW50KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0eC5jb21wbGV0ZTtcclxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUmVzdGF1cmFudCBhZGRlZCcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5jb25zdCBEQVRBQkFTRV9QUk9NSVNFID0gREJIZWxwZXIub3BlbkRhdGFiYXNlKCk7XHJcbmxldCBhZGRSZXN0YXVyYW50cyA9IGZhbHNlOyJdfQ==
