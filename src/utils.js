'use strict';

const
    { inspect } = require('util'),
    { isArray, forEach, isString, isPlainObject, isUndefined, slice, toPairs } = require('lodash');

module.exports.validate = function (jsml) {
    if (isString(jsml)) {
        return;
    }
    if (!isArray(jsml)) {
        throw new Error (`Invalid JsonML: ${inspect(jsml)} is neither an array nor a string`);
    }
    if (jsml.length === 0) {
        throw new Error ('Invalid JsonML: [] is an empty array');
    }
    if (!isString(jsml[0])) {
        throw new Error (`Invalid JsonML: first item ${inspect(jsml[0])} is not a string`);
    } else if (jsml[0] === '') {
        throw new Error ('Invalid JsonML: first item \'\' is the empty string');
    }
    let childrenStartIndex = 1;
    if (isPlainObject(jsml[1])) {
        forEach(toPairs(jsml[1]), ([name, value]) => {
            if (!isString(value)) {
                throw new Error(
                    `Invalid JsonML: the value of attribute "${name}", ${inspect(value)}, is not a string`
                );
            }
        });
        childrenStartIndex++;
    }
    forEach(slice(jsml, childrenStartIndex), (child) => module.exports.validate(child));
};

module.exports.getTag = function ([tag]) {
    return tag;
};

module.exports.getAttributes = function ([, maybeAttributes]) {
    return isPlainObject(maybeAttributes) ? maybeAttributes : undefined;
};

module.exports.getChildren = function ([, maybeAttributes, ...rest]) {
    return isPlainObject(maybeAttributes) ? rest : isUndefined(maybeAttributes) ? [] : [maybeAttributes, ...rest];
};

module.exports.getChildrenStartIndex = function ([, maybeAttributes]) {
    return isPlainObject(maybeAttributes) ? 2 : 1;
};
