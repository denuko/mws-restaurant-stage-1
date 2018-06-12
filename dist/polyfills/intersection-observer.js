'use strict';

/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 */

(function (window, document) {
  'use strict';

  // Exits early if all IntersectionObserver and IntersectionObserverEntry
  // features are natively supported.

  if ('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype) {

    // Minimal polyfill for Edge 15's lack of `isIntersecting`
    // See: https://github.com/w3c/IntersectionObserver/issues/211
    if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
      Object.defineProperty(window.IntersectionObserverEntry.prototype, 'isIntersecting', {
        get: function get() {
          return this.intersectionRatio > 0;
        }
      });
    }
    return;
  }

  /**
   * An IntersectionObserver registry. This registry exists to hold a strong
   * reference to IntersectionObserver instances currently observering a target
   * element. Without this registry, instances without another reference may be
   * garbage collected.
   */
  var registry = [];

  /**
   * Creates the global IntersectionObserverEntry constructor.
   * https://w3c.github.io/IntersectionObserver/#intersection-observer-entry
   * @param {Object} entry A dictionary of instance properties.
   * @constructor
   */
  function IntersectionObserverEntry(entry) {
    this.time = entry.time;
    this.target = entry.target;
    this.rootBounds = entry.rootBounds;
    this.boundingClientRect = entry.boundingClientRect;
    this.intersectionRect = entry.intersectionRect || getEmptyRect();
    this.isIntersecting = !!entry.intersectionRect;

    // Calculates the intersection ratio.
    var targetRect = this.boundingClientRect;
    var targetArea = targetRect.width * targetRect.height;
    var intersectionRect = this.intersectionRect;
    var intersectionArea = intersectionRect.width * intersectionRect.height;

    // Sets intersection ratio.
    if (targetArea) {
      this.intersectionRatio = intersectionArea / targetArea;
    } else {
      // If area is zero and is intersecting, sets to 1, otherwise to 0
      this.intersectionRatio = this.isIntersecting ? 1 : 0;
    }
  }

  /**
   * Creates the global IntersectionObserver constructor.
   * https://w3c.github.io/IntersectionObserver/#intersection-observer-interface
   * @param {Function} callback The function to be invoked after intersection
   *     changes have queued. The function is not invoked if the queue has
   *     been emptied by calling the `takeRecords` method.
   * @param {Object=} opt_options Optional configuration options.
   * @constructor
   */
  function IntersectionObserver(callback, opt_options) {

    var options = opt_options || {};

    if (typeof callback != 'function') {
      throw new Error('callback must be a function');
    }

    if (options.root && options.root.nodeType != 1) {
      throw new Error('root must be an Element');
    }

    // Binds and throttles `this._checkForIntersections`.
    this._checkForIntersections = throttle(this._checkForIntersections.bind(this), this.THROTTLE_TIMEOUT);

    // Private properties.
    this._callback = callback;
    this._observationTargets = [];
    this._queuedEntries = [];
    this._rootMarginValues = this._parseRootMargin(options.rootMargin);

    // Public properties.
    this.thresholds = this._initThresholds(options.threshold);
    this.root = options.root || null;
    this.rootMargin = this._rootMarginValues.map(function (margin) {
      return margin.value + margin.unit;
    }).join(' ');
  }

  /**
   * The minimum interval within which the document will be checked for
   * intersection changes.
   */
  IntersectionObserver.prototype.THROTTLE_TIMEOUT = 100;

  /**
   * The frequency in which the polyfill polls for intersection changes.
   * this can be updated on a per instance basis and must be set prior to
   * calling `observe` on the first target.
   */
  IntersectionObserver.prototype.POLL_INTERVAL = null;

  /**
   * Use a mutation observer on the root element
   * to detect intersection changes.
   */
  IntersectionObserver.prototype.USE_MUTATION_OBSERVER = true;

  /**
   * Starts observing a target element for intersection changes based on
   * the thresholds values.
   * @param {Element} target The DOM element to observe.
   */
  IntersectionObserver.prototype.observe = function (target) {
    var isTargetAlreadyObserved = this._observationTargets.some(function (item) {
      return item.element == target;
    });

    if (isTargetAlreadyObserved) {
      return;
    }

    if (!(target && target.nodeType == 1)) {
      throw new Error('target must be an Element');
    }

    this._registerInstance();
    this._observationTargets.push({ element: target, entry: null });
    this._monitorIntersections();
    this._checkForIntersections();
  };

  /**
   * Stops observing a target element for intersection changes.
   * @param {Element} target The DOM element to observe.
   */
  IntersectionObserver.prototype.unobserve = function (target) {
    this._observationTargets = this._observationTargets.filter(function (item) {

      return item.element != target;
    });
    if (!this._observationTargets.length) {
      this._unmonitorIntersections();
      this._unregisterInstance();
    }
  };

  /**
   * Stops observing all target elements for intersection changes.
   */
  IntersectionObserver.prototype.disconnect = function () {
    this._observationTargets = [];
    this._unmonitorIntersections();
    this._unregisterInstance();
  };

  /**
   * Returns any queue entries that have not yet been reported to the
   * callback and clears the queue. This can be used in conjunction with the
   * callback to obtain the absolute most up-to-date intersection information.
   * @return {Array} The currently queued entries.
   */
  IntersectionObserver.prototype.takeRecords = function () {
    var records = this._queuedEntries.slice();
    this._queuedEntries = [];
    return records;
  };

  /**
   * Accepts the threshold value from the user configuration object and
   * returns a sorted array of unique threshold values. If a value is not
   * between 0 and 1 and error is thrown.
   * @private
   * @param {Array|number=} opt_threshold An optional threshold value or
   *     a list of threshold values, defaulting to [0].
   * @return {Array} A sorted list of unique and valid threshold values.
   */
  IntersectionObserver.prototype._initThresholds = function (opt_threshold) {
    var threshold = opt_threshold || [0];
    if (!Array.isArray(threshold)) threshold = [threshold];

    return threshold.sort().filter(function (t, i, a) {
      if (typeof t != 'number' || isNaN(t) || t < 0 || t > 1) {
        throw new Error('threshold must be a number between 0 and 1 inclusively');
      }
      return t !== a[i - 1];
    });
  };

  /**
   * Accepts the rootMargin value from the user configuration object
   * and returns an array of the four margin values as an object containing
   * the value and unit properties. If any of the values are not properly
   * formatted or use a unit other than px or %, and error is thrown.
   * @private
   * @param {string=} opt_rootMargin An optional rootMargin value,
   *     defaulting to '0px'.
   * @return {Array<Object>} An array of margin objects with the keys
   *     value and unit.
   */
  IntersectionObserver.prototype._parseRootMargin = function (opt_rootMargin) {
    var marginString = opt_rootMargin || '0px';
    var margins = marginString.split(/\s+/).map(function (margin) {
      var parts = /^(-?\d*\.?\d+)(px|%)$/.exec(margin);
      if (!parts) {
        throw new Error('rootMargin must be specified in pixels or percent');
      }
      return { value: parseFloat(parts[1]), unit: parts[2] };
    });

    // Handles shorthand.
    margins[1] = margins[1] || margins[0];
    margins[2] = margins[2] || margins[0];
    margins[3] = margins[3] || margins[1];

    return margins;
  };

  /**
   * Starts polling for intersection changes if the polling is not already
   * happening, and if the page's visibilty state is visible.
   * @private
   */
  IntersectionObserver.prototype._monitorIntersections = function () {
    if (!this._monitoringIntersections) {
      this._monitoringIntersections = true;

      // If a poll interval is set, use polling instead of listening to
      // resize and scroll events or DOM mutations.
      if (this.POLL_INTERVAL) {
        this._monitoringInterval = setInterval(this._checkForIntersections, this.POLL_INTERVAL);
      } else {
        addEvent(window, 'resize', this._checkForIntersections, true);
        addEvent(document, 'scroll', this._checkForIntersections, true);

        if (this.USE_MUTATION_OBSERVER && 'MutationObserver' in window) {
          this._domObserver = new MutationObserver(this._checkForIntersections);
          this._domObserver.observe(document, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
          });
        }
      }
    }
  };

  /**
   * Stops polling for intersection changes.
   * @private
   */
  IntersectionObserver.prototype._unmonitorIntersections = function () {
    if (this._monitoringIntersections) {
      this._monitoringIntersections = false;

      clearInterval(this._monitoringInterval);
      this._monitoringInterval = null;

      removeEvent(window, 'resize', this._checkForIntersections, true);
      removeEvent(document, 'scroll', this._checkForIntersections, true);

      if (this._domObserver) {
        this._domObserver.disconnect();
        this._domObserver = null;
      }
    }
  };

  /**
   * Scans each observation target for intersection changes and adds them
   * to the internal entries queue. If new entries are found, it
   * schedules the callback to be invoked.
   * @private
   */
  IntersectionObserver.prototype._checkForIntersections = function () {
    var rootIsInDom = this._rootIsInDom();
    var rootRect = rootIsInDom ? this._getRootRect() : getEmptyRect();

    this._observationTargets.forEach(function (item) {
      var target = item.element;
      var targetRect = getBoundingClientRect(target);
      var rootContainsTarget = this._rootContainsTarget(target);
      var oldEntry = item.entry;
      var intersectionRect = rootIsInDom && rootContainsTarget && this._computeTargetAndRootIntersection(target, rootRect);

      var newEntry = item.entry = new IntersectionObserverEntry({
        time: now(),
        target: target,
        boundingClientRect: targetRect,
        rootBounds: rootRect,
        intersectionRect: intersectionRect
      });

      if (!oldEntry) {
        this._queuedEntries.push(newEntry);
      } else if (rootIsInDom && rootContainsTarget) {
        // If the new entry intersection ratio has crossed any of the
        // thresholds, add a new entry.
        if (this._hasCrossedThreshold(oldEntry, newEntry)) {
          this._queuedEntries.push(newEntry);
        }
      } else {
        // If the root is not in the DOM or target is not contained within
        // root but the previous entry for this target had an intersection,
        // add a new record indicating removal.
        if (oldEntry && oldEntry.isIntersecting) {
          this._queuedEntries.push(newEntry);
        }
      }
    }, this);

    if (this._queuedEntries.length) {
      this._callback(this.takeRecords(), this);
    }
  };

  /**
   * Accepts a target and root rect computes the intersection between then
   * following the algorithm in the spec.
   * TODO(philipwalton): at this time clip-path is not considered.
   * https://w3c.github.io/IntersectionObserver/#calculate-intersection-rect-algo
   * @param {Element} target The target DOM element
   * @param {Object} rootRect The bounding rect of the root after being
   *     expanded by the rootMargin value.
   * @return {?Object} The final intersection rect object or undefined if no
   *     intersection is found.
   * @private
   */
  IntersectionObserver.prototype._computeTargetAndRootIntersection = function (target, rootRect) {

    // If the element isn't displayed, an intersection can't happen.
    if (window.getComputedStyle(target).display == 'none') return;

    var targetRect = getBoundingClientRect(target);
    var intersectionRect = targetRect;
    var parent = getParentNode(target);
    var atRoot = false;

    while (!atRoot) {
      var parentRect = null;
      var parentComputedStyle = parent.nodeType == 1 ? window.getComputedStyle(parent) : {};

      // If the parent isn't displayed, an intersection can't happen.
      if (parentComputedStyle.display == 'none') return;

      if (parent == this.root || parent == document) {
        atRoot = true;
        parentRect = rootRect;
      } else {
        // If the element has a non-visible overflow, and it's not the <body>
        // or <html> element, update the intersection rect.
        // Note: <body> and <html> cannot be clipped to a rect that's not also
        // the document rect, so no need to compute a new intersection.
        if (parent != document.body && parent != document.documentElement && parentComputedStyle.overflow != 'visible') {
          parentRect = getBoundingClientRect(parent);
        }
      }

      // If either of the above conditionals set a new parentRect,
      // calculate new intersection data.
      if (parentRect) {
        intersectionRect = computeRectIntersection(parentRect, intersectionRect);

        if (!intersectionRect) break;
      }
      parent = getParentNode(parent);
    }
    return intersectionRect;
  };

  /**
   * Returns the root rect after being expanded by the rootMargin value.
   * @return {Object} The expanded root rect.
   * @private
   */
  IntersectionObserver.prototype._getRootRect = function () {
    var rootRect;
    if (this.root) {
      rootRect = getBoundingClientRect(this.root);
    } else {
      // Use <html>/<body> instead of window since scroll bars affect size.
      var html = document.documentElement;
      var body = document.body;
      rootRect = {
        top: 0,
        left: 0,
        right: html.clientWidth || body.clientWidth,
        width: html.clientWidth || body.clientWidth,
        bottom: html.clientHeight || body.clientHeight,
        height: html.clientHeight || body.clientHeight
      };
    }
    return this._expandRectByRootMargin(rootRect);
  };

  /**
   * Accepts a rect and expands it by the rootMargin value.
   * @param {Object} rect The rect object to expand.
   * @return {Object} The expanded rect.
   * @private
   */
  IntersectionObserver.prototype._expandRectByRootMargin = function (rect) {
    var margins = this._rootMarginValues.map(function (margin, i) {
      return margin.unit == 'px' ? margin.value : margin.value * (i % 2 ? rect.width : rect.height) / 100;
    });
    var newRect = {
      top: rect.top - margins[0],
      right: rect.right + margins[1],
      bottom: rect.bottom + margins[2],
      left: rect.left - margins[3]
    };
    newRect.width = newRect.right - newRect.left;
    newRect.height = newRect.bottom - newRect.top;

    return newRect;
  };

  /**
   * Accepts an old and new entry and returns true if at least one of the
   * threshold values has been crossed.
   * @param {?IntersectionObserverEntry} oldEntry The previous entry for a
   *    particular target element or null if no previous entry exists.
   * @param {IntersectionObserverEntry} newEntry The current entry for a
   *    particular target element.
   * @return {boolean} Returns true if a any threshold has been crossed.
   * @private
   */
  IntersectionObserver.prototype._hasCrossedThreshold = function (oldEntry, newEntry) {

    // To make comparing easier, an entry that has a ratio of 0
    // but does not actually intersect is given a value of -1
    var oldRatio = oldEntry && oldEntry.isIntersecting ? oldEntry.intersectionRatio || 0 : -1;
    var newRatio = newEntry.isIntersecting ? newEntry.intersectionRatio || 0 : -1;

    // Ignore unchanged ratios
    if (oldRatio === newRatio) return;

    for (var i = 0; i < this.thresholds.length; i++) {
      var threshold = this.thresholds[i];

      // Return true if an entry matches a threshold or if the new ratio
      // and the old ratio are on the opposite sides of a threshold.
      if (threshold == oldRatio || threshold == newRatio || threshold < oldRatio !== threshold < newRatio) {
        return true;
      }
    }
  };

  /**
   * Returns whether or not the root element is an element and is in the DOM.
   * @return {boolean} True if the root element is an element and is in the DOM.
   * @private
   */
  IntersectionObserver.prototype._rootIsInDom = function () {
    return !this.root || containsDeep(document, this.root);
  };

  /**
   * Returns whether or not the target element is a child of root.
   * @param {Element} target The target element to check.
   * @return {boolean} True if the target element is a child of root.
   * @private
   */
  IntersectionObserver.prototype._rootContainsTarget = function (target) {
    return containsDeep(this.root || document, target);
  };

  /**
   * Adds the instance to the global IntersectionObserver registry if it isn't
   * already present.
   * @private
   */
  IntersectionObserver.prototype._registerInstance = function () {
    if (registry.indexOf(this) < 0) {
      registry.push(this);
    }
  };

  /**
   * Removes the instance from the global IntersectionObserver registry.
   * @private
   */
  IntersectionObserver.prototype._unregisterInstance = function () {
    var index = registry.indexOf(this);
    if (index != -1) registry.splice(index, 1);
  };

  /**
   * Returns the result of the performance.now() method or null in browsers
   * that don't support the API.
   * @return {number} The elapsed time since the page was requested.
   */
  function now() {
    return window.performance && performance.now && performance.now();
  }

  /**
   * Throttles a function and delays its executiong, so it's only called at most
   * once within a given time period.
   * @param {Function} fn The function to throttle.
   * @param {number} timeout The amount of time that must pass before the
   *     function can be called again.
   * @return {Function} The throttled function.
   */
  function throttle(fn, timeout) {
    var timer = null;
    return function () {
      if (!timer) {
        timer = setTimeout(function () {
          fn();
          timer = null;
        }, timeout);
      }
    };
  }

  /**
   * Adds an event handler to a DOM node ensuring cross-browser compatibility.
   * @param {Node} node The DOM node to add the event handler to.
   * @param {string} event The event name.
   * @param {Function} fn The event handler to add.
   * @param {boolean} opt_useCapture Optionally adds the even to the capture
   *     phase. Note: this only works in modern browsers.
   */
  function addEvent(node, event, fn, opt_useCapture) {
    if (typeof node.addEventListener == 'function') {
      node.addEventListener(event, fn, opt_useCapture || false);
    } else if (typeof node.attachEvent == 'function') {
      node.attachEvent('on' + event, fn);
    }
  }

  /**
   * Removes a previously added event handler from a DOM node.
   * @param {Node} node The DOM node to remove the event handler from.
   * @param {string} event The event name.
   * @param {Function} fn The event handler to remove.
   * @param {boolean} opt_useCapture If the event handler was added with this
   *     flag set to true, it should be set to true here in order to remove it.
   */
  function removeEvent(node, event, fn, opt_useCapture) {
    if (typeof node.removeEventListener == 'function') {
      node.removeEventListener(event, fn, opt_useCapture || false);
    } else if (typeof node.detatchEvent == 'function') {
      node.detatchEvent('on' + event, fn);
    }
  }

  /**
   * Returns the intersection between two rect objects.
   * @param {Object} rect1 The first rect.
   * @param {Object} rect2 The second rect.
   * @return {?Object} The intersection rect or undefined if no intersection
   *     is found.
   */
  function computeRectIntersection(rect1, rect2) {
    var top = Math.max(rect1.top, rect2.top);
    var bottom = Math.min(rect1.bottom, rect2.bottom);
    var left = Math.max(rect1.left, rect2.left);
    var right = Math.min(rect1.right, rect2.right);
    var width = right - left;
    var height = bottom - top;

    return width >= 0 && height >= 0 && {
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      width: width,
      height: height
    };
  }

  /**
   * Shims the native getBoundingClientRect for compatibility with older IE.
   * @param {Element} el The element whose bounding rect to get.
   * @return {Object} The (possibly shimmed) rect of the element.
   */
  function getBoundingClientRect(el) {
    var rect;

    try {
      rect = el.getBoundingClientRect();
    } catch (err) {
      // Ignore Windows 7 IE11 "Unspecified error"
      // https://github.com/w3c/IntersectionObserver/pull/205
    }

    if (!rect) return getEmptyRect();

    // Older IE
    if (!(rect.width && rect.height)) {
      rect = {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top
      };
    }
    return rect;
  }

  /**
   * Returns an empty rect object. An empty rect is returned when an element
   * is not in the DOM.
   * @return {Object} The empty rect.
   */
  function getEmptyRect() {
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: 0,
      height: 0
    };
  }

  /**
   * Checks to see if a parent element contains a child elemnt (including inside
   * shadow DOM).
   * @param {Node} parent The parent element.
   * @param {Node} child The child element.
   * @return {boolean} True if the parent node contains the child node.
   */
  function containsDeep(parent, child) {
    var node = child;
    while (node) {
      if (node == parent) return true;

      node = getParentNode(node);
    }
    return false;
  }

  /**
   * Gets the parent node of an element or its host element if the parent node
   * is a shadow root.
   * @param {Node} node The node whose parent to get.
   * @return {Node|null} The parent node or null if no parent exists.
   */
  function getParentNode(node) {
    var parent = node.parentNode;

    if (parent && parent.nodeType == 11 && parent.host) {
      // If the parent is a shadow root, return the host element.
      return parent.host;
    }
    return parent;
  }

  // Exposes the constructors globally.
  window.IntersectionObserver = IntersectionObserver;
  window.IntersectionObserverEntry = IntersectionObserverEntry;
})(window, document);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYnMvcG9seWZpbGxzL2ludGVyc2VjdGlvbi1vYnNlcnZlci5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJkb2N1bWVudCIsIkludGVyc2VjdGlvbk9ic2VydmVyRW50cnkiLCJwcm90b3R5cGUiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImludGVyc2VjdGlvblJhdGlvIiwicmVnaXN0cnkiLCJlbnRyeSIsInRpbWUiLCJ0YXJnZXQiLCJyb290Qm91bmRzIiwiYm91bmRpbmdDbGllbnRSZWN0IiwiaW50ZXJzZWN0aW9uUmVjdCIsImdldEVtcHR5UmVjdCIsImlzSW50ZXJzZWN0aW5nIiwidGFyZ2V0UmVjdCIsInRhcmdldEFyZWEiLCJ3aWR0aCIsImhlaWdodCIsImludGVyc2VjdGlvbkFyZWEiLCJJbnRlcnNlY3Rpb25PYnNlcnZlciIsImNhbGxiYWNrIiwib3B0X29wdGlvbnMiLCJvcHRpb25zIiwiRXJyb3IiLCJyb290Iiwibm9kZVR5cGUiLCJfY2hlY2tGb3JJbnRlcnNlY3Rpb25zIiwidGhyb3R0bGUiLCJiaW5kIiwiVEhST1RUTEVfVElNRU9VVCIsIl9jYWxsYmFjayIsIl9vYnNlcnZhdGlvblRhcmdldHMiLCJfcXVldWVkRW50cmllcyIsIl9yb290TWFyZ2luVmFsdWVzIiwiX3BhcnNlUm9vdE1hcmdpbiIsInJvb3RNYXJnaW4iLCJ0aHJlc2hvbGRzIiwiX2luaXRUaHJlc2hvbGRzIiwidGhyZXNob2xkIiwibWFwIiwibWFyZ2luIiwidmFsdWUiLCJ1bml0Iiwiam9pbiIsIlBPTExfSU5URVJWQUwiLCJVU0VfTVVUQVRJT05fT0JTRVJWRVIiLCJvYnNlcnZlIiwiaXNUYXJnZXRBbHJlYWR5T2JzZXJ2ZWQiLCJzb21lIiwiaXRlbSIsImVsZW1lbnQiLCJfcmVnaXN0ZXJJbnN0YW5jZSIsInB1c2giLCJfbW9uaXRvckludGVyc2VjdGlvbnMiLCJ1bm9ic2VydmUiLCJmaWx0ZXIiLCJsZW5ndGgiLCJfdW5tb25pdG9ySW50ZXJzZWN0aW9ucyIsIl91bnJlZ2lzdGVySW5zdGFuY2UiLCJkaXNjb25uZWN0IiwidGFrZVJlY29yZHMiLCJyZWNvcmRzIiwic2xpY2UiLCJvcHRfdGhyZXNob2xkIiwiQXJyYXkiLCJpc0FycmF5Iiwic29ydCIsInQiLCJpIiwiYSIsImlzTmFOIiwib3B0X3Jvb3RNYXJnaW4iLCJtYXJnaW5TdHJpbmciLCJtYXJnaW5zIiwic3BsaXQiLCJwYXJ0cyIsImV4ZWMiLCJwYXJzZUZsb2F0IiwiX21vbml0b3JpbmdJbnRlcnNlY3Rpb25zIiwiX21vbml0b3JpbmdJbnRlcnZhbCIsInNldEludGVydmFsIiwiYWRkRXZlbnQiLCJfZG9tT2JzZXJ2ZXIiLCJNdXRhdGlvbk9ic2VydmVyIiwiYXR0cmlidXRlcyIsImNoaWxkTGlzdCIsImNoYXJhY3RlckRhdGEiLCJzdWJ0cmVlIiwiY2xlYXJJbnRlcnZhbCIsInJlbW92ZUV2ZW50Iiwicm9vdElzSW5Eb20iLCJfcm9vdElzSW5Eb20iLCJyb290UmVjdCIsIl9nZXRSb290UmVjdCIsImZvckVhY2giLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJyb290Q29udGFpbnNUYXJnZXQiLCJfcm9vdENvbnRhaW5zVGFyZ2V0Iiwib2xkRW50cnkiLCJfY29tcHV0ZVRhcmdldEFuZFJvb3RJbnRlcnNlY3Rpb24iLCJuZXdFbnRyeSIsIm5vdyIsIl9oYXNDcm9zc2VkVGhyZXNob2xkIiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImRpc3BsYXkiLCJwYXJlbnQiLCJnZXRQYXJlbnROb2RlIiwiYXRSb290IiwicGFyZW50UmVjdCIsInBhcmVudENvbXB1dGVkU3R5bGUiLCJib2R5IiwiZG9jdW1lbnRFbGVtZW50Iiwib3ZlcmZsb3ciLCJjb21wdXRlUmVjdEludGVyc2VjdGlvbiIsImh0bWwiLCJ0b3AiLCJsZWZ0IiwicmlnaHQiLCJjbGllbnRXaWR0aCIsImJvdHRvbSIsImNsaWVudEhlaWdodCIsIl9leHBhbmRSZWN0QnlSb290TWFyZ2luIiwicmVjdCIsIm5ld1JlY3QiLCJvbGRSYXRpbyIsIm5ld1JhdGlvIiwiY29udGFpbnNEZWVwIiwiaW5kZXhPZiIsImluZGV4Iiwic3BsaWNlIiwicGVyZm9ybWFuY2UiLCJmbiIsInRpbWVvdXQiLCJ0aW1lciIsInNldFRpbWVvdXQiLCJub2RlIiwiZXZlbnQiLCJvcHRfdXNlQ2FwdHVyZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJhdHRhY2hFdmVudCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJkZXRhdGNoRXZlbnQiLCJyZWN0MSIsInJlY3QyIiwiTWF0aCIsIm1heCIsIm1pbiIsImVsIiwiZXJyIiwiY2hpbGQiLCJwYXJlbnROb2RlIiwiaG9zdCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7O0FBU0MsV0FBU0EsTUFBVCxFQUFpQkMsUUFBakIsRUFBMkI7QUFDNUI7O0FBR0E7QUFDQTs7QUFDQSxNQUFJLDBCQUEwQkQsTUFBMUIsSUFDQSwrQkFBK0JBLE1BRC9CLElBRUEsdUJBQXVCQSxPQUFPRSx5QkFBUCxDQUFpQ0MsU0FGNUQsRUFFdUU7O0FBRXJFO0FBQ0E7QUFDQSxRQUFJLEVBQUUsb0JBQW9CSCxPQUFPRSx5QkFBUCxDQUFpQ0MsU0FBdkQsQ0FBSixFQUF1RTtBQUNyRUMsYUFBT0MsY0FBUCxDQUFzQkwsT0FBT0UseUJBQVAsQ0FBaUNDLFNBQXZELEVBQ0UsZ0JBREYsRUFDb0I7QUFDbEJHLGFBQUssZUFBWTtBQUNmLGlCQUFPLEtBQUtDLGlCQUFMLEdBQXlCLENBQWhDO0FBQ0Q7QUFIaUIsT0FEcEI7QUFNRDtBQUNEO0FBQ0Q7O0FBR0Q7Ozs7OztBQU1BLE1BQUlDLFdBQVcsRUFBZjs7QUFHQTs7Ozs7O0FBTUEsV0FBU04seUJBQVQsQ0FBbUNPLEtBQW5DLEVBQTBDO0FBQ3hDLFNBQUtDLElBQUwsR0FBWUQsTUFBTUMsSUFBbEI7QUFDQSxTQUFLQyxNQUFMLEdBQWNGLE1BQU1FLE1BQXBCO0FBQ0EsU0FBS0MsVUFBTCxHQUFrQkgsTUFBTUcsVUFBeEI7QUFDQSxTQUFLQyxrQkFBTCxHQUEwQkosTUFBTUksa0JBQWhDO0FBQ0EsU0FBS0Ms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Q0FBRCIsImZpbGUiOiJsaWJzL3BvbHlmaWxscy9pbnRlcnNlY3Rpb24tb2JzZXJ2ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIFczQyBTT0ZUV0FSRSBBTkQgRE9DVU1FTlQgTk9USUNFIEFORCBMSUNFTlNFLlxyXG4gKlxyXG4gKiAgaHR0cHM6Ly93d3cudzMub3JnL0NvbnNvcnRpdW0vTGVnYWwvMjAxNS9jb3B5cmlnaHQtc29mdHdhcmUtYW5kLWRvY3VtZW50XHJcbiAqXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKHdpbmRvdywgZG9jdW1lbnQpIHtcclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuXHJcbi8vIEV4aXRzIGVhcmx5IGlmIGFsbCBJbnRlcnNlY3Rpb25PYnNlcnZlciBhbmQgSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeVxyXG4vLyBmZWF0dXJlcyBhcmUgbmF0aXZlbHkgc3VwcG9ydGVkLlxyXG5pZiAoJ0ludGVyc2VjdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cgJiZcclxuICAgICdJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5JyBpbiB3aW5kb3cgJiZcclxuICAgICdpbnRlcnNlY3Rpb25SYXRpbycgaW4gd2luZG93LkludGVyc2VjdGlvbk9ic2VydmVyRW50cnkucHJvdG90eXBlKSB7XHJcblxyXG4gIC8vIE1pbmltYWwgcG9seWZpbGwgZm9yIEVkZ2UgMTUncyBsYWNrIG9mIGBpc0ludGVyc2VjdGluZ2BcclxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS93M2MvSW50ZXJzZWN0aW9uT2JzZXJ2ZXIvaXNzdWVzLzIxMVxyXG4gIGlmICghKCdpc0ludGVyc2VjdGluZycgaW4gd2luZG93LkludGVyc2VjdGlvbk9ic2VydmVyRW50cnkucHJvdG90eXBlKSkge1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHdpbmRvdy5JbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5LnByb3RvdHlwZSxcclxuICAgICAgJ2lzSW50ZXJzZWN0aW5nJywge1xyXG4gICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbnRlcnNlY3Rpb25SYXRpbyA+IDA7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm47XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQW4gSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgcmVnaXN0cnkuIFRoaXMgcmVnaXN0cnkgZXhpc3RzIHRvIGhvbGQgYSBzdHJvbmdcclxuICogcmVmZXJlbmNlIHRvIEludGVyc2VjdGlvbk9ic2VydmVyIGluc3RhbmNlcyBjdXJyZW50bHkgb2JzZXJ2ZXJpbmcgYSB0YXJnZXRcclxuICogZWxlbWVudC4gV2l0aG91dCB0aGlzIHJlZ2lzdHJ5LCBpbnN0YW5jZXMgd2l0aG91dCBhbm90aGVyIHJlZmVyZW5jZSBtYXkgYmVcclxuICogZ2FyYmFnZSBjb2xsZWN0ZWQuXHJcbiAqL1xyXG52YXIgcmVnaXN0cnkgPSBbXTtcclxuXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyB0aGUgZ2xvYmFsIEludGVyc2VjdGlvbk9ic2VydmVyRW50cnkgY29uc3RydWN0b3IuXHJcbiAqIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9JbnRlcnNlY3Rpb25PYnNlcnZlci8jaW50ZXJzZWN0aW9uLW9ic2VydmVyLWVudHJ5XHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbnRyeSBBIGRpY3Rpb25hcnkgb2YgaW5zdGFuY2UgcHJvcGVydGllcy5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5KGVudHJ5KSB7XHJcbiAgdGhpcy50aW1lID0gZW50cnkudGltZTtcclxuICB0aGlzLnRhcmdldCA9IGVudHJ5LnRhcmdldDtcclxuICB0aGlzLnJvb3RCb3VuZHMgPSBlbnRyeS5yb290Qm91bmRzO1xyXG4gIHRoaXMuYm91bmRpbmdDbGllbnRSZWN0ID0gZW50cnkuYm91bmRpbmdDbGllbnRSZWN0O1xyXG4gIHRoaXMuaW50ZXJzZWN0aW9uUmVjdCA9IGVudHJ5LmludGVyc2VjdGlvblJlY3QgfHwgZ2V0RW1wdHlSZWN0KCk7XHJcbiAgdGhpcy5pc0ludGVyc2VjdGluZyA9ICEhZW50cnkuaW50ZXJzZWN0aW9uUmVjdDtcclxuXHJcbiAgLy8gQ2FsY3VsYXRlcyB0aGUgaW50ZXJzZWN0aW9uIHJhdGlvLlxyXG4gIHZhciB0YXJnZXRSZWN0ID0gdGhpcy5ib3VuZGluZ0NsaWVudFJlY3Q7XHJcbiAgdmFyIHRhcmdldEFyZWEgPSB0YXJnZXRSZWN0LndpZHRoICogdGFyZ2V0UmVjdC5oZWlnaHQ7XHJcbiAgdmFyIGludGVyc2VjdGlvblJlY3QgPSB0aGlzLmludGVyc2VjdGlvblJlY3Q7XHJcbiAgdmFyIGludGVyc2VjdGlvbkFyZWEgPSBpbnRlcnNlY3Rpb25SZWN0LndpZHRoICogaW50ZXJzZWN0aW9uUmVjdC5oZWlnaHQ7XHJcblxyXG4gIC8vIFNldHMgaW50ZXJzZWN0aW9uIHJhdGlvLlxyXG4gIGlmICh0YXJnZXRBcmVhKSB7XHJcbiAgICB0aGlzLmludGVyc2VjdGlvblJhdGlvID0gaW50ZXJzZWN0aW9uQXJlYSAvIHRhcmdldEFyZWE7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIElmIGFyZWEgaXMgemVybyBhbmQgaXMgaW50ZXJzZWN0aW5nLCBzZXRzIHRvIDEsIG90aGVyd2lzZSB0byAwXHJcbiAgICB0aGlzLmludGVyc2VjdGlvblJhdGlvID0gdGhpcy5pc0ludGVyc2VjdGluZyA/IDEgOiAwO1xyXG4gIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIHRoZSBnbG9iYWwgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgY29uc3RydWN0b3IuXHJcbiAqIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9JbnRlcnNlY3Rpb25PYnNlcnZlci8jaW50ZXJzZWN0aW9uLW9ic2VydmVyLWludGVyZmFjZVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCBhZnRlciBpbnRlcnNlY3Rpb25cclxuICogICAgIGNoYW5nZXMgaGF2ZSBxdWV1ZWQuIFRoZSBmdW5jdGlvbiBpcyBub3QgaW52b2tlZCBpZiB0aGUgcXVldWUgaGFzXHJcbiAqICAgICBiZWVuIGVtcHRpZWQgYnkgY2FsbGluZyB0aGUgYHRha2VSZWNvcmRzYCBtZXRob2QuXHJcbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0X29wdGlvbnMgT3B0aW9uYWwgY29uZmlndXJhdGlvbiBvcHRpb25zLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIEludGVyc2VjdGlvbk9ic2VydmVyKGNhbGxiYWNrLCBvcHRfb3B0aW9ucykge1xyXG5cclxuICB2YXIgb3B0aW9ucyA9IG9wdF9vcHRpb25zIHx8IHt9O1xyXG5cclxuICBpZiAodHlwZW9mIGNhbGxiYWNrICE9ICdmdW5jdGlvbicpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XHJcbiAgfVxyXG5cclxuICBpZiAob3B0aW9ucy5yb290ICYmIG9wdGlvbnMucm9vdC5ub2RlVHlwZSAhPSAxKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Jvb3QgbXVzdCBiZSBhbiBFbGVtZW50Jyk7XHJcbiAgfVxyXG5cclxuICAvLyBCaW5kcyBhbmQgdGhyb3R0bGVzIGB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnNgLlxyXG4gIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucyA9IHRocm90dGxlKFxyXG4gICAgICB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMuYmluZCh0aGlzKSwgdGhpcy5USFJPVFRMRV9USU1FT1VUKTtcclxuXHJcbiAgLy8gUHJpdmF0ZSBwcm9wZXJ0aWVzLlxyXG4gIHRoaXMuX2NhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzID0gW107XHJcbiAgdGhpcy5fcXVldWVkRW50cmllcyA9IFtdO1xyXG4gIHRoaXMuX3Jvb3RNYXJnaW5WYWx1ZXMgPSB0aGlzLl9wYXJzZVJvb3RNYXJnaW4ob3B0aW9ucy5yb290TWFyZ2luKTtcclxuXHJcbiAgLy8gUHVibGljIHByb3BlcnRpZXMuXHJcbiAgdGhpcy50aHJlc2hvbGRzID0gdGhpcy5faW5pdFRocmVzaG9sZHMob3B0aW9ucy50aHJlc2hvbGQpO1xyXG4gIHRoaXMucm9vdCA9IG9wdGlvbnMucm9vdCB8fCBudWxsO1xyXG4gIHRoaXMucm9vdE1hcmdpbiA9IHRoaXMuX3Jvb3RNYXJnaW5WYWx1ZXMubWFwKGZ1bmN0aW9uKG1hcmdpbikge1xyXG4gICAgcmV0dXJuIG1hcmdpbi52YWx1ZSArIG1hcmdpbi51bml0O1xyXG4gIH0pLmpvaW4oJyAnKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBUaGUgbWluaW11bSBpbnRlcnZhbCB3aXRoaW4gd2hpY2ggdGhlIGRvY3VtZW50IHdpbGwgYmUgY2hlY2tlZCBmb3JcclxuICogaW50ZXJzZWN0aW9uIGNoYW5nZXMuXHJcbiAqL1xyXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuVEhST1RUTEVfVElNRU9VVCA9IDEwMDtcclxuXHJcblxyXG4vKipcclxuICogVGhlIGZyZXF1ZW5jeSBpbiB3aGljaCB0aGUgcG9seWZpbGwgcG9sbHMgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzLlxyXG4gKiB0aGlzIGNhbiBiZSB1cGRhdGVkIG9uIGEgcGVyIGluc3RhbmNlIGJhc2lzIGFuZCBtdXN0IGJlIHNldCBwcmlvciB0b1xyXG4gKiBjYWxsaW5nIGBvYnNlcnZlYCBvbiB0aGUgZmlyc3QgdGFyZ2V0LlxyXG4gKi9cclxuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLlBPTExfSU5URVJWQUwgPSBudWxsO1xyXG5cclxuLyoqXHJcbiAqIFVzZSBhIG11dGF0aW9uIG9ic2VydmVyIG9uIHRoZSByb290IGVsZW1lbnRcclxuICogdG8gZGV0ZWN0IGludGVyc2VjdGlvbiBjaGFuZ2VzLlxyXG4gKi9cclxuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLlVTRV9NVVRBVElPTl9PQlNFUlZFUiA9IHRydWU7XHJcblxyXG5cclxuLyoqXHJcbiAqIFN0YXJ0cyBvYnNlcnZpbmcgYSB0YXJnZXQgZWxlbWVudCBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMgYmFzZWQgb25cclxuICogdGhlIHRocmVzaG9sZHMgdmFsdWVzLlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCBUaGUgRE9NIGVsZW1lbnQgdG8gb2JzZXJ2ZS5cclxuICovXHJcbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5vYnNlcnZlID0gZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgdmFyIGlzVGFyZ2V0QWxyZWFkeU9ic2VydmVkID0gdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzLnNvbWUoZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgcmV0dXJuIGl0ZW0uZWxlbWVudCA9PSB0YXJnZXQ7XHJcbiAgfSk7XHJcblxyXG4gIGlmIChpc1RhcmdldEFscmVhZHlPYnNlcnZlZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKCEodGFyZ2V0ICYmIHRhcmdldC5ub2RlVHlwZSA9PSAxKSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCd0YXJnZXQgbXVzdCBiZSBhbiBFbGVtZW50Jyk7XHJcbiAgfVxyXG5cclxuICB0aGlzLl9yZWdpc3Rlckluc3RhbmNlKCk7XHJcbiAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzLnB1c2goe2VsZW1lbnQ6IHRhcmdldCwgZW50cnk6IG51bGx9KTtcclxuICB0aGlzLl9tb25pdG9ySW50ZXJzZWN0aW9ucygpO1xyXG4gIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucygpO1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBTdG9wcyBvYnNlcnZpbmcgYSB0YXJnZXQgZWxlbWVudCBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMuXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IFRoZSBET00gZWxlbWVudCB0byBvYnNlcnZlLlxyXG4gKi9cclxuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLnVub2JzZXJ2ZSA9IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gIHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cyA9XHJcbiAgICAgIHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cy5maWx0ZXIoZnVuY3Rpb24oaXRlbSkge1xyXG5cclxuICAgIHJldHVybiBpdGVtLmVsZW1lbnQgIT0gdGFyZ2V0O1xyXG4gIH0pO1xyXG4gIGlmICghdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzLmxlbmd0aCkge1xyXG4gICAgdGhpcy5fdW5tb25pdG9ySW50ZXJzZWN0aW9ucygpO1xyXG4gICAgdGhpcy5fdW5yZWdpc3Rlckluc3RhbmNlKCk7XHJcbiAgfVxyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBTdG9wcyBvYnNlcnZpbmcgYWxsIHRhcmdldCBlbGVtZW50cyBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMuXHJcbiAqL1xyXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cyA9IFtdO1xyXG4gIHRoaXMuX3VubW9uaXRvckludGVyc2VjdGlvbnMoKTtcclxuICB0aGlzLl91bnJlZ2lzdGVySW5zdGFuY2UoKTtcclxufTtcclxuXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhbnkgcXVldWUgZW50cmllcyB0aGF0IGhhdmUgbm90IHlldCBiZWVuIHJlcG9ydGVkIHRvIHRoZVxyXG4gKiBjYWxsYmFjayBhbmQgY2xlYXJzIHRoZSBxdWV1ZS4gVGhpcyBjYW4gYmUgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZVxyXG4gKiBjYWxsYmFjayB0byBvYnRhaW4gdGhlIGFic29sdXRlIG1vc3QgdXAtdG8tZGF0ZSBpbnRlcnNlY3Rpb24gaW5mb3JtYXRpb24uXHJcbiAqIEByZXR1cm4ge0FycmF5fSBUaGUgY3VycmVudGx5IHF1ZXVlZCBlbnRyaWVzLlxyXG4gKi9cclxuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLnRha2VSZWNvcmRzID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHJlY29yZHMgPSB0aGlzLl9xdWV1ZWRFbnRyaWVzLnNsaWNlKCk7XHJcbiAgdGhpcy5fcXVldWVkRW50cmllcyA9IFtdO1xyXG4gIHJldHVybiByZWNvcmRzO1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBBY2NlcHRzIHRoZSB0aHJlc2hvbGQgdmFsdWUgZnJvbSB0aGUgdXNlciBjb25maWd1cmF0aW9uIG9iamVjdCBhbmRcclxuICogcmV0dXJucyBhIHNvcnRlZCBhcnJheSBvZiB1bmlxdWUgdGhyZXNob2xkIHZhbHVlcy4gSWYgYSB2YWx1ZSBpcyBub3RcclxuICogYmV0d2VlbiAwIGFuZCAxIGFuZCBlcnJvciBpcyB0aHJvd24uXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSB7QXJyYXl8bnVtYmVyPX0gb3B0X3RocmVzaG9sZCBBbiBvcHRpb25hbCB0aHJlc2hvbGQgdmFsdWUgb3JcclxuICogICAgIGEgbGlzdCBvZiB0aHJlc2hvbGQgdmFsdWVzLCBkZWZhdWx0aW5nIHRvIFswXS5cclxuICogQHJldHVybiB7QXJyYXl9IEEgc29ydGVkIGxpc3Qgb2YgdW5pcXVlIGFuZCB2YWxpZCB0aHJlc2hvbGQgdmFsdWVzLlxyXG4gKi9cclxuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9pbml0VGhyZXNob2xkcyA9IGZ1bmN0aW9uKG9wdF90aHJlc2hvbGQpIHtcclxuICB2YXIgdGhyZXNob2xkID0gb3B0X3RocmVzaG9sZCB8fCBbMF07XHJcbiAgaWYgKCFBcnJheS5pc0FycmF5KHRocmVzaG9sZCkpIHRocmVzaG9sZCA9IFt0aHJlc2hvbGRdO1xyXG5cclxuICByZXR1cm4gdGhyZXNob2xkLnNvcnQoKS5maWx0ZXIoZnVuY3Rpb24odCwgaSwgYSkge1xyXG4gICAgaWYgKHR5cGVvZiB0ICE9ICdudW1iZXInIHx8IGlzTmFOKHQpIHx8IHQgPCAwIHx8IHQgPiAxKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcigndGhyZXNob2xkIG11c3QgYmUgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxIGluY2x1c2l2ZWx5Jyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdCAhPT0gYVtpIC0gMV07XHJcbiAgfSk7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIEFjY2VwdHMgdGhlIHJvb3RNYXJnaW4gdmFsdWUgZnJvbSB0aGUgdXNlciBjb25maWd1cmF0aW9uIG9iamVjdFxyXG4gKiBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiB0aGUgZm91ciBtYXJnaW4gdmFsdWVzIGFzIGFuIG9iamVjdCBjb250YWluaW5nXHJcbiAqIHRoZSB2YWx1ZSBhbmQgdW5pdCBwcm9wZXJ0aWVzLiBJZiBhbnkgb2YgdGhlIHZhbHVlcyBhcmUgbm90IHByb3Blcmx5XHJcbiAqIGZvcm1hdHRlZCBvciB1c2UgYSB1bml0IG90aGVyIHRoYW4gcHggb3IgJSwgYW5kIGVycm9yIGlzIHRocm93bi5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtIHtzdHJpbmc9fSBvcHRfcm9vdE1hcmdpbiBBbiBvcHRpb25hbCByb290TWFyZ2luIHZhbHVlLFxyXG4gKiAgICAgZGVmYXVsdGluZyB0byAnMHB4Jy5cclxuICogQHJldHVybiB7QXJyYXk8T2JqZWN0Pn0gQW4gYXJyYXkgb2YgbWFyZ2luIG9iamVjdHMgd2l0aCB0aGUga2V5c1xyXG4gKiAgICAgdmFsdWUgYW5kIHVuaXQuXHJcbiAqL1xyXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX3BhcnNlUm9vdE1hcmdpbiA9IGZ1bmN0aW9uKG9wdF9yb290TWFyZ2luKSB7XHJcbiAgdmFyIG1hcmdpblN0cmluZyA9IG9wdF9yb290TWFyZ2luIHx8ICcwcHgnO1xyXG4gIHZhciBtYXJnaW5zID0gbWFyZ2luU3RyaW5nLnNwbGl0KC9cXHMrLykubWFwKGZ1bmN0aW9uKG1hcmdpbikge1xyXG4gICAgdmFyIHBhcnRzID0gL14oLT9cXGQqXFwuP1xcZCspKHB4fCUpJC8uZXhlYyhtYXJnaW4pO1xyXG4gICAgaWYgKCFwYXJ0cykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Jvb3RNYXJnaW4gbXVzdCBiZSBzcGVjaWZpZWQgaW4gcGl4ZWxzIG9yIHBlcmNlbnQnKTtcclxuICAgIH1cclxuICAgIHJldHVybiB7dmFsdWU6IHBhcnNlRmxvYXQocGFydHNbMV0pLCB1bml0OiBwYXJ0c1syXX07XHJcbiAgfSk7XHJcblxyXG4gIC8vIEhhbmRsZXMgc2hvcnRoYW5kLlxyXG4gIG1hcmdpbnNbMV0gPSBtYXJnaW5zWzFdIHx8IG1hcmdpbnNbMF07XHJcbiAgbWFyZ2luc1syXSA9IG1hcmdpbnNbMl0gfHwgbWFyZ2luc1swXTtcclxuICBtYXJnaW5zWzNdID0gbWFyZ2luc1szXSB8fCBtYXJnaW5zWzFdO1xyXG5cclxuICByZXR1cm4gbWFyZ2lucztcclxufTtcclxuXHJcblxyXG4vKipcclxuICogU3RhcnRzIHBvbGxpbmcgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzIGlmIHRoZSBwb2xsaW5nIGlzIG5vdCBhbHJlYWR5XHJcbiAqIGhhcHBlbmluZywgYW5kIGlmIHRoZSBwYWdlJ3MgdmlzaWJpbHR5IHN0YXRlIGlzIHZpc2libGUuXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX21vbml0b3JJbnRlcnNlY3Rpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKCF0aGlzLl9tb25pdG9yaW5nSW50ZXJzZWN0aW9ucykge1xyXG4gICAgdGhpcy5fbW9uaXRvcmluZ0ludGVyc2VjdGlvbnMgPSB0cnVlO1xyXG5cclxuICAgIC8vIElmIGEgcG9sbCBpbnRlcnZhbCBpcyBzZXQsIHVzZSBwb2xsaW5nIGluc3RlYWQgb2YgbGlzdGVuaW5nIHRvXHJcbiAgICAvLyByZXNpemUgYW5kIHNjcm9sbCBldmVudHMgb3IgRE9NIG11dGF0aW9ucy5cclxuICAgIGlmICh0aGlzLlBPTExfSU5URVJWQUwpIHtcclxuICAgICAgdGhpcy5fbW9uaXRvcmluZ0ludGVydmFsID0gc2V0SW50ZXJ2YWwoXHJcbiAgICAgICAgICB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMsIHRoaXMuUE9MTF9JTlRFUlZBTCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYWRkRXZlbnQod2luZG93LCAncmVzaXplJywgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zLCB0cnVlKTtcclxuICAgICAgYWRkRXZlbnQoZG9jdW1lbnQsICdzY3JvbGwnLCB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMsIHRydWUpO1xyXG5cclxuICAgICAgaWYgKHRoaXMuVVNFX01VVEFUSU9OX09CU0VSVkVSICYmICdNdXRhdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cpIHtcclxuICAgICAgICB0aGlzLl9kb21PYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucyk7XHJcbiAgICAgICAgdGhpcy5fZG9tT2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudCwge1xyXG4gICAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcclxuICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcclxuICAgICAgICAgIGNoYXJhY3RlckRhdGE6IHRydWUsXHJcbiAgICAgICAgICBzdWJ0cmVlOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIFN0b3BzIHBvbGxpbmcgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl91bm1vbml0b3JJbnRlcnNlY3Rpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKHRoaXMuX21vbml0b3JpbmdJbnRlcnNlY3Rpb25zKSB7XHJcbiAgICB0aGlzLl9tb25pdG9yaW5nSW50ZXJzZWN0aW9ucyA9IGZhbHNlO1xyXG5cclxuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fbW9uaXRvcmluZ0ludGVydmFsKTtcclxuICAgIHRoaXMuX21vbml0b3JpbmdJbnRlcnZhbCA9IG51bGw7XHJcblxyXG4gICAgcmVtb3ZlRXZlbnQod2luZG93LCAncmVzaXplJywgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zLCB0cnVlKTtcclxuICAgIHJlbW92ZUV2ZW50KGRvY3VtZW50LCAnc2Nyb2xsJywgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zLCB0cnVlKTtcclxuXHJcbiAgICBpZiAodGhpcy5fZG9tT2JzZXJ2ZXIpIHtcclxuICAgICAgdGhpcy5fZG9tT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xyXG4gICAgICB0aGlzLl9kb21PYnNlcnZlciA9IG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBTY2FucyBlYWNoIG9ic2VydmF0aW9uIHRhcmdldCBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMgYW5kIGFkZHMgdGhlbVxyXG4gKiB0byB0aGUgaW50ZXJuYWwgZW50cmllcyBxdWV1ZS4gSWYgbmV3IGVudHJpZXMgYXJlIGZvdW5kLCBpdFxyXG4gKiBzY2hlZHVsZXMgdGhlIGNhbGxiYWNrIHRvIGJlIGludm9rZWQuXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciByb290SXNJbkRvbSA9IHRoaXMuX3Jvb3RJc0luRG9tKCk7XHJcbiAgdmFyIHJvb3RSZWN0ID0gcm9vdElzSW5Eb20gPyB0aGlzLl9nZXRSb290UmVjdCgpIDogZ2V0RW1wdHlSZWN0KCk7XHJcblxyXG4gIHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgIHZhciB0YXJnZXQgPSBpdGVtLmVsZW1lbnQ7XHJcbiAgICB2YXIgdGFyZ2V0UmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdCh0YXJnZXQpO1xyXG4gICAgdmFyIHJvb3RDb250YWluc1RhcmdldCA9IHRoaXMuX3Jvb3RDb250YWluc1RhcmdldCh0YXJnZXQpO1xyXG4gICAgdmFyIG9sZEVudHJ5ID0gaXRlbS5lbnRyeTtcclxuICAgIHZhciBpbnRlcnNlY3Rpb25SZWN0ID0gcm9vdElzSW5Eb20gJiYgcm9vdENvbnRhaW5zVGFyZ2V0ICYmXHJcbiAgICAgICAgdGhpcy5fY29tcHV0ZVRhcmdldEFuZFJvb3RJbnRlcnNlY3Rpb24odGFyZ2V0LCByb290UmVjdCk7XHJcblxyXG4gICAgdmFyIG5ld0VudHJ5ID0gaXRlbS5lbnRyeSA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5KHtcclxuICAgICAgdGltZTogbm93KCksXHJcbiAgICAgIHRhcmdldDogdGFyZ2V0LFxyXG4gICAgICBib3VuZGluZ0NsaWVudFJlY3Q6IHRhcmdldFJlY3QsXHJcbiAgICAgIHJvb3RCb3VuZHM6IHJvb3RSZWN0LFxyXG4gICAgICBpbnRlcnNlY3Rpb25SZWN0OiBpbnRlcnNlY3Rpb25SZWN0XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoIW9sZEVudHJ5KSB7XHJcbiAgICAgIHRoaXMuX3F1ZXVlZEVudHJpZXMucHVzaChuZXdFbnRyeSk7XHJcbiAgICB9IGVsc2UgaWYgKHJvb3RJc0luRG9tICYmIHJvb3RDb250YWluc1RhcmdldCkge1xyXG4gICAgICAvLyBJZiB0aGUgbmV3IGVudHJ5IGludGVyc2VjdGlvbiByYXRpbyBoYXMgY3Jvc3NlZCBhbnkgb2YgdGhlXHJcbiAgICAgIC8vIHRocmVzaG9sZHMsIGFkZCBhIG5ldyBlbnRyeS5cclxuICAgICAgaWYgKHRoaXMuX2hhc0Nyb3NzZWRUaHJlc2hvbGQob2xkRW50cnksIG5ld0VudHJ5KSkge1xyXG4gICAgICAgIHRoaXMuX3F1ZXVlZEVudHJpZXMucHVzaChuZXdFbnRyeSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIElmIHRoZSByb290IGlzIG5vdCBpbiB0aGUgRE9NIG9yIHRhcmdldCBpcyBub3QgY29udGFpbmVkIHdpdGhpblxyXG4gICAgICAvLyByb290IGJ1dCB0aGUgcHJldmlvdXMgZW50cnkgZm9yIHRoaXMgdGFyZ2V0IGhhZCBhbiBpbnRlcnNlY3Rpb24sXHJcbiAgICAgIC8vIGFkZCBhIG5ldyByZWNvcmQgaW5kaWNhdGluZyByZW1vdmFsLlxyXG4gICAgICBpZiAob2xkRW50cnkgJiYgb2xkRW50cnkuaXNJbnRlcnNlY3RpbmcpIHtcclxuICAgICAgICB0aGlzLl9xdWV1ZWRFbnRyaWVzLnB1c2gobmV3RW50cnkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcblxyXG4gIGlmICh0aGlzLl9xdWV1ZWRFbnRyaWVzLmxlbmd0aCkge1xyXG4gICAgdGhpcy5fY2FsbGJhY2sodGhpcy50YWtlUmVjb3JkcygpLCB0aGlzKTtcclxuICB9XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIEFjY2VwdHMgYSB0YXJnZXQgYW5kIHJvb3QgcmVjdCBjb21wdXRlcyB0aGUgaW50ZXJzZWN0aW9uIGJldHdlZW4gdGhlblxyXG4gKiBmb2xsb3dpbmcgdGhlIGFsZ29yaXRobSBpbiB0aGUgc3BlYy5cclxuICogVE9ETyhwaGlsaXB3YWx0b24pOiBhdCB0aGlzIHRpbWUgY2xpcC1wYXRoIGlzIG5vdCBjb25zaWRlcmVkLlxyXG4gKiBodHRwczovL3czYy5naXRodWIuaW8vSW50ZXJzZWN0aW9uT2JzZXJ2ZXIvI2NhbGN1bGF0ZS1pbnRlcnNlY3Rpb24tcmVjdC1hbGdvXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IFRoZSB0YXJnZXQgRE9NIGVsZW1lbnRcclxuICogQHBhcmFtIHtPYmplY3R9IHJvb3RSZWN0IFRoZSBib3VuZGluZyByZWN0IG9mIHRoZSByb290IGFmdGVyIGJlaW5nXHJcbiAqICAgICBleHBhbmRlZCBieSB0aGUgcm9vdE1hcmdpbiB2YWx1ZS5cclxuICogQHJldHVybiB7P09iamVjdH0gVGhlIGZpbmFsIGludGVyc2VjdGlvbiByZWN0IG9iamVjdCBvciB1bmRlZmluZWQgaWYgbm9cclxuICogICAgIGludGVyc2VjdGlvbiBpcyBmb3VuZC5cclxuICogQHByaXZhdGVcclxuICovXHJcbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fY29tcHV0ZVRhcmdldEFuZFJvb3RJbnRlcnNlY3Rpb24gPVxyXG4gICAgZnVuY3Rpb24odGFyZ2V0LCByb290UmVjdCkge1xyXG5cclxuICAvLyBJZiB0aGUgZWxlbWVudCBpc24ndCBkaXNwbGF5ZWQsIGFuIGludGVyc2VjdGlvbiBjYW4ndCBoYXBwZW4uXHJcbiAgaWYgKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRhcmdldCkuZGlzcGxheSA9PSAnbm9uZScpIHJldHVybjtcclxuXHJcbiAgdmFyIHRhcmdldFJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3QodGFyZ2V0KTtcclxuICB2YXIgaW50ZXJzZWN0aW9uUmVjdCA9IHRhcmdldFJlY3Q7XHJcbiAgdmFyIHBhcmVudCA9IGdldFBhcmVudE5vZGUodGFyZ2V0KTtcclxuICB2YXIgYXRSb290ID0gZmFsc2U7XHJcblxyXG4gIHdoaWxlICghYXRSb290KSB7XHJcbiAgICB2YXIgcGFyZW50UmVjdCA9IG51bGw7XHJcbiAgICB2YXIgcGFyZW50Q29tcHV0ZWRTdHlsZSA9IHBhcmVudC5ub2RlVHlwZSA9PSAxID9cclxuICAgICAgICB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShwYXJlbnQpIDoge307XHJcblxyXG4gICAgLy8gSWYgdGhlIHBhcmVudCBpc24ndCBkaXNwbGF5ZWQsIGFuIGludGVyc2VjdGlvbiBjYW4ndCBoYXBwZW4uXHJcbiAgICBpZiAocGFyZW50Q29tcHV0ZWRTdHlsZS5kaXNwbGF5ID09ICdub25lJykgcmV0dXJuO1xyXG5cclxuICAgIGlmIChwYXJlbnQgPT0gdGhpcy5yb290IHx8IHBhcmVudCA9PSBkb2N1bWVudCkge1xyXG4gICAgICBhdFJvb3QgPSB0cnVlO1xyXG4gICAgICBwYXJlbnRSZWN0ID0gcm9vdFJlY3Q7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBJZiB0aGUgZWxlbWVudCBoYXMgYSBub24tdmlzaWJsZSBvdmVyZmxvdywgYW5kIGl0J3Mgbm90IHRoZSA8Ym9keT5cclxuICAgICAgLy8gb3IgPGh0bWw+IGVsZW1lbnQsIHVwZGF0ZSB0aGUgaW50ZXJzZWN0aW9uIHJlY3QuXHJcbiAgICAgIC8vIE5vdGU6IDxib2R5PiBhbmQgPGh0bWw+IGNhbm5vdCBiZSBjbGlwcGVkIHRvIGEgcmVjdCB0aGF0J3Mgbm90IGFsc29cclxuICAgICAgLy8gdGhlIGRvY3VtZW50IHJlY3QsIHNvIG5vIG5lZWQgdG8gY29tcHV0ZSBhIG5ldyBpbnRlcnNlY3Rpb24uXHJcbiAgICAgIGlmIChwYXJlbnQgIT0gZG9jdW1lbnQuYm9keSAmJlxyXG4gICAgICAgICAgcGFyZW50ICE9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJlxyXG4gICAgICAgICAgcGFyZW50Q29tcHV0ZWRTdHlsZS5vdmVyZmxvdyAhPSAndmlzaWJsZScpIHtcclxuICAgICAgICBwYXJlbnRSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHBhcmVudCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiBlaXRoZXIgb2YgdGhlIGFib3ZlIGNvbmRpdGlvbmFscyBzZXQgYSBuZXcgcGFyZW50UmVjdCxcclxuICAgIC8vIGNhbGN1bGF0ZSBuZXcgaW50ZXJzZWN0aW9uIGRhdGEuXHJcbiAgICBpZiAocGFyZW50UmVjdCkge1xyXG4gICAgICBpbnRlcnNlY3Rpb25SZWN0ID0gY29tcHV0ZVJlY3RJbnRlcnNlY3Rpb24ocGFyZW50UmVjdCwgaW50ZXJzZWN0aW9uUmVjdCk7XHJcblxyXG4gICAgICBpZiAoIWludGVyc2VjdGlvblJlY3QpIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgcGFyZW50ID0gZ2V0UGFyZW50Tm9kZShwYXJlbnQpO1xyXG4gIH1cclxuICByZXR1cm4gaW50ZXJzZWN0aW9uUmVjdDtcclxufTtcclxuXHJcblxyXG4vKipcclxuICogUmV0dXJucyB0aGUgcm9vdCByZWN0IGFmdGVyIGJlaW5nIGV4cGFuZGVkIGJ5IHRoZSByb290TWFyZ2luIHZhbHVlLlxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBleHBhbmRlZCByb290IHJlY3QuXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX2dldFJvb3RSZWN0ID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHJvb3RSZWN0O1xyXG4gIGlmICh0aGlzLnJvb3QpIHtcclxuICAgIHJvb3RSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRoaXMucm9vdCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIFVzZSA8aHRtbD4vPGJvZHk+IGluc3RlYWQgb2Ygd2luZG93IHNpbmNlIHNjcm9sbCBiYXJzIGFmZmVjdCBzaXplLlxyXG4gICAgdmFyIGh0bWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XHJcbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmJvZHk7XHJcbiAgICByb290UmVjdCA9IHtcclxuICAgICAgdG9wOiAwLFxyXG4gICAgICBsZWZ0OiAwLFxyXG4gICAgICByaWdodDogaHRtbC5jbGllbnRXaWR0aCB8fCBib2R5LmNsaWVudFdpZHRoLFxyXG4gICAgICB3aWR0aDogaHRtbC5jbGllbnRXaWR0aCB8fCBib2R5LmNsaWVudFdpZHRoLFxyXG4gICAgICBib3R0b206IGh0bWwuY2xpZW50SGVpZ2h0IHx8IGJvZHkuY2xpZW50SGVpZ2h0LFxyXG4gICAgICBoZWlnaHQ6IGh0bWwuY2xpZW50SGVpZ2h0IHx8IGJvZHkuY2xpZW50SGVpZ2h0XHJcbiAgICB9O1xyXG4gIH1cclxuICByZXR1cm4gdGhpcy5fZXhwYW5kUmVjdEJ5Um9vdE1hcmdpbihyb290UmVjdCk7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIEFjY2VwdHMgYSByZWN0IGFuZCBleHBhbmRzIGl0IGJ5IHRoZSByb290TWFyZ2luIHZhbHVlLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcmVjdCBUaGUgcmVjdCBvYmplY3QgdG8gZXhwYW5kLlxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBleHBhbmRlZCByZWN0LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9leHBhbmRSZWN0QnlSb290TWFyZ2luID0gZnVuY3Rpb24ocmVjdCkge1xyXG4gIHZhciBtYXJnaW5zID0gdGhpcy5fcm9vdE1hcmdpblZhbHVlcy5tYXAoZnVuY3Rpb24obWFyZ2luLCBpKSB7XHJcbiAgICByZXR1cm4gbWFyZ2luLnVuaXQgPT0gJ3B4JyA/IG1hcmdpbi52YWx1ZSA6XHJcbiAgICAgICAgbWFyZ2luLnZhbHVlICogKGkgJSAyID8gcmVjdC53aWR0aCA6IHJlY3QuaGVpZ2h0KSAvIDEwMDtcclxuICB9KTtcclxuICB2YXIgbmV3UmVjdCA9IHtcclxuICAgIHRvcDogcmVjdC50b3AgLSBtYXJnaW5zWzBdLFxyXG4gICAgcmlnaHQ6IHJlY3QucmlnaHQgKyBtYXJnaW5zWzFdLFxyXG4gICAgYm90dG9tOiByZWN0LmJvdHRvbSArIG1hcmdpbnNbMl0sXHJcbiAgICBsZWZ0OiByZWN0LmxlZnQgLSBtYXJnaW5zWzNdXHJcbiAgfTtcclxuICBuZXdSZWN0LndpZHRoID0gbmV3UmVjdC5yaWdodCAtIG5ld1JlY3QubGVmdDtcclxuICBuZXdSZWN0LmhlaWdodCA9IG5ld1JlY3QuYm90dG9tIC0gbmV3UmVjdC50b3A7XHJcblxyXG4gIHJldHVybiBuZXdSZWN0O1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBBY2NlcHRzIGFuIG9sZCBhbmQgbmV3IGVudHJ5IGFuZCByZXR1cm5zIHRydWUgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZVxyXG4gKiB0aHJlc2hvbGQgdmFsdWVzIGhhcyBiZWVuIGNyb3NzZWQuXHJcbiAqIEBwYXJhbSB7P0ludGVyc2VjdGlvbk9ic2VydmVyRW50cnl9IG9sZEVudHJ5IFRoZSBwcmV2aW91cyBlbnRyeSBmb3IgYVxyXG4gKiAgICBwYXJ0aWN1bGFyIHRhcmdldCBlbGVtZW50IG9yIG51bGwgaWYgbm8gcHJldmlvdXMgZW50cnkgZXhpc3RzLlxyXG4gKiBAcGFyYW0ge0ludGVyc2VjdGlvbk9ic2VydmVyRW50cnl9IG5ld0VudHJ5IFRoZSBjdXJyZW50IGVudHJ5IGZvciBhXHJcbiAqICAgIHBhcnRpY3VsYXIgdGFyZ2V0IGVsZW1lbnQuXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiBhIGFueSB0aHJlc2hvbGQgaGFzIGJlZW4gY3Jvc3NlZC5cclxuICogQHByaXZhdGVcclxuICovXHJcbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5faGFzQ3Jvc3NlZFRocmVzaG9sZCA9XHJcbiAgICBmdW5jdGlvbihvbGRFbnRyeSwgbmV3RW50cnkpIHtcclxuXHJcbiAgLy8gVG8gbWFrZSBjb21wYXJpbmcgZWFzaWVyLCBhbiBlbnRyeSB0aGF0IGhhcyBhIHJhdGlvIG9mIDBcclxuICAvLyBidXQgZG9lcyBub3QgYWN0dWFsbHkgaW50ZXJzZWN0IGlzIGdpdmVuIGEgdmFsdWUgb2YgLTFcclxuICB2YXIgb2xkUmF0aW8gPSBvbGRFbnRyeSAmJiBvbGRFbnRyeS5pc0ludGVyc2VjdGluZyA/XHJcbiAgICAgIG9sZEVudHJ5LmludGVyc2VjdGlvblJhdGlvIHx8IDAgOiAtMTtcclxuICB2YXIgbmV3UmF0aW8gPSBuZXdFbnRyeS5pc0ludGVyc2VjdGluZyA/XHJcbiAgICAgIG5ld0VudHJ5LmludGVyc2VjdGlvblJhdGlvIHx8IDAgOiAtMTtcclxuXHJcbiAgLy8gSWdub3JlIHVuY2hhbmdlZCByYXRpb3NcclxuICBpZiAob2xkUmF0aW8gPT09IG5ld1JhdGlvKSByZXR1cm47XHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50aHJlc2hvbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICB2YXIgdGhyZXNob2xkID0gdGhpcy50aHJlc2hvbGRzW2ldO1xyXG5cclxuICAgIC8vIFJldHVybiB0cnVlIGlmIGFuIGVudHJ5IG1hdGNoZXMgYSB0aHJlc2hvbGQgb3IgaWYgdGhlIG5ldyByYXRpb1xyXG4gICAgLy8gYW5kIHRoZSBvbGQgcmF0aW8gYXJlIG9uIHRoZSBvcHBvc2l0ZSBzaWRlcyBvZiBhIHRocmVzaG9sZC5cclxuICAgIGlmICh0aHJlc2hvbGQgPT0gb2xkUmF0aW8gfHwgdGhyZXNob2xkID09IG5ld1JhdGlvIHx8XHJcbiAgICAgICAgdGhyZXNob2xkIDwgb2xkUmF0aW8gIT09IHRocmVzaG9sZCA8IG5ld1JhdGlvKSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcblxyXG4vKipcclxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgcm9vdCBlbGVtZW50IGlzIGFuIGVsZW1lbnQgYW5kIGlzIGluIHRoZSBET00uXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHJvb3QgZWxlbWVudCBpcyBhbiBlbGVtZW50IGFuZCBpcyBpbiB0aGUgRE9NLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9yb290SXNJbkRvbSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiAhdGhpcy5yb290IHx8IGNvbnRhaW5zRGVlcChkb2N1bWVudCwgdGhpcy5yb290KTtcclxufTtcclxuXHJcblxyXG4vKipcclxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgYSBjaGlsZCBvZiByb290LlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCBUaGUgdGFyZ2V0IGVsZW1lbnQgdG8gY2hlY2suXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGEgY2hpbGQgb2Ygcm9vdC5cclxuICogQHByaXZhdGVcclxuICovXHJcbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fcm9vdENvbnRhaW5zVGFyZ2V0ID0gZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgcmV0dXJuIGNvbnRhaW5zRGVlcCh0aGlzLnJvb3QgfHwgZG9jdW1lbnQsIHRhcmdldCk7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIEFkZHMgdGhlIGluc3RhbmNlIHRvIHRoZSBnbG9iYWwgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgcmVnaXN0cnkgaWYgaXQgaXNuJ3RcclxuICogYWxyZWFkeSBwcmVzZW50LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9yZWdpc3Rlckluc3RhbmNlID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKHJlZ2lzdHJ5LmluZGV4T2YodGhpcykgPCAwKSB7XHJcbiAgICByZWdpc3RyeS5wdXNoKHRoaXMpO1xyXG4gIH1cclxufTtcclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlcyB0aGUgaW5zdGFuY2UgZnJvbSB0aGUgZ2xvYmFsIEludGVyc2VjdGlvbk9ic2VydmVyIHJlZ2lzdHJ5LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl91bnJlZ2lzdGVySW5zdGFuY2UgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgaW5kZXggPSByZWdpc3RyeS5pbmRleE9mKHRoaXMpO1xyXG4gIGlmIChpbmRleCAhPSAtMSkgcmVnaXN0cnkuc3BsaWNlKGluZGV4LCAxKTtcclxufTtcclxuXHJcblxyXG4vKipcclxuICogUmV0dXJucyB0aGUgcmVzdWx0IG9mIHRoZSBwZXJmb3JtYW5jZS5ub3coKSBtZXRob2Qgb3IgbnVsbCBpbiBicm93c2Vyc1xyXG4gKiB0aGF0IGRvbid0IHN1cHBvcnQgdGhlIEFQSS5cclxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgZWxhcHNlZCB0aW1lIHNpbmNlIHRoZSBwYWdlIHdhcyByZXF1ZXN0ZWQuXHJcbiAqL1xyXG5mdW5jdGlvbiBub3coKSB7XHJcbiAgcmV0dXJuIHdpbmRvdy5wZXJmb3JtYW5jZSAmJiBwZXJmb3JtYW5jZS5ub3cgJiYgcGVyZm9ybWFuY2Uubm93KCk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogVGhyb3R0bGVzIGEgZnVuY3Rpb24gYW5kIGRlbGF5cyBpdHMgZXhlY3V0aW9uZywgc28gaXQncyBvbmx5IGNhbGxlZCBhdCBtb3N0XHJcbiAqIG9uY2Ugd2l0aGluIGEgZ2l2ZW4gdGltZSBwZXJpb2QuXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cclxuICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXQgVGhlIGFtb3VudCBvZiB0aW1lIHRoYXQgbXVzdCBwYXNzIGJlZm9yZSB0aGVcclxuICogICAgIGZ1bmN0aW9uIGNhbiBiZSBjYWxsZWQgYWdhaW4uXHJcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgdGhyb3R0bGVkIGZ1bmN0aW9uLlxyXG4gKi9cclxuZnVuY3Rpb24gdGhyb3R0bGUoZm4sIHRpbWVvdXQpIHtcclxuICB2YXIgdGltZXIgPSBudWxsO1xyXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoIXRpbWVyKSB7XHJcbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICBmbigpO1xyXG4gICAgICAgIHRpbWVyID0gbnVsbDtcclxuICAgICAgfSwgdGltZW91dCk7XHJcbiAgICB9XHJcbiAgfTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuIGV2ZW50IGhhbmRsZXIgdG8gYSBET00gbm9kZSBlbnN1cmluZyBjcm9zcy1icm93c2VyIGNvbXBhdGliaWxpdHkuXHJcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgRE9NIG5vZGUgdG8gYWRkIHRoZSBldmVudCBoYW5kbGVyIHRvLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBldmVudCBoYW5kbGVyIHRvIGFkZC5cclxuICogQHBhcmFtIHtib29sZWFufSBvcHRfdXNlQ2FwdHVyZSBPcHRpb25hbGx5IGFkZHMgdGhlIGV2ZW4gdG8gdGhlIGNhcHR1cmVcclxuICogICAgIHBoYXNlLiBOb3RlOiB0aGlzIG9ubHkgd29ya3MgaW4gbW9kZXJuIGJyb3dzZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkRXZlbnQobm9kZSwgZXZlbnQsIGZuLCBvcHRfdXNlQ2FwdHVyZSkge1xyXG4gIGlmICh0eXBlb2Ygbm9kZS5hZGRFdmVudExpc3RlbmVyID09ICdmdW5jdGlvbicpIHtcclxuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZm4sIG9wdF91c2VDYXB0dXJlIHx8IGZhbHNlKTtcclxuICB9XHJcbiAgZWxzZSBpZiAodHlwZW9mIG5vZGUuYXR0YWNoRXZlbnQgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgbm9kZS5hdHRhY2hFdmVudCgnb24nICsgZXZlbnQsIGZuKTtcclxuICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIHByZXZpb3VzbHkgYWRkZWQgZXZlbnQgaGFuZGxlciBmcm9tIGEgRE9NIG5vZGUuXHJcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgRE9NIG5vZGUgdG8gcmVtb3ZlIHRoZSBldmVudCBoYW5kbGVyIGZyb20uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGV2ZW50IGhhbmRsZXIgdG8gcmVtb3ZlLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdF91c2VDYXB0dXJlIElmIHRoZSBldmVudCBoYW5kbGVyIHdhcyBhZGRlZCB3aXRoIHRoaXNcclxuICogICAgIGZsYWcgc2V0IHRvIHRydWUsIGl0IHNob3VsZCBiZSBzZXQgdG8gdHJ1ZSBoZXJlIGluIG9yZGVyIHRvIHJlbW92ZSBpdC5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZUV2ZW50KG5vZGUsIGV2ZW50LCBmbiwgb3B0X3VzZUNhcHR1cmUpIHtcclxuICBpZiAodHlwZW9mIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGZuLCBvcHRfdXNlQ2FwdHVyZSB8fCBmYWxzZSk7XHJcbiAgfVxyXG4gIGVsc2UgaWYgKHR5cGVvZiBub2RlLmRldGF0Y2hFdmVudCA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBub2RlLmRldGF0Y2hFdmVudCgnb24nICsgZXZlbnQsIGZuKTtcclxuICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmV0dXJucyB0aGUgaW50ZXJzZWN0aW9uIGJldHdlZW4gdHdvIHJlY3Qgb2JqZWN0cy5cclxuICogQHBhcmFtIHtPYmplY3R9IHJlY3QxIFRoZSBmaXJzdCByZWN0LlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcmVjdDIgVGhlIHNlY29uZCByZWN0LlxyXG4gKiBAcmV0dXJuIHs/T2JqZWN0fSBUaGUgaW50ZXJzZWN0aW9uIHJlY3Qgb3IgdW5kZWZpbmVkIGlmIG5vIGludGVyc2VjdGlvblxyXG4gKiAgICAgaXMgZm91bmQuXHJcbiAqL1xyXG5mdW5jdGlvbiBjb21wdXRlUmVjdEludGVyc2VjdGlvbihyZWN0MSwgcmVjdDIpIHtcclxuICB2YXIgdG9wID0gTWF0aC5tYXgocmVjdDEudG9wLCByZWN0Mi50b3ApO1xyXG4gIHZhciBib3R0b20gPSBNYXRoLm1pbihyZWN0MS5ib3R0b20sIHJlY3QyLmJvdHRvbSk7XHJcbiAgdmFyIGxlZnQgPSBNYXRoLm1heChyZWN0MS5sZWZ0LCByZWN0Mi5sZWZ0KTtcclxuICB2YXIgcmlnaHQgPSBNYXRoLm1pbihyZWN0MS5yaWdodCwgcmVjdDIucmlnaHQpO1xyXG4gIHZhciB3aWR0aCA9IHJpZ2h0IC0gbGVmdDtcclxuICB2YXIgaGVpZ2h0ID0gYm90dG9tIC0gdG9wO1xyXG5cclxuICByZXR1cm4gKHdpZHRoID49IDAgJiYgaGVpZ2h0ID49IDApICYmIHtcclxuICAgIHRvcDogdG9wLFxyXG4gICAgYm90dG9tOiBib3R0b20sXHJcbiAgICBsZWZ0OiBsZWZ0LFxyXG4gICAgcmlnaHQ6IHJpZ2h0LFxyXG4gICAgd2lkdGg6IHdpZHRoLFxyXG4gICAgaGVpZ2h0OiBoZWlnaHRcclxuICB9O1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFNoaW1zIHRoZSBuYXRpdmUgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGZvciBjb21wYXRpYmlsaXR5IHdpdGggb2xkZXIgSUUuXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWwgVGhlIGVsZW1lbnQgd2hvc2UgYm91bmRpbmcgcmVjdCB0byBnZXQuXHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIChwb3NzaWJseSBzaGltbWVkKSByZWN0IG9mIHRoZSBlbGVtZW50LlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGVsKSB7XHJcbiAgdmFyIHJlY3Q7XHJcblxyXG4gIHRyeSB7XHJcbiAgICByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAvLyBJZ25vcmUgV2luZG93cyA3IElFMTEgXCJVbnNwZWNpZmllZCBlcnJvclwiXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdzNjL0ludGVyc2VjdGlvbk9ic2VydmVyL3B1bGwvMjA1XHJcbiAgfVxyXG5cclxuICBpZiAoIXJlY3QpIHJldHVybiBnZXRFbXB0eVJlY3QoKTtcclxuXHJcbiAgLy8gT2xkZXIgSUVcclxuICBpZiAoIShyZWN0LndpZHRoICYmIHJlY3QuaGVpZ2h0KSkge1xyXG4gICAgcmVjdCA9IHtcclxuICAgICAgdG9wOiByZWN0LnRvcCxcclxuICAgICAgcmlnaHQ6IHJlY3QucmlnaHQsXHJcbiAgICAgIGJvdHRvbTogcmVjdC5ib3R0b20sXHJcbiAgICAgIGxlZnQ6IHJlY3QubGVmdCxcclxuICAgICAgd2lkdGg6IHJlY3QucmlnaHQgLSByZWN0LmxlZnQsXHJcbiAgICAgIGhlaWdodDogcmVjdC5ib3R0b20gLSByZWN0LnRvcFxyXG4gICAgfTtcclxuICB9XHJcbiAgcmV0dXJuIHJlY3Q7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhbiBlbXB0eSByZWN0IG9iamVjdC4gQW4gZW1wdHkgcmVjdCBpcyByZXR1cm5lZCB3aGVuIGFuIGVsZW1lbnRcclxuICogaXMgbm90IGluIHRoZSBET00uXHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGVtcHR5IHJlY3QuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRFbXB0eVJlY3QoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHRvcDogMCxcclxuICAgIGJvdHRvbTogMCxcclxuICAgIGxlZnQ6IDAsXHJcbiAgICByaWdodDogMCxcclxuICAgIHdpZHRoOiAwLFxyXG4gICAgaGVpZ2h0OiAwXHJcbiAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyB0byBzZWUgaWYgYSBwYXJlbnQgZWxlbWVudCBjb250YWlucyBhIGNoaWxkIGVsZW1udCAoaW5jbHVkaW5nIGluc2lkZVxyXG4gKiBzaGFkb3cgRE9NKS5cclxuICogQHBhcmFtIHtOb2RlfSBwYXJlbnQgVGhlIHBhcmVudCBlbGVtZW50LlxyXG4gKiBAcGFyYW0ge05vZGV9IGNoaWxkIFRoZSBjaGlsZCBlbGVtZW50LlxyXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBwYXJlbnQgbm9kZSBjb250YWlucyB0aGUgY2hpbGQgbm9kZS5cclxuICovXHJcbmZ1bmN0aW9uIGNvbnRhaW5zRGVlcChwYXJlbnQsIGNoaWxkKSB7XHJcbiAgdmFyIG5vZGUgPSBjaGlsZDtcclxuICB3aGlsZSAobm9kZSkge1xyXG4gICAgaWYgKG5vZGUgPT0gcGFyZW50KSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICBub2RlID0gZ2V0UGFyZW50Tm9kZShub2RlKTtcclxuICB9XHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIHBhcmVudCBub2RlIG9mIGFuIGVsZW1lbnQgb3IgaXRzIGhvc3QgZWxlbWVudCBpZiB0aGUgcGFyZW50IG5vZGVcclxuICogaXMgYSBzaGFkb3cgcm9vdC5cclxuICogQHBhcmFtIHtOb2RlfSBub2RlIFRoZSBub2RlIHdob3NlIHBhcmVudCB0byBnZXQuXHJcbiAqIEByZXR1cm4ge05vZGV8bnVsbH0gVGhlIHBhcmVudCBub2RlIG9yIG51bGwgaWYgbm8gcGFyZW50IGV4aXN0cy5cclxuICovXHJcbmZ1bmN0aW9uIGdldFBhcmVudE5vZGUobm9kZSkge1xyXG4gIHZhciBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XHJcblxyXG4gIGlmIChwYXJlbnQgJiYgcGFyZW50Lm5vZGVUeXBlID09IDExICYmIHBhcmVudC5ob3N0KSB7XHJcbiAgICAvLyBJZiB0aGUgcGFyZW50IGlzIGEgc2hhZG93IHJvb3QsIHJldHVybiB0aGUgaG9zdCBlbGVtZW50LlxyXG4gICAgcmV0dXJuIHBhcmVudC5ob3N0O1xyXG4gIH1cclxuICByZXR1cm4gcGFyZW50O1xyXG59XHJcblxyXG5cclxuLy8gRXhwb3NlcyB0aGUgY29uc3RydWN0b3JzIGdsb2JhbGx5LlxyXG53aW5kb3cuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgPSBJbnRlcnNlY3Rpb25PYnNlcnZlcjtcclxud2luZG93LkludGVyc2VjdGlvbk9ic2VydmVyRW50cnkgPSBJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5O1xyXG5cclxufSh3aW5kb3csIGRvY3VtZW50KSk7Il19
