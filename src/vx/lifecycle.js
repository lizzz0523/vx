var Type = require('./type'),

    _ = require('../utils/lang');

exports.cache = {};

exports.render = function (id, vnode) {
    var view;

    if (vnode.type !== Type.NODE_VIEW) {
        return null;
    }
    
    if (exports.cache[id]) {
        view = exports.cache[id];
        view.set(vnode.props, vnode.children);
    } else {
        view = new vnode.name(id, vnode.props, vnode.children);
        exports.cache[id] = view;
    }
        
    return view.node;
};

exports.destory = function (id, vnode) {
    var view;

    if (vnode.type !== Type.NODE_VIEW) {
        return null;
    }

    if (!exports.cache[id]) {
        return null;
    }

    view = exports.cache[id];
    view.destory();

    exports.cache[id] = null;

    return null;
};