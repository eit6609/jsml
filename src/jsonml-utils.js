'use strict';

const
    { inspect } = require('util'),
    { isArray, forEach, isString, isPlainObject, isUndefined, slice, toPairs } = require('lodash');

module.exports.validate = function (jsonml) {
    if (isString(jsonml)) {
        return;
    }
    if (!isArray(jsonml)) {
        throw new Error (`Invalid JsonML: ${inspect(jsonml)} is neither an array nor a string`);
    }
    if (jsonml.length === 0) {
        throw new Error ('Invalid JsonML: [] is an empty array');
    }
    if (!isString(jsonml[0])) {
        throw new Error (`Invalid JsonML: first item ${inspect(jsonml[0])} is not a string`);
    } else if (jsonml[0] === '') {
        throw new Error ('Invalid JsonML: first item \'\' is the empty string');
    }
    let childrenStartIndex = 1;
    if (isPlainObject(jsonml[1])) {
        forEach(toPairs(jsonml[1]), ([name, value]) => {
            if (!isString(value)) {
                throw new Error(
                    `Invalid JsonML: the value of attribute "${name}", ${inspect(value)}, is not a string`
                );
            }
        });
        childrenStartIndex++;
    }
    forEach(slice(jsonml, childrenStartIndex), (child) => module.exports.validate(child));
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
