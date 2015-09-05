var _ = require('./lang');

exports.createElem = function (name, props) {
    var node = document.createElement(name.toLowerCase());

    _.each(props, function (value, name) {
        node.setAttribute(name, value);
    });

    return node;
};

exports.createText = function (text) {
    var div = document.createElement('div'),
        node;

    div.innerHTML = text;
    node = div.firstChild;
    div = null;

    return node;
};

exports.selectNode = function (selector, context) {
    if (context) {
        return context.querySelector(selector);
    } else {
        return document.querySelector(selector);
    }
};

exports.selectNodes = function (selector, context) {
    if (context) {
        return context.querySelectorAll(selector);
    } else {
        return document.querySelectorAll(selector);
    }
};

exports.removeNode = function (node) {
    var parent = node.parentNode;

    if (parent) {
        parent.removeChild(node);
    }
};

exports.replaceNode = function (node, other) {
    var parent = node.parentNode;

    if (parent) {
        parent.replaceChild(other, node);
    }
};

exports.appendChild = function (parent, node) {
    parent.appendChild(node);
};

exports.prependChild = function (parent, node) {
    var first = parent.firstChild;

    if (!first) {
        parent.appendChild(node);
    } else {
        parent.insertBefore(node, first);
    }
};

exports.insertBefore = function (before, node) {
    var parent = before.parentNode;

    if (parent) {
        parent.insertBefore(node, before);
    }
};

exports.insertAfter = function (after, node) {
    var parent = after.parentNode,
        next = after.nextSibling;

    if (parent) {
        if (next) {
            parent.insertBefore(node, next);
        } else {
            parent.appendChild(node);
        }
    }
};

exports.domReady = (function () {
    var scrollIntervalId,
        testDiv,
        isTop,
        isBrowser = typeof window !== 'undefined' && window.document,
        isPageLoaded = !isBrowser,
        doc = isBrowser ? document : null,
        readyCalls = [];

    function runCallbacks(callbacks) {
        var i = -1,
            len = callbacks.length;

        while (++i < len) {
            callbacks[i](doc);
        }
    }

    function callReady() {
        var callbacks = readyCalls;

        if (isPageLoaded && callbacks.length) {
            readyCalls = [];
            runCallbacks(callbacks);
        }
    }

    function pageLoaded() {
        if (!isPageLoaded) {
            isPageLoaded = true;

            if (scrollIntervalId) {
                clearInterval(scrollIntervalId);
            }

            callReady();
        }
    }

    if (isBrowser) {
        if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', pageLoaded, false);
            window.addEventListener('load', pageLoaded, false);
        } else if (window.attachEvent) {
            window.attachEvent('onload', pageLoaded);

            testDiv = document.createElement('div');

            try {
                isTop = window.frameElement === null;
            } catch (e) {

            }

            if (testDiv.doScroll && isTop && window.external) {
                scrollIntervalId = setInterval(function () {
                    try {
                        testDiv.doScroll();
                        pageLoaded();
                    } catch (e) {}
                }, 30);
            }
        }

        if (document.readyState === 'complete') {
            pageLoaded();
        }
    }

    return function (callback) {
        if (isPageLoaded) {
            callback(doc);
        } else {
            readyCalls.push(callback);
        }
    };
})();