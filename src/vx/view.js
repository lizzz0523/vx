var diff = require('../vdom/diff'),
    apply = require('../vdom/apply'),
    
    _ = require('../utils/lang');

var View = function(id, props, children, name) {
    this.id = id;
    this.name = name;
    this.state = {};
    this.vnode = null;
    this.node = null;

    _.extend(this.state, props);
    _.extend(this.state, {
        children: children
    });

    this.update();
};

_.extend(View.prototype, {
    set: function (props, children) {
        if (_.isString(props)) {
            this.state[props] = children;
        } else {
            _.extend(this.state, props);
            _.extend(this.state, {
                children: children
            });
        }

        this.update();
    },

    render: function () {
        if (this.template) {
            return this.template.call(this.state);
        } else {
            return this.state.children[0] || null;
        }
    },

    diff: function (vnode) {
        return diff(this.id, this.vnode, vnode);
    },

    apply: function (patches) {
        return apply(this.id, this.node, patches);
    },

    update: function () {
        var vnode = this.render(),
            patches = this.diff(vnode),
            node = this.apply(patches);

        this.vnode = vnode;
        this.node = node;
    },

    destory: function () {
        
    }
});

module.exports = View;