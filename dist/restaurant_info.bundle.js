!function(e){var t={};function n(r){if(t[r])return t[r].exports;var a=t[r]={i:r,l:!1,exports:{}};return e[r].call(a.exports,a,a.exports,n),a.l=!0,a.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var a in e)n.d(r,a,function(t){return e[t]}.bind(null,a));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=10)}([function(e,t,n){"use strict";!function(){function t(e){return new Promise(function(t,n){e.onsuccess=function(){t(e.result)},e.onerror=function(){n(e.error)}})}function n(e,n,r){var a,o=new Promise(function(o,i){t(a=e[n].apply(e,r)).then(o,i)});return o.request=a,o}function r(e,t,n){n.forEach(function(n){Object.defineProperty(e.prototype,n,{get:function(){return this[t][n]},set:function(e){this[t][n]=e}})})}function a(e,t,r,a){a.forEach(function(a){a in r.prototype&&(e.prototype[a]=function(){return n(this[t],a,arguments)})})}function o(e,t,n,r){r.forEach(function(r){r in n.prototype&&(e.prototype[r]=function(){return this[t][r].apply(this[t],arguments)})})}function i(e,t,r,a){a.forEach(function(a){a in r.prototype&&(e.prototype[a]=function(){return function(e,t,r){var a=n(e,t,r);return a.then(function(e){if(e)return new u(e,a.request)})}(this[t],a,arguments)})})}function s(e){this._index=e}function u(e,t){this._cursor=e,this._request=t}function c(e){this._store=e}function l(e){this._tx=e,this.complete=new Promise(function(t,n){e.oncomplete=function(){t()},e.onerror=function(){n(e.error)},e.onabort=function(){n(e.error)}})}function d(e,t,n){this._db=e,this.oldVersion=t,this.transaction=new l(n)}function f(e){this._db=e}r(s,"_index",["name","keyPath","multiEntry","unique"]),a(s,"_index",IDBIndex,["get","getKey","getAll","getAllKeys","count"]),i(s,"_index",IDBIndex,["openCursor","openKeyCursor"]),r(u,"_cursor",["direction","key","primaryKey","value"]),a(u,"_cursor",IDBCursor,["update","delete"]),["advance","continue","continuePrimaryKey"].forEach(function(e){e in IDBCursor.prototype&&(u.prototype[e]=function(){var n=this,r=arguments;return Promise.resolve().then(function(){return n._cursor[e].apply(n._cursor,r),t(n._request).then(function(e){if(e)return new u(e,n._request)})})})}),c.prototype.createIndex=function(){return new s(this._store.createIndex.apply(this._store,arguments))},c.prototype.index=function(){return new s(this._store.index.apply(this._store,arguments))},r(c,"_store",["name","keyPath","indexNames","autoIncrement"]),a(c,"_store",IDBObjectStore,["put","add","delete","clear","get","getAll","getKey","getAllKeys","count"]),i(c,"_store",IDBObjectStore,["openCursor","openKeyCursor"]),o(c,"_store",IDBObjectStore,["deleteIndex"]),l.prototype.objectStore=function(){return new c(this._tx.objectStore.apply(this._tx,arguments))},r(l,"_tx",["objectStoreNames","mode"]),o(l,"_tx",IDBTransaction,["abort"]),d.prototype.createObjectStore=function(){return new c(this._db.createObjectStore.apply(this._db,arguments))},r(d,"_db",["name","version","objectStoreNames"]),o(d,"_db",IDBDatabase,["deleteObjectStore","close"]),f.prototype.transaction=function(){return new l(this._db.transaction.apply(this._db,arguments))},r(f,"_db",["name","version","objectStoreNames"]),o(f,"_db",IDBDatabase,["close"]),["openCursor","openKeyCursor"].forEach(function(e){[c,s].forEach(function(t){e in t.prototype&&(t.prototype[e.replace("open","iterate")]=function(){var t=function(e){return Array.prototype.slice.call(e)}(arguments),n=t[t.length-1],r=this._store||this._index,a=r[e].apply(r,t.slice(0,-1));a.onsuccess=function(){n(a.result)}})})}),[s,c].forEach(function(e){e.prototype.getAll||(e.prototype.getAll=function(e,t){var n=this,r=[];return new Promise(function(a){n.iterateCursor(e,function(e){e?(r.push(e.value),void 0===t||r.length!=t?e.continue():a(r)):a(r)})})})});var p={open:function(e,t,r){var a=n(indexedDB,"open",[e,t]),o=a.request;return o&&(o.onupgradeneeded=function(e){r&&r(new d(o.result,e.oldVersion,o.transaction))}),a.then(function(e){return new f(e)})},delete:function(e){return n(indexedDB,"deleteDatabase",[e])}};e.exports=p,e.exports.default=e.exports}()},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),a=function(e){return e&&e.__esModule?e:{default:e}}(n(0)),o=function(){function e(){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e)}return r(e,null,[{key:"addRestaurants",value:function(){return s}},{key:"openDatabase",value:function(){return navigator.serviceWorker?a.default.open("restaurants-db",2,function(e){switch(e.oldVersion){case 0:e.createObjectStore("restaurants",{keyPath:"id"}),e.transaction.objectStore("restaurants").createIndex("id","id");case 1:e.createObjectStore("reviews",{keyPath:"id_local",autoIncrement:!0}),e.transaction.objectStore("reviews").createIndex("restaurant_id","restaurant_id")}}):Promise.resolve()}},{key:"fetchRestaurants",value:function(t){fetch(e.DATABASE_URL).then(function(e){return e.json()}).then(function(e){return t(null,e)}).catch(function(e){return t(e,null)})}},{key:"favoriteRestaurantById",value:function(t){return new Promise(function(n,r){e.getRestaurantFromDbById(t).then(function(a){a&&(a.is_favorite=!0,e.addRestaurantToDatabase(a)),fetch(e.DATABASE_URL+"/"+t+"/?is_favorite=true",{method:"PUT"}).then(function(e){200==e.status?n("Success! (Favorite restaurant)"):r("Failed! (Favorite restaurant)")}).catch(function(e){return r(e)})})})}},{key:"unfavoriteRestaurantById",value:function(t){return new Promise(function(n,r){e.getRestaurantFromDbById(t).then(function(a){a&&(a.is_favorite=!1,e.addRestaurantToDatabase(a)),fetch(e.DATABASE_URL+"/"+t+"/?is_favorite=false",{method:"PUT"}).then(function(e){200==e.status?n("Success! (Favorite restaurant)"):r("Failed! (Favorite restaurant)")}).catch(function(e){return r(e)})})})}},{key:"getRestaurantFromDbById",value:function(t){return new Promise(function(n,r){e.DATABASE_PROMISE.then(function(e){return e.transaction("restaurants").objectStore("restaurants").get(Number(t))}).then(function(e){n(e)})})}},{key:"fetchRestaurantById",value:function(t,n){e.getRestaurantFromDbById(t).then(function(r){r?n(null,r):fetch(e.DATABASE_URL+"/"+t+"/").then(function(e){return e.json()}).then(function(t){t?(n(null,t),e.addRestaurantToDatabase(t)):n("Restaurant does not exist",null)}).catch(function(e){return n(e,null)})},function(e){return console.log(e)})}},{key:"fetchRestaurantByCuisine",value:function(t,n){e.fetchRestaurants(function(e,r){if(e)n(e,null);else{var a=r.filter(function(e){return e.cuisine_type==t});n(null,a)}})}},{key:"fetchRestaurantByNeighborhood",value:function(t,n){e.fetchRestaurants(function(e,r){if(e)n(e,null);else{var a=r.filter(function(e){return e.neighborhood==t});n(null,a)}})}},{key:"fetchRestaurantByCuisineAndNeighborhood",value:function(t,n,r){e.DATABASE_PROMISE.then(function(e){var t=e.transaction("restaurants");return t.objectStore("restaurants"),t.objectStore("restaurants").getAll()}).then(function(a){a.length?(console.log("Restaurants:",a),e.viewRestaurants(a,t,n,r)):(s=!0,e.fetchRestaurants(function(a,o){a?r(a,null):(e.viewRestaurants(o,t,n,r),s=!1)}))}).catch(function(e){return r(e,null)})}},{key:"viewRestaurants",value:function(e,t,n,r){var a=e;"all"!=t&&(a=a.filter(function(e){return e.cuisine_type==t})),"all"!=n&&(a=a.filter(function(e){return e.neighborhood==n})),r(null,a)}},{key:"fetchNeighborhoods",value:function(t){e.fetchRestaurants(function(e,n){if(e)t(e,null);else{var r=n.map(function(e,t){return n[t].neighborhood}),a=r.filter(function(e,t){return r.indexOf(e)==t});t(null,a)}})}},{key:"fetchCuisines",value:function(t){e.fetchRestaurants(function(e,n){if(e)t(e,null);else{var r=n.map(function(e,t){return n[t].cuisine_type}),a=r.filter(function(e,t){return r.indexOf(e)==t});t(null,a)}})}},{key:"urlForRestaurant",value:function(e){return"./restaurant.html?id="+e.id}},{key:"imageUrlForRestaurant",value:function(e){return"photograph"in e?"/img/"+e.photograph:"noimg"}},{key:"mapMarkerForRestaurant",value:function(t,n){return new google.maps.Marker({position:t.latlng,title:t.name,url:e.urlForRestaurant(t),map:n,animation:google.maps.Animation.DROP})}},{key:"addRestaurantToDatabase",value:function(t){e.DATABASE_PROMISE.then(function(e){var n=e.transaction("restaurants","readwrite");return n.objectStore("restaurants").put(t),n.complete}).then(function(){console.log("Restaurant added")})}},{key:"fetchReviewsByRestaurantId",value:function(t){return new Promise(function(n,r){e.DATABASE_PROMISE.then(function(e){return e.transaction("reviews").objectStore("reviews").index("restaurant_id").getAll(t)}).then(function(a){a.length?(a.sort(function(e,t){return e.createdAt<t.createdAt}),n([a,!1])):fetch(e.DATABASE_URL_REVIEWS+"/?restaurant_id="+t).then(function(e){return e.json()}).then(function(e){return n([e,!0])}).catch(function(e){return r(e)})})})}},{key:"addReview",value:function(t){return new Promise(function(n,r){e.postReviewToServer(t).then(function(e){console.log("Review created in server"),n(e)},function(n){console.log(n),e.addReviewToDatabase(t).then(function(e){navigator.serviceWorker&&navigator.serviceWorker.controller.postMessage({action:"sync",review:e}),r(e)})})})}},{key:"addReviewToDatabase",value:function(t){return new Promise(function(n,r){e.DATABASE_PROMISE.then(function(e){var n=e.transaction("reviews","readwrite");return n.objectStore("reviews").put(t),n.complete}).then(function(){e.getLastReviewId().then(function(e){console.log("Review added"),t.id_local=e,n(t)},function(e){return console.log(e)})})})}},{key:"postReviewToServer",value:function(t){return new Promise(function(n,r){fetch("http://localhost:1337/reviews/",{method:"POST",body:JSON.stringify(t)}).then(function(e){return e.json()}).then(function(a){a?(t.id=a.id,e.addReviewToDatabase(t),console.log("Review stored in server"),n(t)):r("An error occured while saving in server")}).catch(function(e){r(e)})})}},{key:"getLastReviewId",value:function(){return new Promise(function(t,n){e.DATABASE_PROMISE.then(function(e){return e.transaction("reviews").objectStore("reviews").openCursor(null,"prev")}).then(function(e){if(e)return e.value.id_local;n("Last id not found")}).then(function(e){t(e),console.log("Done cursoring")})})}},{key:"DATABASE_PROMISE",get:function(){return i}},{key:"DATABASE_URL",get:function(){return"http://localhost:1337/restaurants"}},{key:"DATABASE_URL_REVIEWS",get:function(){return"http://localhost:1337/reviews"}}]),e}(),i=o.openDatabase(),s=!1;t.default=o},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.addImageSourceToPicture=function(e,t,n){var r=document.createElement("source");void 0!==n&&(r.media=n),r.setAttribute("data-srcset",t),e.append(r)},t.fileExtension=function(e){return e.split(".").pop()},t.filenameWithoutExtension=function(e){return e.replace(/.[^.]+$/,"")},t.imageNamesBySize=function(e){var t={};return t.small=e+"-small.jpg",t.medium=e+"-medium.jpg",t.large=e+"-large.jpg",t},t.getGoogleMapsApi=function(){var e=document.getElementById("map");new IntersectionObserver(function(t,n){if("boolean"==typeof t[0].isIntersecting?t[0].isIntersecting:t[0].intersectionRatio>0)if((" "+e.className+" ").replace(/[\n\t]/g," ").indexOf(" offline ")>-1){if(!document.getElementById("map-offline")){var r=document.createElement("div");r.id="map-offline";var a=document.createElement("span");a.innerHTML="No internet connection. Failed to load map.",a.id="map-offline-message",r.appendChild(a),e.append(r)}}else loadjs(["https://maps.googleapis.com/maps/api/js?key=AIzaSyBzXDGrWxj1GsJUbo9ZKSJPz07o2K1ljgc&libraries=places&callback=initMap"]),n.unobserve(e)},{rootMargin:"400px",threshold:0}).observe(e)},t.getLazyLoadPlugin=function(){!function(e,t){var n=t.getElementsByTagName("body")[0],r=t.createElement("script");r.async=!0;var a="IntersectionObserver"in e?"10.5.2":"8.7.1";r.src="https://cdnjs.cloudflare.com/ajax/libs/vanilla-lazyload/"+a+"/lazyload.min.js",e.lazyLoadOptions={elements_selector:".lazy"},n.appendChild(r)}(window,document)},t.timestampToDate=function(e){var t=new Date(e),n=t.getDate();return r(t.getMonth())+" "+n+", "+t.getFullYear()};var r=function(e){var t=new Array;return t[0]="January",t[1]="February",t[2]="March",t[3]="April",t[4]="May",t[5]="June",t[6]="July",t[7]="August",t[8]="September",t[9]="October",t[10]="November",t[11]="December",t[e]}},function(e,t){e.exports=function(e){var t="undefined"!=typeof window&&window.location;if(!t)throw new Error("fixUrls requires window.location");if(!e||"string"!=typeof e)return e;var n=t.protocol+"//"+t.host,r=n+t.pathname.replace(/\/[^\/]*$/,"/");return e.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,function(e,t){var a,o=t.trim().replace(/^"(.*)"$/,function(e,t){return t}).replace(/^'(.*)'$/,function(e,t){return t});return/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(o)?e:(a=0===o.indexOf("//")?o:0===o.indexOf("/")?n+o:r+o.replace(/^\.\//,""),"url("+JSON.stringify(a)+")")})}},function(e,t,n){var r={},a=function(e){var t;return function(){return void 0===t&&(t=function(){return window&&document&&document.all&&!window.atob}.apply(this,arguments)),t}}(),o=function(e){var t={};return function(e){if("function"==typeof e)return e();if(void 0===t[e]){var n=function(e){return document.querySelector(e)}.call(this,e);if(window.HTMLIFrameElement&&n instanceof window.HTMLIFrameElement)try{n=n.contentDocument.head}catch(e){n=null}t[e]=n}return t[e]}}(),i=null,s=0,u=[],c=n(3);function l(e,t){for(var n=0;n<e.length;n++){var a=e[n],o=r[a.id];if(o){o.refs++;for(var i=0;i<o.parts.length;i++)o.parts[i](a.parts[i]);for(;i<a.parts.length;i++)o.parts.push(h(a.parts[i],t))}else{var s=[];for(i=0;i<a.parts.length;i++)s.push(h(a.parts[i],t));r[a.id]={id:a.id,refs:1,parts:s}}}}function d(e,t){for(var n=[],r={},a=0;a<e.length;a++){var o=e[a],i=t.base?o[0]+t.base:o[0],s={css:o[1],media:o[2],sourceMap:o[3]};r[i]?r[i].parts.push(s):n.push(r[i]={id:i,parts:[s]})}return n}function f(e,t){var n=o(e.insertInto);if(!n)throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");var r=u[u.length-1];if("top"===e.insertAt)r?r.nextSibling?n.insertBefore(t,r.nextSibling):n.appendChild(t):n.insertBefore(t,n.firstChild),u.push(t);else if("bottom"===e.insertAt)n.appendChild(t);else{if("object"!=typeof e.insertAt||!e.insertAt.before)throw new Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");var a=o(e.insertInto+" "+e.insertAt.before);n.insertBefore(t,a)}}function p(e){if(null===e.parentNode)return!1;e.parentNode.removeChild(e);var t=u.indexOf(e);t>=0&&u.splice(t,1)}function m(e){var t=document.createElement("style");return void 0===e.attrs.type&&(e.attrs.type="text/css"),v(t,e.attrs),f(e,t),t}function v(e,t){Object.keys(t).forEach(function(n){e.setAttribute(n,t[n])})}function h(e,t){var n,r,a,o;if(t.transform&&e.css){if(!(o=t.transform(e.css)))return function(){};e.css=o}if(t.singleton){var u=s++;n=i||(i=m(t)),r=g.bind(null,n,u,!1),a=g.bind(null,n,u,!0)}else e.sourceMap&&"function"==typeof URL&&"function"==typeof URL.createObjectURL&&"function"==typeof URL.revokeObjectURL&&"function"==typeof Blob&&"function"==typeof btoa?(n=function(e){var t=document.createElement("link");return void 0===e.attrs.type&&(e.attrs.type="text/css"),e.attrs.rel="stylesheet",v(t,e.attrs),f(e,t),t}(t),r=function(e,t,n){var r=n.css,a=n.sourceMap,o=void 0===t.convertToAbsoluteUrls&&a;(t.convertToAbsoluteUrls||o)&&(r=c(r)),a&&(r+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(a))))+" */");var i=new Blob([r],{type:"text/css"}),s=e.href;e.href=URL.createObjectURL(i),s&&URL.revokeObjectURL(s)}.bind(null,n,t),a=function(){p(n),n.href&&URL.revokeObjectURL(n.href)}):(n=m(t),r=function(e,t){var n=t.css,r=t.media;if(r&&e.setAttribute("media",r),e.styleSheet)e.styleSheet.cssText=n;else{for(;e.firstChild;)e.removeChild(e.firstChild);e.appendChild(document.createTextNode(n))}}.bind(null,n),a=function(){p(n)});return r(e),function(t){if(t){if(t.css===e.css&&t.media===e.media&&t.sourceMap===e.sourceMap)return;r(e=t)}else a()}}e.exports=function(e,t){if("undefined"!=typeof DEBUG&&DEBUG&&"object"!=typeof document)throw new Error("The style-loader cannot be used in a non-browser environment");(t=t||{}).attrs="object"==typeof t.attrs?t.attrs:{},t.singleton||"boolean"==typeof t.singleton||(t.singleton=a()),t.insertInto||(t.insertInto="head"),t.insertAt||(t.insertAt="bottom");var n=d(e,t);return l(n,t),function(e){for(var a=[],o=0;o<n.length;o++){var i=n[o];(s=r[i.id]).refs--,a.push(s)}for(e&&l(d(e,t),t),o=0;o<a.length;o++){var s;if(0===(s=a[o]).refs){for(var u=0;u<s.parts.length;u++)s.parts[u]();delete r[s.id]}}}};var y=function(){var e=[];return function(t,n){return e[t]=n,e.filter(Boolean).join("\n")}}();function g(e,t,n,r){var a=n?"":r.css;if(e.styleSheet)e.styleSheet.cssText=y(t,a);else{var o=document.createTextNode(a),i=e.childNodes;i[t]&&e.removeChild(i[t]),i.length?e.insertBefore(o,i[t]):e.appendChild(o)}}},,,function(e,t,n){},function(e,t,n){var r=n(7);"string"==typeof r&&(r=[[e.i,r,""]]);n(4)(r,{hmr:!0,transform:void 0,insertInto:void 0}),r.locals&&(e.exports=r.locals)},,function(e,t,n){"use strict";n(8);var r=n(2),a=function(e){return e&&e.__esModule?e:{default:e}}(n(1));document.addEventListener("DOMContentLoaded",function(e){i(function(e){e?console.error(e):(s(),d(),(0,r.getLazyLoadPlugin)(),(0,r.getGoogleMapsApi)())})}),document.getElementById("restaurant-isfavorite").addEventListener("click",function(e){var t=document.getElementById("restaurant-isfavorite"),n=document.getElementById("restaurant-isfavorite-icon"),r=f("id");t.classList.contains("selected")?a.default.unfavoriteRestaurantById(r).then(function(){n.classList.add("far"),n.classList.remove("fas"),t.classList.remove("selected"),t.setAttribute("aria-label","Favorite restaurant")},function(e){return console.log(e)}):a.default.favoriteRestaurantById(r).then(function(){n.classList.add("fas"),n.classList.remove("far"),t.classList.add("selected"),t.setAttribute("aria-label","Unfavorite restaurant")},function(e){return console.log(e)})});var o=document.getElementById("add-review-form");o.addEventListener("submit",function(e){e.preventDefault();var t=document.getElementById("add-review-submit-loading");t.style.display="inline";var n=document.getElementById("review-submit");n.disabled=!0;var r=document.getElementById("add-review-submit-success");r.style.display="none";var i=document.getElementById("add-review-submit-error");i.style.display="none";var s=document.getElementById("add-review-submit-error-empty");s.style.display="none";var u=document.getElementById("add-review-name");u.classList.remove("add-review-submit-message-field-error"),u.setAttribute("aria-invalid","false");var c=document.getElementById("add-review-rating");c.classList.remove("add-review-submit-message-field-error"),c.setAttribute("aria-invalid","false");var d=document.getElementById("add-review-comments");d.classList.remove("add-review-submit-message-field-error"),d.setAttribute("aria-invalid","false");var f={};f.restaurant_id=parseInt(document.getElementById("add-review-restaurant-id").value),f.name=u.value,f.rating=parseInt(c.value),f.comments=d.value,f.createdAt=Date.now();var p=!0;if(f.restaurant_id>0||(p=!1,t.style.display="none",n.disabled=!1,i.style.display="inline",console.log("Invalid restaurant_id")),p){var m=!1;""==f.name&&(u.classList.add("add-review-submit-message-field-error"),u.setAttribute("aria-invalid","true"),p=!1,m=!0),f.rating>=1||f.rating<=5||(c.classList.add("add-review-submit-message-field-error"),c.setAttribute("aria-invalid","true"),p=!1,m=!0),""==f.comments&&(d.classList.add("add-review-submit-message-field-error"),d.setAttribute("aria-invalid","true"),p=!1,m=!0),m?(t.style.display="none",n.disabled=!1,s.style.display="inline"):a.default.addReview(f).then(function(e){document.getElementById("reviews-list").prepend(l(e)),t.style.display="none",n.disabled=!1,r.textContent="Review submitted successfully!",r.style.display="inline",o.reset()},function(e){document.getElementById("reviews-list").prepend(l(e,!0)),t.style.display="none",n.disabled=!1,r.textContent="Review submitted successfully! (OFFLINE)",r.style.display="inline",o.reset()})}}),window.initMap=function(){self.map=new google.maps.Map(document.getElementById("map"),{zoom:16,center:self.restaurant.latlng,scrollwheel:!1}),a.default.mapMarkerForRestaurant(self.restaurant,self.map)};var i=function(e){if(self.restaurant)e(null);else{var t=f("id");t?a.default.fetchRestaurantById(t,function(t,n){self.restaurant=n,n?e(null):console.error(t)}):(error="No restaurant id in URL",e(error))}},s=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:self.restaurant;document.getElementById("restaurant-name").innerHTML=e.name,document.getElementById("restaurant-address").innerHTML=e.address;var t=document.getElementById("restaurant-img");t.className="restaurant-img lazy",t.alt=e.name;var n=a.default.imageUrlForRestaurant(e);if("noimg"==n){for(var o=document.getElementById("restaurant-img-sources");o.firstChild;)o.removeChild(o.firstChild);var i=n+".png";(0,r.addImageSourceToPicture)(o,n+".svg"),(0,r.addImageSourceToPicture)(o,i),t.setAttribute("data-src",i),t.className+=" noimg",o.append(t)}else{var s=(0,r.imageNamesBySize)(n);document.getElementById("restaurant-img-medium").setAttribute("data-srcset",s.medium),document.getElementById("restaurant-img-medium-large").setAttribute("data-srcset",s.large),document.getElementById("restaurant-img-large").setAttribute("data-srcset",s.medium+" 1x, "+s.large+" 2x"),t.setAttribute("data-src",s.small)}var l=document.getElementById("restaurant-cuisine");l.innerHTML=e.cuisine_type,l.setAttribute("aria-label","Restaurant cuisine type "+e.cuisine_type);var d=document.getElementById("restaurant-isfavorite");if(e.is_favorite){var f=document.getElementById("restaurant-isfavorite-icon");d.classList.add("selected"),d.setAttribute("aria-label","Unfavorite restaurant"),f.classList.remove("far"),f.classList.add("fas")}else d.setAttribute("aria-label","Favorite restaurant");e.operating_hours&&u(),document.getElementById("add-review-restaurant-id").value=e.id,c()},u=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:self.restaurant.operating_hours,t=document.getElementById("restaurant-hours");for(var n in e){var r=document.createElement("tr"),a=document.createElement("td");a.innerHTML=n,r.appendChild(a);var o=document.createElement("td");o.innerHTML=e[n],r.appendChild(o),t.appendChild(r)}},c=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:self.restaurant.id,t=document.getElementById("reviews-container");t.setAttribute("aria-labelledby","reviews-heading");var n=document.createElement("h3");n.innerHTML="Reviews",n.id="reviews-heading",t.appendChild(n),a.default.fetchReviewsByRestaurantId(e).then(function(e){var n=e[0],r=e[1];if(!n.length){var o=document.createElement("p");return o.innerHTML="No reviews yet!",void t.appendChild(o)}var i=document.getElementById("reviews-list");n.forEach(function(e){r&&a.default.addReviewToDatabase(e),i.appendChild(l(e,!("id"in e)))}),t.appendChild(i)})},l=function(e,t){var n=document.createElement("li");if(t){var a=document.createElement("p");a.innerHTML="OFFLINE",a.id="review-offline-"+e.id_local,a.className="review-offline",n.appendChild(a)}var o=document.createElement("p");o.innerHTML=e.name,n.appendChild(o);var i=(0,r.timestampToDate)(e.createdAt),s=document.createElement("p");s.innerHTML=i,n.appendChild(s);var u=document.createElement("p");u.innerHTML="Rating: "+e.rating,n.appendChild(u);var c=document.createElement("p");return c.innerHTML=e.comments,n.appendChild(c),n.tabIndex=0,n},d=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:self.restaurant,t=document.getElementById("breadcrumb"),n=document.createElement("li");t.appendChild(n);var r=document.createElement("a");r.href="#",r.innerHTML=e.name,r.setAttribute("aria-current","page"),n.appendChild(r)},f=function(e,t){t||(t=window.location.href),e=e.replace(/[\[\]]/g,"\\$&");var n=new RegExp("[?&]"+e+"(=([^&#]*)|&|#|$)").exec(t);return n?n[2]?decodeURIComponent(n[2].replace(/\+/g," ")):"":null};navigator.serviceWorker&&navigator.serviceWorker.addEventListener("message",function(e){"post_success"==e.data.action&&(a.default.addReviewToDatabase(e.data.review),document.getElementById("review-offline-"+e.data.review.id_local).remove())})}]);
//# sourceMappingURL=restaurant_info.bundle.js.map