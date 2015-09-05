var Type = require('../vx/type'),

    _ = require('../utils/lang');

module.exports = function (id, a, b) {
    var patches = {a: a};
    
    walkTree(a, b, patches, 0);
    
    return patches;
};

function diffProps(a, b, patches, patch, index) {
    var propsPatch;

    _.each(a.props, function (value, name) {
        var patch;
        
        if (!(name in b.props)) {
            propsPatch = propsPatch || {};
            propsPatch[name] = void 0;
        } else {
            patch = b.props[name];

            if (value !== patch) {
                propsPatch = propsPatch || {}
                propsPatch[name] = patch;
            }
        }
    });
    
    _.each(b.props, function (value, name) {
        if (!(name in a.props)) {
            propsPatch = propsPatch || {};
            propsPatch[name] = value;
        }
    });
    
    if (propsPatch) {
        patch = appendPatch(patch, {
            type: Type.PATCH_PROP,
            vnode: a,
            patch: propsPatch
        });
    }
    
    return patch;
}

function diffChildren(a, b, patches, patch, index) {
    var orderedSet = reorder(a.children, b.children),
        aChildren = orderedSet.aChildren,
        bChildren = orderedSet.bChildren,
        aChild,
        bChild,
    
        i = -1,
        len = Math.max(a.count, b.count);
        
    while (++i < len) {
        aChild = aChildren[i] || null;
        bChild = bChildren[i] || null;
        index++;
        
        if (!aChild && bChild) {
            patch = appendPatch(patch, {
                type: Type.PATCH_INSERT,
                vnode: aChild,
                patch: bChild
            });
        } else {
            walkTree(aChild, bChild, patches, index);
        }
        
        if (aChild && aChild.count) {
            index += aChild.count;
        }
    }
    
    if (orderedSet.movePatch) {
        patch = appendPatch(patch, {
            type: Type.PATCH_ORDER,
            vnode: a,
            patch: orderedSet.movePatch
        });
    }
    
    return patch;
}

function diffView(a, b, patches, patch, index) {
    if (a.props !== b.props || a.children !== b.children) {
        patch = appendPatch(patch, {
            type: Type.PATCH_VIEW,
            vnode: a,
            patch: b
        });
    }
    
    return patch;
}

function walkTree(a, b, patches, index) {
    var patch = patches[index];
    
    if (a === b) {
        // 如果a等于b，则结束
        return;
    }
    
    if (_.isUndefined(b)) {
        patch = appendPatch(patch, {
            type: Type.PATCH_REMOVE,
            vnode: a,
            patch: b
        });
    } else if (_.isUndefined(a)) {
        patch = appendPatch(patch, {
            type: Type.PATCH_CREATE,
            vnode: a,
            patch: b
        });
    } else if (_.isString(b)) {
        if (_.isString(a) && a === b) {
            // do nothing
        } else {
            patch = appendPatch(patch, {
                type: Type.PATCH_REPLACE,
                vnode: a,
                patch: b
            });
        }
    } else if (b.type === Type.NODE_ELEM) {
        if (a.type === Type.NODE_ELEM && a.name === b.name) {
            patch = diffProps(a, b, patches, patch, index);
            patch = diffChildren(a, b, patches, patch, index);
        } else {
            patch = appendPatch(patch, {
                type: Type.PATCH_REPLACE,
                vnode: a,
                patch: b
            });
        }
    } else if (b.type === Type.NODE_VIEW) {
        if (a.type === Type.NODE_VIEW && a.name === b.name) {
            patch = diffView(a, b, patches, patch, index);
        } else {
            patch = appendPatch(patch, {
               type: Type.PATCH_REPLACE,
               vnode: a,
               patch: b
            });
        }
    }
    
    if (patch) {
        patches[index] = patch;
    }
}

function appendPatch(arr, patch) {
    if (arr) {
        if (!_.isArray(arr)) {
            arr = [arr];
        }
        
        arr.push(patch);
    } else {
        arr = patch;
    }
    
    return arr;
}

function reorder(aChildren, bChildren) {
    var bChildIndex = index(bChildren),
        bKeys = bChildIndex.keys,
        bFree = bChildIndex.free,
        
        aChildIndex = index(aChildren),
        aKeys = aChildIndex.keys,
        aFree = aChildIndex.free,
        
        children,
        freePoint = 0,
        freeCount = bFree.length,
        lastFreeIndex,
        deletedIndex = 0,
        aChild,
        bChild,

        simulate,
        simulateIndex = 0,
        wantedIndex = 0,
        simulateChild,
        wantedChild, 
        removes = [],
        inserts = [];

    if (bFree.length === bChildren.length) {
        return {
            aChildren: aChildren,
            bChildren: bChildren,
            movePatch: null
        };
    }

    if (aFree.length === aChildren.length) {
        return {
            aChildren: aChildren,
            bChildren: bChildren,
            movePatch: null
        };
    }
    
    children = [];
    
    // 对应处理aChildren
    _.each(aChildren, function (aChild, index) {
        if (aChild.key) {
            if (_.has(bKeys, aChild.key)) {
                children.push(bChildren[bKeys[aChild.key]]);
            } else {
                deletedIndex++;
                children.push(null);
            }
        } else {
            if (freePoint < freeCount) {
                children.push(bChildren[bFree[freePoint++]]);
            } else {
                deletedIndex++;
                children.push(null);
            }
        }
    });

    lastFreeIndex = freePoint < freeCount ? bFree[freePoint] : bChildren.length;
    
    // 对应处理bChildren
    _.each(bChildren, function (bChild, index) {
        if (bChild.key) {
            if (!_.has(aKeys, bChild.key)) {
                children.push(bChild);
            }
        } else {
            if (index >= lastFreeIndex) {
                children.push(bChild);
            }
        }
    });
    
    children = children.concat(bChildren);
    bChildren = children.splice(0, children.length - bChildren.length);
    
    simulate = bChildren.slice();

    while (wantedIndex < children.length) {
        wantedChild = children[wantedIndex];
        simulateChild = simulate[simulateIndex];

        while (simulateChild === null && simulate.length) {
            removes.push(remove(simulate, simulateIndex, null));
            simulateChild = simulate[simulateIndex];
        }

        if (!simulateChild || simulateChild.key !== wantedChild.key) {
            if (wantedChild.key) {
                if (simulateChild && simulateChild.key) {
                    if (bKeys[simulateChild.key] !== wantedIndex + 1) {
                        removes.push(remove(simulate, simulateIndex, simulateChild.key));
                        simulateChild = simulate[simulateIndex];
                        
                        if (!simulateChild || simulateChild.key !== wantedChild.key) {
                            inserts.push({key: wantedChild.key, to: wantedIndex});
                        } else {
                            simulateIndex++;
                        }
                    } else {
                        inserts.push({key: wantedChild.key, to: wantedIndex});
                    }
                } else {
                    inserts.push({key: wantedChild.key, to: wantedIndex});
                }
                
                wantedIndex++;
            } else if (simulateChild && simulateChild.key) {
                removes.push(remove(simulate, simulateIndex, simulateChild.key));
            }
        } else {
            wantedIndex++;
            simulateIndex++;
        }
    }

    while (simulateIndex < simulate.length) {
        simulateChild = simulate[simulateIndex];
        removes.push(remove(simulate, simulateIndex, simulateChild && simulateChild.key));
    }

    if (removes.length === deletedIndex && !inserts.length) {
        return {
            aChildren: aChildren,
            bChildren: bChildren,
            movePatch: null
        };
    }

    return {
        aChildren: aChildren,
        bChildren: bChildren,
        movePatch: {
            removes: removes,
            inserts: inserts
        }
    };
}

function index(children) {
    var keys = {},
        free = [],
        
        child,
        i = -1,
        len = children.length;

    while (++i < len) {
        child = children[i];

        if (child.key) {
            keys[child.key] = i;
        } else {
            free.push(i);
        }
    }

    return {
        keys: keys,
        free: free
    };
}

function remove(children, index, key) {
    children.splice(index, 1);

    return {
        from: index,
        key: key
    };
}