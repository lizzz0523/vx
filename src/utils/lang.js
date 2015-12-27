var toString = function (obj) {
        return Object.prototype.toString.call(obj);
    },

    hasOwn = function (obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    },

    slice = function (arr, start, stop) {
        if (stop === void 0) {
            return Array.prototype.slice.call(arr, start || 0);
        } else {
            return Array.prototype.slice.call(arr, start, stop);
        }
    };

function isType(type) {
    return function (obj) {
        return toString(obj) === '[object ' + type + ']';
    }
}

var isArray = Array.isArray || isType('Array'),
    isObject = isType('Object'),
    isFunction = isType('Function'),
    isString = isType('String'),
    isWindow = isType('Window');

function isPlainObject(obj) {
    if (!isObject(obj) || isWindow(obj) || obj.nodeType) {
        return false;
    }

    if (obj.constructor && !hasOwn(obj.constructor.prototype, 'isPrototypeOf')) {
        return false;
    }

    return true;
}

function isUndefined(obj) {
    return obj === void 0 || obj === null;
}

function keys(obj) {
    var ret = [],
        key;

    for (key in obj) {
        if (hasOwn(obj, key)) {
            ret.push(key);
        }
    }

    return ret;
}

function each(obj, fn) {
    var props,
        i,
        len;

    if (isArray(obj)) {
        i = -1;
        len = obj.length;

        while (++i < len) {
            if (fn.call(obj[i], obj[i], i, obj) === false) break;
        }
    } else {
        props = keys(obj);
        i = -1;
        len = props.length;

        while (++i < len) {
            if (fn.call(obj[props[i]], obj[props[i]], props[i], obj) === false) break;
        }
    }
}

function map(obj, fn) {
    var ret = [];

    each(obj, function (value, key, obj) {
        ret.push(fn.call(value, value, key, obj));
    });

    return ret;
}

function reduce(obj, fn, memo) {
    var ret = memo,
        init = true;

    each(obj, function (value, key, obj) {
        if (init && isUndefined(ret)) {
            ret = value;
            init = false;
        } else {
            ret = fn.call(value, ret, value, key, obj);
        }
    });

    return ret;
}

function extend(dest) {
    var args = slice(arguments, 1);

    each(args, function (src, index) {
        each(src, function (value, key) {
            dest[key] = value;
        });
    });

    return dest;
}

function bind(fn, context) {
    return function () {
        return fn.apply(context, arguments);
    };
}

exports.isArray = isArray;
exports.isObject = isObject;
exports.isPlainObject = isPlainObject;
exports.isFunction = isFunction;
exports.isString = isString;
exports.isWindow = isWindow;
exports.isUndefined = isUndefined;

exports.has = hasOwn;
exports.keys = keys;
exports.each = each;
exports.map = map;
exports.reduce = reduce;
exports.extend = extend;
exports.bind = bind;