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
        len = Math.max(aChildren.length, bChildren.length);
        
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
    var aIndex = index(aChildren),
        aKeys = aIndex.keys,
        aFree = aIndex.free,

        bIndex = index(bChildren),
        bKeys = bIndex.keys,
        bFree = bIndex.free,

        cChildren = [],
        dChildren = [],
        aChild,
        bChild,
        cChild,
        i,
        j,
        k,
        len,

        freePoint,
        freeCount,
        lastFreeIndex,
        deletedIndex,
        inserts = [],
        removes = [];

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

    i = -1;
    len = aChildren.length;
    freePoint = 0;
    freeCount = bFree.length;
    deletedIndex = 0;

    while (++i < len) {
        aChild = aChildren[i];

        if (aChild.key) {
            if (_.has(bKeys, aChild.key)) {
                cChildren.push(bChildren[bKeys[aChild.key]]);
            } else {
                deletedIndex++;
                cChildren.push(null);
            }
        } else {
            if (freePoint < freeCount) {
                cChildren.push(bChildren[bFree[freePoint++]]);
            } else {
                deletedIndex++;
                cChildren.push(null);
            }
        }
    }

    i = -1;
    len = bChildren.length;
    lastFreeIndex = freePoint < freeCount ? bFree[freePoint] : bChildren.length;

    while (++i < len) {
        bChild = bChildren[i];

        if (bChild.key) {
            if (!_.has(aKeys, bChild.key)) {
                cChildren.push(bChild);
            }
        } else {
            if (i >= lastFreeIndex) {
                cChildren.push(bChild);
            }
        }
    }

    dChildren = cChildren.slice();

    j = 0;
    k = 0;
    len = bChildren.length;

    while (j < len) {
        bChild = bChildren[j];
        cChild = cChildren[k];

        while (cChild === null) {
            removes.push({
                key: null,
                from: k
            });

            cChildren.splice(k, 1);
            cChild = cChildren[k];
        }

        // 如果没有cChild或者有cChild但cChild和bChild不一样
        if (!cChild || cChild.key !== bChild.key) {

            // bChild是特殊值
            if (bChild.key) {

                // cChild也是特殊值
                if (cChild && cChild.key) {
                    removes.push({
                        key: cChild.key,
                        from: k
                    });

                    cChildren.splice(k, 1);

                    // 这里做了一次优化，如果bChild和cChild是相邻，则只需要把前一个cChild删除并插入到bChild后即可
                    if (bKeys[cChild.key] === j + 1) {
                        bChild = bChildren[++j];
                        cChild = cChildren[++k];
                    }

                    inserts.push({
                        key: bChild.key,
                        to: j
                    });

                // cChild是普通值
                } else {
                    inserts.push({
                        key: bChild.key,
                        to: j
                    });
                }

                j++;

            // bChild是普通值，但cChild是特殊值
            } else if (cChild && cChild.key) {
                removes.push({
                    key: cChild.key,
                    from: k
                });

                cChildren.splice(k, 1);

            // bChild是普通值，cChild也是普通值，这种情况不会出现，因为最开始已判断bChild不等于cChild
            } else {

            }

        // cChild和bChild一样
        } else {
            j++;
            k++;
        }
    }

    while (k < cChildren.length) {
        cChild = cChildren[k];

        removes.push({
            key: (cChild && cChild.key) || null,
            from: k
        });

        cChildren.splice(k, 1);
    }

    if (removes.length === deletedIndex && !inserts.length) {
        return {
            aChildren: aChildren,
            bChildren: dChildren,
            movePatch: null
        };
    }

    return {
        aChildren: aChildren,
        bChildren: dChildren,
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