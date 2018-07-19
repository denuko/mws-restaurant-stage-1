import idb from 'idb';

/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * Database Promise.
     * Returns the constant defined after the DBHelper class 
     * with the opened database.
     */
    static get DATABASE_PROMISE() {
        return DATABASE_PROMISE;
    }

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}/restaurants`;
    }

    /**
     * Call the variable defined after the DBHelper class which is a bool
     * that indicates whether to store a restaurant into database
     * before adding its html.
     */
    static addRestaurants() {
        return addRestaurants;
    }

    static openDatabase() {
        // If the browser doesn't support service worker,
        // we don't care about having a database
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }

        return  idb.open('restaurants-db', 1, upgradeDb => {
            switch (upgradeDb.oldVersion) {
                case 0:
                    upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
                    const restaurantsStore = upgradeDb.transaction.objectStore('restaurants');
                    restaurantsStore.createIndex('id', 'id');
            }
        });
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        fetch(DBHelper.DATABASE_URL)
                .then(response => response.json())
                .then(restaurants => callback(null, restaurants))
                .catch(error => callback(error, null));
    }

    /**
     * Favorite a restaurant by its ID.
     * Return Promise to avoid callback functions as parameters.
     */
    static favoriteRestaurantById(id) {
        return new Promise((resolve, reject) => {
            // Search idb for restaurant
            DBHelper.getRestaurantFromDbById(id).then(restaurant => {
                if (restaurant) { // Got the restaurant
                    // If restaurant found in idb, update record
                    restaurant.is_favorite = true;
                    DBHelper.addRestaurantToDatabase(restaurant);
                }

                // Update data in server that restaurant is favorite
                fetch(`${DBHelper.DATABASE_URL}/${id}/?is_favorite=true`, {method: 'PUT'})
                        .then(response => {
                            if (response.status == 200) {
                                resolve('Success! (Favorite restaurant)');
                            } else {
                                reject('Failed! (Favorite restaurant)');
                            }
                        })
                        .catch(error => reject(error));
            });
        });
    }

    /**
     * Favorite a restaurant by its ID.
     * Return Promise to avoid callback functions as parameters.
     */
    static unfavoriteRestaurantById(id) {
        // Search idb for restaurant
        return new Promise((resolve, reject) => {
            DBHelper.getRestaurantFromDbById(id).then(restaurant => {
                if (restaurant) { // Got the restaurant
                    // If restaurant found in idb, update record
                    restaurant.is_favorite = false;
                    DBHelper.addRestaurantToDatabase(restaurant);
                }

                // Update data in server that restaurant is unfavorited
                fetch(`${DBHelper.DATABASE_URL}/${id}/?is_favorite=false`, {method: 'PUT'})
                        .then(response => {
                            if (response.status == 200) {
                                resolve('Success! (Favorite restaurant)');
                            } else {
                                reject('Failed! (Favorite restaurant)');
                            }
                        })
                        .catch(error => reject(error));
            });
        });
    }


    /**
     * Search restaurant in db by its id.
     * Return Promise to avoid callback functions as parameters for actions
     * need to be done after restaurant is searched.
     */
    static getRestaurantFromDbById(id) {
        return new Promise((resolve, reject) => {
            DBHelper.DATABASE_PROMISE.then(db => {
                const tx = db.transaction('restaurants');
                return tx.objectStore('restaurants').get(Number(id));
            }).then(restaurant => {
                resolve(restaurant);
            });
        });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // Search restaurant in db by its id.
        DBHelper.getRestaurantFromDbById(id).then(restaurant => {
            if (restaurant) {
                callback(null, restaurant);
            } else {
                // fetch all restaurants with proper error handling.
                DBHelper.fetchRestaurants((error, restaurants) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        const restaurant = restaurants.find(r => r.id == id);
                        if (restaurant) { // Got the restaurant
                            callback(null, restaurant);
                            DBHelper.addRestaurantToDatabase(restaurant);
                        } else { // Restaurant does not exist in the database
                            callback('Restaurant does not exist', null);
                        }
                    }
                });
            }
        }, (msg) => console.log(msg));
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        DBHelper.DATABASE_PROMISE.then(db => {
            const tx = db.transaction('restaurants');
            const restaurantsStore = tx.objectStore('restaurants');

            return tx.objectStore('restaurants').getAll();
        }).then(restaurants => {
            if (!restaurants.length) {
                addRestaurants = true;
                // Fetch all restaurants
                DBHelper.fetchRestaurants((error, restaurants) => {
                    if (error) {
                        callback(error, null);
                    } else {
                        DBHelper.viewRestaurants(restaurants, cuisine, neighborhood, callback);
                        addRestaurants = false;
                    }
                });
            } else {
                console.log('Restaurants:', restaurants);
                DBHelper.viewRestaurants(restaurants, cuisine, neighborhood, callback);
            }
        }).catch(error => callback(error, null));
    }

    static viewRestaurants(restaurants, cuisine, neighborhood, callback) {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
            results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
            results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        // Check if restaurant object has a photograph
        if ('photograph' in restaurant) {
            return (`/img/${restaurant.photograph}`);
        } else {
            // If restaurant has not a photograph return 'noimg' so that the
            // rest of the code knows what to do
            return 'noimg';
        }
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        const marker = new google.maps.Marker({
            position: restaurant.latlng,
            title: restaurant.name,
            url: DBHelper.urlForRestaurant(restaurant),
            map: map,
            animation: google.maps.Animation.DROP}
        );
        return marker;
    }

    /**
     * Add restaurant to database.
     */
    static addRestaurantToDatabase(restaurant) {
        DBHelper.DATABASE_PROMISE.then(function(db) {
            var tx = db.transaction('restaurants', 'readwrite');
            var restaurantsStore = tx.objectStore('restaurants');
            restaurantsStore.put(restaurant);

            return tx.complete;
        }).then(function() {
            console.log('Restaurant added');
        });
    }
}

const DATABASE_PROMISE = DBHelper.openDatabase();
let addRestaurants = false;

export default DBHelper;