var Type = require('./type'),

    _ = require('../utils/lang');

exports.cache = {};

exports.render = function (vxid, vnode) {
    var view;

    if (vnode.type !== Type.NODE_VIEW) {
        return null;
    }
    
    if (exports.cache[vxid]) {
        view = exports.cache[vxid];
        view.set(vnode.props, vnode.children);
    } else {
        view = new vnode.name(vxid, vnode.props, vnode.children);
        exports.cache[vxid] = view;
    }
        
    return view.node;
};

exports.destroy = function (vxid, vnode) {
    var rvxid = new RegExp('^' + vxid.replace('.', '\\\.') + '(?:\\\.|$)');
    
    _.each(exports.cache, function (view, vxid) {
        if (rvxid.test(vxid)) {
            view.destroy();
            exports.cache[vxid] = null;
        }
    });

    return null;
};