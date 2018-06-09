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
                    callback(null, cursor.value);

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIl0sIm5hbWVzIjpbIkRCSGVscGVyIiwiYWRkUmVzdGF1cmFudHMiLCJuYXZpZ2F0b3IiLCJzZXJ2aWNlV29ya2VyIiwiUHJvbWlzZSIsInJlc29sdmUiLCJpZGIiLCJvcGVuIiwidXBncmFkZURiIiwib2xkVmVyc2lvbiIsImNyZWF0ZU9iamVjdFN0b3JlIiwia2V5UGF0aCIsInJlc3RhdXJhbnRzU3RvcmUiLCJ0cmFuc2FjdGlvbiIsIm9iamVjdFN0b3JlIiwiY3JlYXRlSW5kZXgiLCJjYWxsYmFjayIsImZldGNoIiwiREFUQUJBU0VfVVJMIiwidGhlbiIsInJlc3BvbnNlIiwianNvbiIsInJlc3RhdXJhbnRzIiwiY2F0Y2giLCJlcnJvciIsImlkIiwiREFUQUJBU0VfUFJPTUlTRSIsInR4IiwiZGIiLCJpbmRleCIsIm9wZW5DdXJzb3IiLCJjaGVja0lmUmVzdGF1cmFudEZvdW5kIiwiY3Vyc29yIiwidmFsdWUiLCJjb250aW51ZSIsInJlc3RhdXJhbnQiLCJmZXRjaFJlc3RhdXJhbnRzIiwiZmluZCIsInIiLCJhZGRSZXN0YXVyYW50VG9EYXRhYmFzZSIsImN1aXNpbmUiLCJyZXN1bHRzIiwiZmlsdGVyIiwiY3Vpc2luZV90eXBlIiwibmVpZ2hib3Job29kIiwiZ2V0QWxsIiwibGVuZ3RoIiwidmlld1Jlc3RhdXJhbnRzIiwiY29uc29sZSIsImxvZyIsIm5laWdoYm9yaG9vZHMiLCJtYXAiLCJ2IiwiaSIsInVuaXF1ZU5laWdoYm9yaG9vZHMiLCJpbmRleE9mIiwiY3Vpc2luZXMiLCJ1bmlxdWVDdWlzaW5lcyIsInBob3RvZ3JhcGgiLCJtYXJrZXIiLCJnb29nbGUiLCJtYXBzIiwiTWFya2VyIiwicG9zaXRpb24iLCJsYXRsbmciLCJ0aXRsZSIsIm5hbWUiLCJ1cmwiLCJ1cmxGb3JSZXN0YXVyYW50IiwiYW5pbWF0aW9uIiwiQW5pbWF0aW9uIiwiRFJPUCIsInB1dCIsImNvbXBsZXRlIiwicG9ydCIsIm9wZW5EYXRhYmFzZSJdLCJt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c291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENvbW1vbiBkYXRhYmFzZSBoZWxwZXIgZnVuY3Rpb25zLlxyXG4gKi9cclxuY2xhc3MgREJIZWxwZXIge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGF0YWJhc2UgUHJvbWlzZS5cclxuICAgICAqIFJldHVybnMgdGhlIGNvbnN0YW50IGRlZmluZWQgYWZ0ZXIgdGhlIERCSGVscGVyIGNsYXNzIFxyXG4gICAgICogd2l0aCB0aGUgb3BlbmVkIGRhdGFiYXNlLlxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZ2V0IERBVEFCQVNFX1BST01JU0UoKSB7XHJcbiAgICAgICAgcmV0dXJuIERBVEFCQVNFX1BST01JU0U7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEYXRhYmFzZSBVUkwuXHJcbiAgICAgKiBDaGFuZ2UgdGhpcyB0byByZXN0YXVyYW50cy5qc29uIGZpbGUgbG9jYXRpb24gb24geW91ciBzZXJ2ZXIuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBnZXQgREFUQUJBU0VfVVJMKCkge1xyXG4gICAgICAgIGNvbnN0IHBvcnQgPSAxMzM3OyAvLyBDaGFuZ2UgdGhpcyB0byB5b3VyIHNlcnZlciBwb3J0XHJcbiAgICAgICAgcmV0dXJuIGBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vcmVzdGF1cmFudHNgO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbCB0aGUgdmFyaWFibGUgZGVmaW5lZCBhZnRlciB0aGUgREJIZWxwZXIgY2xhc3Mgd2hpY2ggaXMgYSBib29sXHJcbiAgICAgKiB0aGF0IGluZGljYXRlcyB3aGV0aGVyIHRvIHN0b3JlIGEgcmVzdGF1cmFudCBpbnRvIGRhdGFiYXNlXHJcbiAgICAgKiBiZWZvcmUgYWRkaW5nIGl0cyBodG1sLlxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYWRkUmVzdGF1cmFudHMoKSB7XHJcbiAgICAgICAgcmV0dXJuIGFkZFJlc3RhdXJhbnRzO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBvcGVuRGF0YWJhc2UoKSB7XHJcbiAgICAgICAgLy8gSWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwb3J0IHNlcnZpY2Ugd29ya2VyLFxyXG4gICAgICAgIC8vIHdlIGRvbid0IGNhcmUgYWJvdXQgaGF2aW5nIGEgZGF0YWJhc2VcclxuICAgICAgICBpZiAoIW5hdmlnYXRvci5zZXJ2aWNlV29ya2VyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAgaWRiLm9wZW4oJ3Jlc3RhdXJhbnRzLWRiJywgMSwgdXBncmFkZURiID0+IHtcclxuICAgICAgICAgICAgc3dpdGNoICh1cGdyYWRlRGIub2xkVmVyc2lvbikge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwOlxyXG4gICAgICAgICAgICAgICAgICAgIHVwZ3JhZGVEYi5jcmVhdGVPYmplY3RTdG9yZSgncmVzdGF1cmFudHMnLCB7a2V5UGF0aDogJ2lkJ30pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3RhdXJhbnRzU3RvcmUgPSB1cGdyYWRlRGIudHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoJ3Jlc3RhdXJhbnRzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdGF1cmFudHNTdG9yZS5jcmVhdGVJbmRleCgnaWQnLCAnaWQnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggYWxsIHJlc3RhdXJhbnRzLlxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50cyhjYWxsYmFjaykge1xyXG4gICAgICAgIGZldGNoKERCSGVscGVyLkRBVEFCQVNFX1VSTClcclxuICAgICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcclxuICAgICAgICAgICAgICAgIC50aGVuKHJlc3RhdXJhbnRzID0+IGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnRzKSlcclxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiBjYWxsYmFjayhlcnJvciwgbnVsbCkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggYSByZXN0YXVyYW50IGJ5IGl0cyBJRC5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5SWQoaWQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgREJIZWxwZXIuREFUQUJBU0VfUFJPTUlTRS50aGVuKGRiID0+IHtcclxuICAgICAgICAgICAgY29uc3QgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0eC5vYmplY3RTdG9yZSgncmVzdGF1cmFudHMnKS5pbmRleCgnaWQnKS5vcGVuQ3Vyc29yKCk7XHJcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiBjaGVja0lmUmVzdGF1cmFudEZvdW5kKGN1cnNvcikge1xyXG4gICAgICAgICAgICBpZiAoIWN1cnNvcilcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKGN1cnNvci52YWx1ZS5pZCA9PSBpZCkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgY3Vyc29yLnZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY3Vyc29yLnZhbHVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnNvci5jb250aW51ZSgpLnRoZW4oY2hlY2tJZlJlc3RhdXJhbnRGb3VuZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KS50aGVuKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzdGF1cmFudCkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBmZXRjaCBhbGwgcmVzdGF1cmFudHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICAgICAgICAgICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3RhdXJhbnQgPSByZXN0YXVyYW50cy5maW5kKHIgPT4gci5pZCA9PSBpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN0YXVyYW50KSB7IC8vIEdvdCB0aGUgcmVzdGF1cmFudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBEQkhlbHBlci5hZGRSZXN0YXVyYW50VG9EYXRhYmFzZShyZXN0YXVyYW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgLy8gUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgZGF0YWJhc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCdSZXN0YXVyYW50IGRvZXMgbm90IGV4aXN0JywgbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIHR5cGUgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmUoY3Vpc2luZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHMgIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nXHJcbiAgICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBjdWlzaW5lIHR5cGVcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSByZXN0YXVyYW50cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5TmVpZ2hib3Job29kKG5laWdoYm9yaG9vZCwgY2FsbGJhY2spIHtcclxuICAgICAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBGaWx0ZXIgcmVzdGF1cmFudHMgdG8gaGF2ZSBvbmx5IGdpdmVuIG5laWdoYm9yaG9vZFxyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIGFuZCBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgREJIZWxwZXIuREFUQUJBU0VfUFJPTUlTRS50aGVuKGRiID0+IHtcclxuICAgICAgICAgICAgY29uc3QgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudHMnKTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdGF1cmFudHNTdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpLmdldEFsbCgpO1xyXG4gICAgICAgIH0pLnRoZW4ocmVzdGF1cmFudHMgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIXJlc3RhdXJhbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgYWRkUmVzdGF1cmFudHMgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICAgICAgICAgICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIERCSGVscGVyLnZpZXdSZXN0YXVyYW50cyhyZXN0YXVyYW50cywgY3Vpc2luZSwgbmVpZ2hib3Job29kLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZFJlc3RhdXJhbnRzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUmVzdGF1cmFudHM6JywgcmVzdGF1cmFudHMpO1xyXG4gICAgICAgICAgICAgICAgREJIZWxwZXIudmlld1Jlc3RhdXJhbnRzKHJlc3RhdXJhbnRzLCBjdWlzaW5lLCBuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pLmNhdGNoKGVycm9yID0+IGNhbGxiYWNrKGVycm9yLCBudWxsKSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHZpZXdSZXN0YXVyYW50cyhyZXN0YXVyYW50cywgY3Vpc2luZSwgbmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xyXG4gICAgICAgIGxldCByZXN1bHRzID0gcmVzdGF1cmFudHNcclxuICAgICAgICBpZiAoY3Vpc2luZSAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgY3Vpc2luZVxyXG4gICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIociA9PiByLmN1aXNpbmVfdHlwZSA9PSBjdWlzaW5lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG5laWdoYm9yaG9vZCAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgbmVpZ2hib3Job29kXHJcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmV0Y2ggYWxsIG5laWdoYm9yaG9vZHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBmZXRjaE5laWdoYm9yaG9vZHMoY2FsbGJhY2spIHtcclxuICAgICAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5laWdoYm9yaG9vZHMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLm5laWdoYm9yaG9vZClcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gbmVpZ2hib3Job29kc1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdW5pcXVlTmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHMuZmlsdGVyKCh2LCBpKSA9PiBuZWlnaGJvcmhvb2RzLmluZGV4T2YodikgPT0gaSlcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZU5laWdoYm9yaG9vZHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGZXRjaCBhbGwgY3Vpc2luZXMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBmZXRjaEN1aXNpbmVzKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICAgICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGFsbCBjdWlzaW5lcyBmcm9tIGFsbCByZXN0YXVyYW50c1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY3Vpc2luZXMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLmN1aXNpbmVfdHlwZSlcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gY3Vpc2luZXNcclxuICAgICAgICAgICAgICAgIGNvbnN0IHVuaXF1ZUN1aXNpbmVzID0gY3Vpc2luZXMuZmlsdGVyKCh2LCBpKSA9PiBjdWlzaW5lcy5pbmRleE9mKHYpID09IGkpXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVDdWlzaW5lcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc3RhdXJhbnQgcGFnZSBVUkwuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyB1cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcclxuICAgICAgICByZXR1cm4gKGAuL3Jlc3RhdXJhbnQuaHRtbD9pZD0ke3Jlc3RhdXJhbnQuaWR9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXN0YXVyYW50IGltYWdlIFVSTC5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgcmVzdGF1cmFudCBvYmplY3QgaGFzIGEgcGhvdG9ncmFwaFxyXG4gICAgICAgIGlmICgncGhvdG9ncmFwaCcgaW4gcmVzdGF1cmFudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gKGAvaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBofWApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIElmIHJlc3RhdXJhbnQgaGFzIG5vdCBhIHBob3RvZ3JhcGggcmV0dXJuICdub2ltZycgc28gdGhhdCB0aGVcclxuICAgICAgICAgICAgLy8gcmVzdCBvZiB0aGUgY29kZSBrbm93cyB3aGF0IHRvIGRvXHJcbiAgICAgICAgICAgIHJldHVybiAnbm9pbWcnO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE1hcCBtYXJrZXIgZm9yIGEgcmVzdGF1cmFudC5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIG1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgbWFwKSB7XHJcbiAgICAgICAgY29uc3QgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiByZXN0YXVyYW50LmxhdGxuZyxcclxuICAgICAgICAgICAgdGl0bGU6IHJlc3RhdXJhbnQubmFtZSxcclxuICAgICAgICAgICAgdXJsOiBEQkhlbHBlci51cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpLFxyXG4gICAgICAgICAgICBtYXA6IG1hcCxcclxuICAgICAgICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBtYXJrZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQgcmVzdGF1cmFudCB0byBkYXRhYmFzZS5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFkZFJlc3RhdXJhbnRUb0RhdGFiYXNlKHJlc3RhdXJhbnQpIHtcclxuICAgICAgICBEQkhlbHBlci5EQVRBQkFTRV9QUk9NSVNFLnRoZW4oZnVuY3Rpb24oZGIpIHtcclxuICAgICAgICAgICAgdmFyIHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnRzJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgICAgICAgICB2YXIgcmVzdGF1cmFudHNTdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50cycpO1xyXG4gICAgICAgICAgICByZXN0YXVyYW50c1N0b3JlLnB1dChyZXN0YXVyYW50KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0eC5jb21wbGV0ZTtcclxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUmVzdGF1cmFudCBhZGRlZCcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5jb25zdCBEQVRBQkFTRV9QUk9NSVNFID0gREJIZWxwZXIub3BlbkRhdGFiYXNlKCk7XHJcbmxldCBhZGRSZXN0YXVyYW50cyA9IGZhbHNlOyJdfQ==
