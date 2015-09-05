var View = require('./view'),
    Type = require('./type'),
    
    _ = require('../utils/lang');

exports.views = {};

exports.view = function (name, proto, global) {
    function Child(id, props, children) {
        View.call(this, id, props, children, name);
    }

    function Proxy() {

    }

    Proxy.prototype = View.prototype;
    Child.prototype = new Proxy();

    if (proto && _.isFunction(proto)) {
        proto = {
            template: proto
        };
    }

    _.extend(Child.prototype, proto || {});
    _.extend(Child, global || {});

    exports.views[name] = Child;
};

exports.create = function (name, props, children) {
    var type,
        key,
        count;

    if (!_.isPlainObject(props)) {
        children = props;
        props = {};
    }

    if (!_.isArray(children)) {
        children = [children];
    }

    props = _.reduce(props, function (props, value, name) {
        value = _.isFunction(value) ? value() : value;
        props[name] = value;

        return props;
    }, {});

    children = _.reduce(children, function (children, child) {
        var i,
            len;

        child = _.isFunction(child) ? child() : child;

        if (!_.isUndefined(child) && child !== '') {
            if (_.isArray(child)) {
                i = -1;
                len = child.length;

                while (++i < len) {
                    children.push(child[i]);
                }
            } else {
                children.push(child);
            }
        }

        return children;
    }, []);

    if (name in exports.views) {
        name = exports.views[name];

        type = Type.NODE_VIEW;
        key = props.key;
        count = 0;
    } else {
        type = Type.NODE_ELEM;
        key = props.key;
        count = children.length;

        _.each(children, function (child) {
            count += child.count || 0;
        });
    }

    return {
        type: type,
        name: name,
        props: props,
        children: children,
        key: key,
        count: count
    };
};