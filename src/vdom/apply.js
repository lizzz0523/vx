var VX = require('../vx/lifecycle'),
    Type = require('../vx/type'),

    $ = require('../utils/dom'),
    _ = require('../utils/lang');

module.exports = function (id, node, patches) {
    var indices = patchIndices(patches),
        nodes = domSearch(node, patches.a, indices);
        
    _.each(indices, function (index) {
        node = applyPatch(id, node, nodes[index], patches[index]);
    });

    return node;
};

function applyPatch(id, root, node, patch) {
    if (!_.isArray(patch)) {
        patch = [patch];
    }
    
    _.each(patch, function (operate) {
        var result = applyOperate(id, node, operate);
        
        if (node === root) {
            root = result;
        }
    });

    return root;
}

function applyOperate(id, node, operate) {
    var type = operate.type,
        vnode = operate.vnode,
        patch = operate.patch;

    switch (type) {
        case Type.PATCH_CREATE:
            return createNode(id, node, patch);
        case Type.PATCH_REMOVE:
            return removeNode(id, node, patch);
        case Type.PATCH_REPLACE:
            return replaceNode(id, node, vnode, patch);
        case Type.PATCH_INSERT:
            return insertNode(id, node, patch);
        case Type.PATCH_ORDER:
            return orderNode(id, node, patch);
        case Type.PATCH_PROP:
            return updateProp(id, node, patch);
        case Type.PATCH_VIEW:
            return updateView(id, node, patch);
        default:
            return node;
    }
}

function createNode(id, node, vnode) {
    var result;
    
    if (_.isString(vnode)) {
        result = $.createText(vnode);
    } else if (vnode.type === Type.NODE_ELEM) {
        result = $.createElem(vnode.name, vnode.props);

        _.each(vnode.children, function (vnode, index) {
            $.appendChild(result, createNode(id + '.' + index, node, vnode));
        });

        result.vxId = id;
    } else if (vnode.type === Type.NODE_VIEW) {
        result = VX.render(id, vnode);
    }
    
    return result;
}

function removeNode(id, node, vnode) {
    if (vnode.type && vnode.type === Type.NODE_VIEW) {
        VX.destory(node.vxId, vnode);
    }
    
    $.removeNode(node);
    
    return null;
}

function replaceNode(id, node, vnode, patch) {
    var result;
    
    if (vnode.type && vnode.type === Type.NODE_VIEW) {
        VX.destory(node.vxId, vnode);
    }

    $.replaceNode(node, result = createNode(node.vxId, node, patch));
    
    return result;
}

function insertNode(id, node, patch) {
    var children = node.childNodes;
    
    $.appendChild(node, createNode(node.vxId + '.' + children.length, node, patch));
    
    return node;
}

function orderNode(id, node, patch) {
    var children = node.childNodes,
        map = {};

    _.each(patch.remove, function (remove) {
        var child = children[remove.from];
        
        if (remove.key) {
            map[remove.key] = child;
        }
        
        $.removeNode(node, child);
    });
    
    _.each(patch.inserts, function (insert) {
        var child = map[insert.key];
        
        $.insertBefore(children[insert.to], child);
    });
    
    return node;
}

function updateProp(id, node, patch) {
    _.each(patch, function (value, name) {
        if (_.isUndefined(value)) {
            node.removeAttribute(name);
        } else {
            node.setAttribute(name, value);
        }
    });
}

function updateView(id, node, patch) {
    var result;

    result = VX.render(node.vxId, patch);

    return result;
}

function patchIndices(patches) {
    var indices = [],
        key;

    for (key in patches) {
        if (key !== 'a') {
            indices.push(Number(key));
        }
    }

    return indices;
}

function domSearch(node, vnode, indices) {
    if (indices.length === 0) {
        return {};
    } else {
        return recurse(node, vnode, 0, indices.sort(asc), {});
    }
}

function recurse(node, vnode, index, indices, nodes) {
    var prev,
        next;
    
    if (search(indices, index, index)) {
        nodes[index] = node || null;
    }
    
    if (node && vnode && vnode.count) {
        node = node.firstChild;
        prev = index;
        
        _.each(vnode.children, function (vnode, i) {
            prev = prev + 1;
            next = prev + (vnode.count || 0);
            
            if (search(indices, prev, next)) {
                recurse(node, vnode, prev, indices, nodes);
            }
            
            node = node.nextSibling;
            prev = next;
        });
    }
    
    return nodes;
}

function search(indices, left, right) {
    var min = 0,
        max = indices.length - 1,
        index,
        item;
    
    if (indices.length === 0) {
        return false;
    }

    while (min <= max) {
        index = ((max + min) / 2) >> 0;
        item = indices[index];

        if (min === max) {
            return item >= left && item <= right;
        } else if (item < left) {
            min = index + 1;
        } else  if (item > right) {
            max = index - 1;
        } else {
            return true;
        }
    }

    return false;
}
    
function asc(a, b) {
    return a > b ? 1 : -1;
}