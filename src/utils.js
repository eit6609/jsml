'use strict';

const
    { inspect } = require('util'),
    { isArray, forEach, isString, isPlainObject, isUndefined, slice, toPairs } = require('lodash');


const NAME_REGEXP = /^[_A-Za-z][-._0-9A-Za-z]*(:[_A-Za-z][-._0-9A-Za-z]*)?$/;

function validateNAME (name, isAttribute) {
    if (name === '!CDATA' && !isAttribute) {
        return;
    }
    if (!NAME_REGEXP.test(name)) {
        throw new Error(
            `Invalid JSML: the string '${name}', is not a valid XML name`
        );
    }
    if (!isAttribute && name.toLowerCase().startsWith('xml')) {
        throw new Error(
            `Invalid JSML: the element name '${name}' is not valid because it starts with 'xml'`
        );
    }
}

module.exports.validateJSML = function (jsml) {
    if (isString(jsml)) {
        return;
    }
    if (!isArray(jsml)) {
        throw new Error (`Invalid JSML: ${inspect(jsml)} is neither an array nor a string`);
    }
    if (jsml.length === 0) {
        throw new Error ('Invalid JSML: [] is an empty array');
    }
    if (!isString(jsml[0])) {
        throw new Error (`Invalid JSML: first item ${inspect(jsml[0])} is not a string`);
    } else if (jsml[0] === '') {
        throw new Error ('Invalid JSML: first item \'\' is the empty string');
    }
    validateNAME(jsml[0]);
    let childrenStartIndex = 1;
    if (isPlainObject(jsml[1])) {
        forEach(toPairs(jsml[1]), ([name, value]) => {
            validateNAME(name, true);
            if (!isString(value)) {
                throw new Error(
                    `Invalid JSML: the value of attribute '${name}', ${inspect(value)}, is not a string`
                );
            }
        });
        childrenStartIndex++;
    }
    forEach(slice(jsml, childrenStartIndex), (child) => module.exports.validateJSML(child));
};

module.exports.validateElement = function (jsml) {
    if (!isArray(jsml)) {
        throw new Error (`Invalid JSML element: ${inspect(jsml)} is not an array`);
    }
    if (jsml.length === 0) {
        throw new Error ('Invalid JSML element: [] is an empty array');
    }
    if (!isString(jsml[0])) {
        throw new Error (`Invalid JSML element: first item ${inspect(jsml[0])} is not a string`);
    } else if (jsml[0] === '') {
        throw new Error ('Invalid JSML element: first item \'\' is the empty string');
    }
    validateNAME(jsml[0]);
};

module.exports.getTag = function (element) {
    module.exports.validateElement(element);
    const [tag] = element;
    return tag;
};

module.exports.getAttributes = function (element) {
    module.exports.validateElement(element);
    const [, maybeAttributes] = element;
    return isPlainObject(maybeAttributes) ? maybeAttributes : undefined;
};

module.exports.getChildren = function (element) {
    module.exports.validateElement(element);
    const [, maybeAttributes, ...rest] = element;
    return isPlainObject(maybeAttributes) ? rest : isUndefined(maybeAttributes) ? [] : [maybeAttributes, ...rest];
};

module.exports.getChildrenStartIndex = function (element) {
    module.exports.validateElement(element);
    const [, maybeAttributes] = element;
    return isPlainObject(maybeAttributes) ? 2 : 1;
};
