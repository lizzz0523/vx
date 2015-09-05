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

var gvxId = 1;

function setup(parent, name, props, orig) {
    var vnode = vx.create(name, props, []),
        node = vx.render(parent.gvxId || (parent.gvxId = gvxId++), vnode);

    if (!orig) {
        parent.appendChild(node);
    } else if (orig !== node) {
        parent.replaceChild(node, orig);
    }

    return node;
};