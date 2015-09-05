var extend = require('./utils/lang').extend;

var vx = module.exports = function (parent, name, props) {
    var node = setup(parent, name, props, null),
        tmpl = {
            set: function (props) {
                node = setup(parent, name, props, node);
                return tmpl;
            }
        };

    return tmpl
};

extend(vx, require('./utils'));
extend(vx, require('./vx/view'));
extend(vx, require('./vx/global'));
extend(vx, require('./vx/lifecycle'));

vx.version = '0.0.1';
vx.gvxId = 1;

function setup(parent, name, props, orig) {
    var vnode = vx.create(name, props, []),
        node = vx.render(parent.gvxId || (parent.gvxId = vx.gvxId++), vnode);

    if (!orig) {
        parent.appendChild(node);
    } else if (orig !== node) {
        parent.replaceChild(node, orig);
    }

    return node;
};