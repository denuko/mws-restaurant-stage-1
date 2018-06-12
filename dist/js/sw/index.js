'use strict';

// Register service worker with whole origin as scope (default scope)
if (navigator.serviceWorker) {
    navigator.serviceWorker.register('./sw.js').then(function (reg) {
        // Check if page loaded using a service worker
        if (navigator.serviceWorker.controller) {
            // Check if there is an installing service worker
            // when the installer has been fired, but hasn’t yet completed
            if (reg.installing) {
                // There 's an update in progress
                reg.installing.addEventListener('statechange', function () {
                    if (this.state == 'installed') {
                        // There 's a ready update 
                        console.log('service worker installed');
                        reg.installing.postMessage({ action: 'skipWaiting' });
                    }
                });
            }

            // Check if there is any waiting service worker
            if (reg.waiting) {
                // Tell the service worker to take over
                console.log('service worker waiting');
                reg.waiting.postMessage({ action: 'skipWaiting' });
            }

            //Check if any update is found
            reg.addEventListener('updatefound', function () {
                reg.installing.addEventListener('statechange', function () {
                    if (this.state == 'installed') {
                        console.log('state has changed');
                        // Tell the service worker to take over
                        this.postMessage({ action: 'skipWaiting' });
                    }
                });
            });
        } else {
            // Content loaded from the network, which means that the
            // user has already the latest version
            console.log('page didn\'t load using a service worker');
            return;
        }
    }).catch(function (error) {
        console.error(error);
    });

    window.addEventListener('load', function () {
        // Detect if page is offline
        if (!navigator.onLine) {
            var map = document.getElementById('map');
            map.className = 'offline';
        }
    });
} else {
    console.log('Service Worker is not supported in this browser.');
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN3L2luZGV4LmpzIl0sIm5hbWVzIjpbIm5hdmlnYXRvciIsInNlcnZpY2VXb3JrZXIiLCJyZWdpc3RlciIsInRoZW4iLCJyZWciLCJjb250cm9sbGVyIiwiaW5zdGFsbGluZyIsImFkZEV2ZW50TGlzdGVuZXIiLCJzdGF0ZSIsImNvbnNvbGUiLCJsb2ciLCJwb3N0TWVzc2FnZSIsImFjdGlvbiIsIndhaXRpbmciLCJjYXRjaCIsImVycm9yIiwid2luZG93Iiwib25MaW5lIiwibWFwIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImNsYXNzTmFtZSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBLElBQUlBLFVBQVVDLGFBQWQsRUFBNkI7QUFDekJELGNBQVVDLGFBQVYsQ0FBd0JDLFFBQXhCLENBQWlDLFNBQWpDLEVBQ1NDLElBRFQsQ0FDYyxVQUFDQyxHQUFELEVBQVM7QUFDWDtBQUNBLFlBQUlKLFVBQVVDLGFBQVYsQ0FBd0JJLFVBQTVCLEVBQXdDO0FBQ3BDO0FBQ0E7QUFDQSxnQkFBSUQsSUFBSUUsVUFBUixFQUFvQjtBQUNoQjtBQUNBRixvQkFBSUUsVUFBSixDQUFlQyxnQkFBZixDQUFnQyxhQUFoQyxFQUErQyxZQUFXO0FBQ3RELHdCQUFJLEtBQUtDLEtBQUwsSUFBYyxXQUFsQixFQUErQjtBQUMzQjtBQUNBQyxnQ0FBUUMsR0FBUixDQUFZLDBCQUFaO0FBQ0FOLDRCQUFJRSxVQUFKLENBQWVLLFdBQWYsQ0FBMkIsRUFBQ0MsUUFBUSxhQUFULEVBQTNCO0FBQ0g7QUFDSixpQkFORDtBQU9IOztBQUVEO0FBQ0EsZ0JBQUlSLElBQUlTLE9BQVIsRUFBaUI7QUFDYjtBQUNBSix3QkFBUUMsR0FBUixDQUFZLHdCQUFaO0FBQ0FOLG9CQUFJUyxPQUFKLENBQVlGLFdBQVosQ0FBd0IsRUFBQ0MsUUFBUSxhQUFULEVBQXhCO0FBQ0g7O0FBRUQ7QUFDQVIsZ0JBQUlHLGdCQUFKLENBQXFCLGFBQXJCLEVBQW9DLFlBQVc7QUFDM0NILG9CQUFJRSxVQUFKLENBQWVDLGdCQUFmLENBQWdDLGFBQWhDLEVBQStDLFlBQVc7QUFDdEQsd0JBQUksS0FBS0MsS0FBTCxJQUFjLFdBQWxCLEVBQStCO0FBQzNCQyxnQ0FBUUMsR0FBUixDQUFZLG1CQUFaO0FBQ0E7QUFDQSw2QkFBS0MsV0FBTCxDQUFpQixFQUFDQyxRQUFRLGFBQVQsRUFBakI7QUFDSDtBQUNKLGlCQU5EO0FBUUgsYUFURDtBQVVILFNBaENELE1BZ0NPO0FBQ0g7QUFDQTtBQUNBSCxvQkFBUUMsR0FBUixDQUFZLDBDQUFaO0FBQ0E7QUFDSDtBQUNKLEtBekNULEVBMENTSSxLQTFDVCxDQTBDZSxVQUFDQyxLQUFELEVBQVc7QUFDZE4sZ0JBQVFNLEtBQVIsQ0FBY0EsS0FBZDtBQUNILEtBNUNUOztBQThDQUMsV0FBT1QsZ0JBQVAsQ0FBd0IsTUFBeEIsRUFBZ0MsWUFBVztBQUN2QztBQUNBLFlBQUksQ0FBQ1AsVUFBVWlCLE1BQWYsRUFBdUI7QUFDbkIsZ0JBQU1DLE1BQU1DLFNBQVNDLGNBQVQsQ0FBd0IsS0FBeEIsQ0FBWjtBQUNBRixnQkFBSUcsU0FBSixHQUFnQixTQUFoQjtBQUNIO0FBQ0osS0FORDtBQU9ILENBdERELE1Bc0RPO0FBQ0haLFlBQVFDLEdBQVIsQ0FBWSxrREFBWjtBQUNIIiwiZmlsZSI6InN3L2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gUmVnaXN0ZXIgc2VydmljZSB3b3JrZXIgd2l0aCB3aG9sZSBvcmlnaW4gYXMgc2NvcGUgKGRlZmF1bHQgc2NvcGUpXG5pZiAobmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHtcbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlcignLi9zdy5qcycpXG4gICAgICAgICAgICAudGhlbigocmVnKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgcGFnZSBsb2FkZWQgdXNpbmcgYSBzZXJ2aWNlIHdvcmtlclxuICAgICAgICAgICAgICAgIGlmIChuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5jb250cm9sbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFuIGluc3RhbGxpbmcgc2VydmljZSB3b3JrZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gd2hlbiB0aGUgaW5zdGFsbGVyIGhhcyBiZWVuIGZpcmVkLCBidXQgaGFzbuKAmXQgeWV0IGNvbXBsZXRlZFxuICAgICAgICAgICAgICAgICAgICBpZiAocmVnLmluc3RhbGxpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlICdzIGFuIHVwZGF0ZSBpbiBwcm9ncmVzc1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVnLmluc3RhbGxpbmcuYWRkRXZlbnRMaXN0ZW5lcignc3RhdGVjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PSAnaW5zdGFsbGVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSAncyBhIHJlYWR5IHVwZGF0ZSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3NlcnZpY2Ugd29ya2VyIGluc3RhbGxlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWcuaW5zdGFsbGluZy5wb3N0TWVzc2FnZSh7YWN0aW9uOiAnc2tpcFdhaXRpbmcnfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbnkgd2FpdGluZyBzZXJ2aWNlIHdvcmtlclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVnLndhaXRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRlbGwgdGhlIHNlcnZpY2Ugd29ya2VyIHRvIHRha2Ugb3ZlclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3NlcnZpY2Ugd29ya2VyIHdhaXRpbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZy53YWl0aW5nLnBvc3RNZXNzYWdlKHthY3Rpb246ICdza2lwV2FpdGluZyd9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vQ2hlY2sgaWYgYW55IHVwZGF0ZSBpcyBmb3VuZFxuICAgICAgICAgICAgICAgICAgICByZWcuYWRkRXZlbnRMaXN0ZW5lcigndXBkYXRlZm91bmQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZy5pbnN0YWxsaW5nLmFkZEV2ZW50TGlzdGVuZXIoJ3N0YXRlY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT0gJ2luc3RhbGxlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3N0YXRlIGhhcyBjaGFuZ2VkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRlbGwgdGhlIHNlcnZpY2Ugd29ya2VyIHRvIHRha2Ugb3ZlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvc3RNZXNzYWdlKHthY3Rpb246ICdza2lwV2FpdGluZyd9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBDb250ZW50IGxvYWRlZCBmcm9tIHRoZSBuZXR3b3JrLCB3aGljaCBtZWFucyB0aGF0IHRoZVxuICAgICAgICAgICAgICAgICAgICAvLyB1c2VyIGhhcyBhbHJlYWR5IHRoZSBsYXRlc3QgdmVyc2lvblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygncGFnZSBkaWRuXFwndCBsb2FkIHVzaW5nIGEgc2VydmljZSB3b3JrZXInKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9KTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIERldGVjdCBpZiBwYWdlIGlzIG9mZmxpbmVcbiAgICAgICAgaWYgKCFuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgICAgICBjb25zdCBtYXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyk7XG4gICAgICAgICAgICBtYXAuY2xhc3NOYW1lID0gJ29mZmxpbmUnO1xuICAgICAgICB9XG4gICAgfSk7XG59IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdTZXJ2aWNlIFdvcmtlciBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3Nlci4nKTtcbn0iXX0=
