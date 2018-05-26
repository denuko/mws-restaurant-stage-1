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
            // Display a map load failure message
            var mapOffline = document.createElement('div');
            mapOffline.id = 'map-offline';

            var mapOfflineMessage = document.createElement('span');
            mapOfflineMessage.innerHTML = 'No internet connection. Failed to load map.';
            mapOfflineMessage.id = 'map-offline-message';
            mapOffline.appendChild(mapOfflineMessage);

            var map = document.getElementById('map');
            map.append(mapOffline);
        }
    });
} else {
    console.log('Service Worker is not supported in this browser.');
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN3L2luZGV4LmpzIl0sIm5hbWVzIjpbIm5hdmlnYXRvciIsInNlcnZpY2VXb3JrZXIiLCJyZWdpc3RlciIsInRoZW4iLCJyZWciLCJjb250cm9sbGVyIiwiaW5zdGFsbGluZyIsImFkZEV2ZW50TGlzdGVuZXIiLCJzdGF0ZSIsImNvbnNvbGUiLCJsb2ciLCJwb3N0TWVzc2FnZSIsImFjdGlvbiIsIndhaXRpbmciLCJjYXRjaCIsImVycm9yIiwid2luZG93Iiwib25MaW5lIiwibWFwT2ZmbGluZSIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImlkIiwibWFwT2ZmbGluZU1lc3NhZ2UiLCJpbm5lckhUTUwiLCJhcHBlbmRDaGlsZCIsIm1hcCIsImdldEVsZW1lbnRCeUlkIiwiYXBwZW5kIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0EsSUFBSUEsVUFBVUMsYUFBZCxFQUE2QjtBQUN6QkQsY0FBVUMsYUFBVixDQUF3QkMsUUFBeEIsQ0FBaUMsU0FBakMsRUFDU0MsSUFEVCxDQUNjLFVBQUNDLEdBQUQsRUFBUztBQUNYO0FBQ0EsWUFBSUosVUFBVUMsYUFBVixDQUF3QkksVUFBNUIsRUFBd0M7QUFDcEM7QUFDQTtBQUNBLGdCQUFJRCxJQUFJRSxVQUFSLEVBQW9CO0FBQ2hCO0FBQ0FGLG9CQUFJRSxVQUFKLENBQWVDLGdCQUFmLENBQWdDLGFBQWhDLEVBQStDLFlBQVc7QUFDdEQsd0JBQUksS0FBS0MsS0FBTCxJQUFjLFdBQWxCLEVBQStCO0FBQzNCO0FBQ0FDLGdDQUFRQyxHQUFSLENBQVksMEJBQVo7QUFDQU4sNEJBQUlFLFVBQUosQ0FBZUssV0FBZixDQUEyQixFQUFDQyxRQUFRLGFBQVQsRUFBM0I7QUFDSDtBQUNKLGlCQU5EO0FBT0g7O0FBRUQ7QUFDQSxnQkFBSVIsSUFBSVMsT0FBUixFQUFpQjtBQUNiO0FBQ0FKLHdCQUFRQyxHQUFSLENBQVksd0JBQVo7QUFDQU4sb0JBQUlTLE9BQUosQ0FBWUYsV0FBWixDQUF3QixFQUFDQyxRQUFRLGFBQVQsRUFBeEI7QUFDSDs7QUFFRDtBQUNBUixnQkFBSUcsZ0JBQUosQ0FBcUIsYUFBckIsRUFBb0MsWUFBVztBQUMzQ0gsb0JBQUlFLFVBQUosQ0FBZUMsZ0JBQWYsQ0FBZ0MsYUFBaEMsRUFBK0MsWUFBVztBQUN0RCx3QkFBSSxLQUFLQyxLQUFMLElBQWMsV0FBbEIsRUFBK0I7QUFDM0JDLGdDQUFRQyxHQUFSLENBQVksbUJBQVo7QUFDQTtBQUNBLDZCQUFLQyxXQUFMLENBQWlCLEVBQUNDLFFBQVEsYUFBVCxFQUFqQjtBQUNIO0FBQ0osaUJBTkQ7QUFRSCxhQVREO0FBVUgsU0FoQ0QsTUFnQ087QUFDSDtBQUNBO0FBQ0FILG9CQUFRQyxHQUFSLENBQVksMENBQVo7QUFDQTtBQUNIO0FBQ0osS0F6Q1QsRUEwQ1NJLEtBMUNULENBMENlLFVBQUNDLEtBQUQsRUFBVztBQUNkTixnQkFBUU0sS0FBUixDQUFjQSxLQUFkO0FBQ0gsS0E1Q1Q7O0FBOENBQyxXQUFPVCxnQkFBUCxDQUF3QixNQUF4QixFQUFnQyxZQUFXO0FBQ3ZDO0FBQ0EsWUFBSSxDQUFDUCxVQUFVaUIsTUFBZixFQUF1QjtBQUNuQjtBQUNBLGdCQUFNQyxhQUFhQyxTQUFTQyxhQUFULENBQXVCLEtBQXZCLENBQW5CO0FBQ0FGLHVCQUFXRyxFQUFYLEdBQWdCLGFBQWhCOztBQUVBLGdCQUFNQyxvQkFBb0JILFNBQVNDLGFBQVQsQ0FBdUIsTUFBdkIsQ0FBMUI7QUFDQUUsOEJBQWtCQyxTQUFsQixHQUE4Qiw2Q0FBOUI7QUFDQUQsOEJBQWtCRCxFQUFsQixHQUF1QixxQkFBdkI7QUFDQUgsdUJBQVdNLFdBQVgsQ0FBdUJGLGlCQUF2Qjs7QUFFQSxnQkFBTUcsTUFBTU4sU0FBU08sY0FBVCxDQUF3QixLQUF4QixDQUFaO0FBQ0FELGdCQUFJRSxNQUFKLENBQVdULFVBQVg7QUFDSDtBQUNKLEtBZkQ7QUFnQkgsQ0EvREQsTUErRE87QUFDSFQsWUFBUUMsR0FBUixDQUFZLGtEQUFaO0FBQ0giLCJmaWxlIjoic3cvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBSZWdpc3RlciBzZXJ2aWNlIHdvcmtlciB3aXRoIHdob2xlIG9yaWdpbiBhcyBzY29wZSAoZGVmYXVsdCBzY29wZSlcbmlmIChuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikge1xuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcuL3N3LmpzJylcbiAgICAgICAgICAgIC50aGVuKChyZWcpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBwYWdlIGxvYWRlZCB1c2luZyBhIHNlcnZpY2Ugd29ya2VyXG4gICAgICAgICAgICAgICAgaWYgKG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLmNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYW4gaW5zdGFsbGluZyBzZXJ2aWNlIHdvcmtlclxuICAgICAgICAgICAgICAgICAgICAvLyB3aGVuIHRoZSBpbnN0YWxsZXIgaGFzIGJlZW4gZmlyZWQsIGJ1dCBoYXNu4oCZdCB5ZXQgY29tcGxldGVkXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWcuaW5zdGFsbGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlcmUgJ3MgYW4gdXBkYXRlIGluIHByb2dyZXNzXG4gICAgICAgICAgICAgICAgICAgICAgICByZWcuaW5zdGFsbGluZy5hZGRFdmVudExpc3RlbmVyKCdzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlID09ICdpbnN0YWxsZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlICdzIGEgcmVhZHkgdXBkYXRlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnc2VydmljZSB3b3JrZXIgaW5zdGFsbGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZy5pbnN0YWxsaW5nLnBvc3RNZXNzYWdlKHthY3Rpb246ICdza2lwV2FpdGluZyd9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFueSB3YWl0aW5nIHNlcnZpY2Ugd29ya2VyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWcud2FpdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGVsbCB0aGUgc2VydmljZSB3b3JrZXIgdG8gdGFrZSBvdmVyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnc2VydmljZSB3b3JrZXIgd2FpdGluZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVnLndhaXRpbmcucG9zdE1lc3NhZ2Uoe2FjdGlvbjogJ3NraXBXYWl0aW5nJ30pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy9DaGVjayBpZiBhbnkgdXBkYXRlIGlzIGZvdW5kXG4gICAgICAgICAgICAgICAgICAgIHJlZy5hZGRFdmVudExpc3RlbmVyKCd1cGRhdGVmb3VuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVnLmluc3RhbGxpbmcuYWRkRXZlbnRMaXN0ZW5lcignc3RhdGVjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PSAnaW5zdGFsbGVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnc3RhdGUgaGFzIGNoYW5nZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGVsbCB0aGUgc2VydmljZSB3b3JrZXIgdG8gdGFrZSBvdmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9zdE1lc3NhZ2Uoe2FjdGlvbjogJ3NraXBXYWl0aW5nJ30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENvbnRlbnQgbG9hZGVkIGZyb20gdGhlIG5ldHdvcmssIHdoaWNoIG1lYW5zIHRoYXQgdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIHVzZXIgaGFzIGFscmVhZHkgdGhlIGxhdGVzdCB2ZXJzaW9uXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdwYWdlIGRpZG5cXCd0IGxvYWQgdXNpbmcgYSBzZXJ2aWNlIHdvcmtlcicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gRGV0ZWN0IGlmIHBhZ2UgaXMgb2ZmbGluZVxuICAgICAgICBpZiAoIW5hdmlnYXRvci5vbkxpbmUpIHtcbiAgICAgICAgICAgIC8vIERpc3BsYXkgYSBtYXAgbG9hZCBmYWlsdXJlIG1lc3NhZ2VcbiAgICAgICAgICAgIGNvbnN0IG1hcE9mZmxpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIG1hcE9mZmxpbmUuaWQgPSAnbWFwLW9mZmxpbmUnO1xuXG4gICAgICAgICAgICBjb25zdCBtYXBPZmZsaW5lTWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgIG1hcE9mZmxpbmVNZXNzYWdlLmlubmVySFRNTCA9ICdObyBpbnRlcm5ldCBjb25uZWN0aW9uLiBGYWlsZWQgdG8gbG9hZCBtYXAuJztcbiAgICAgICAgICAgIG1hcE9mZmxpbmVNZXNzYWdlLmlkID0gJ21hcC1vZmZsaW5lLW1lc3NhZ2UnO1xuICAgICAgICAgICAgbWFwT2ZmbGluZS5hcHBlbmRDaGlsZChtYXBPZmZsaW5lTWVzc2FnZSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG1hcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKTtcbiAgICAgICAgICAgIG1hcC5hcHBlbmQobWFwT2ZmbGluZSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ1NlcnZpY2UgV29ya2VyIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyLicpO1xufSJdfQ==
