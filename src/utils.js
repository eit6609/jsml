'use strict';

const
    { inspect } = require('util'),
    {
        find, isArray, forEach, isString, isPlainObject, isUndefined, map, slice, toPairs
    } = require('lodash');

const NAME_REGEXP = /^[_A-Za-z][-._0-9A-Za-z]*(:[_A-Za-z][-._0-9A-Za-z]*)?$/;
const DOCUMENT_SPECTRUM_REGEXP = /^(DECLARATION)?((PI)|(TEXT))*((DOCTYPE)((PI)|(TEXT))*)?(ELEMENT)((PI)|(TEXT))*$/;

module.exports.getEncoding = function ([, content]) {
    let encoding;
    const match = /encoding="(.*)"/.exec(content);
    if (match) {
        [, encoding] = match;
        if (encoding.toUpperCase() === 'ISO-10646-UCS-2') {
            encoding = 'utf16';
        } else if (encoding.toUpperCase() === 'ISO-10646-UCS-4') {
            encoding = 'utf32';
        }
    }
    return encoding;
};

module.exports.validateElementName = function (name) {
    if (name === '!CDATA' || name === '?xml') {
        return;
    }
    if (name.startsWith('?')) {
        return module.exports.validatePITarget(name.substring(1));
    }
    if (!NAME_REGEXP.test(name)) {
        throw new Error(
            `Invalid JSML: the string '${name}', is not a valid element name`
        );
    }
    if (name.toLowerCase().startsWith('xml')) {
        throw new Error(
            `Invalid JSML: the element name '${name}' is not valid because it starts with 'xml'`
        );
    }
};

module.exports.validatePITarget = function (name) {
    if (!NAME_REGEXP.test(name)) {
        throw new Error(
            `Invalid JSML: the string '${name}', is not a valid PI target`
        );
    }
};

module.exports.validateAttributeName = function (name) {
    if (!NAME_REGEXP.test(name)) {
        throw new Error(
            `Invalid JSML: the string '${name}', is not a valid attribute name`
        );
    }
};

module.exports.validateJSML = function (jsml) {
    if (isString(jsml)) {
        return;
    }
    if (!isArray(jsml)) {
        throw new Error(`Invalid JSML: ${inspect(jsml)} is neither an array nor a string`);
    }
    if (jsml.length === 0) {
        throw new Error('Invalid JSML: [] is an empty array');
    }
    if (!isString(jsml[0])) {
        throw new Error(`Invalid JSML: first item ${inspect(jsml[0])} is not a string`);
    } else if (jsml[0] === '') {
        throw new Error('Invalid JSML: first item \'\' is the empty string');
    }
    module.exports.validateElementName(jsml[0]);
    let childrenStartIndex = 1;
    if (isPlainObject(jsml[1])) {
        forEach(toPairs(jsml[1]), ([name, value]) => {
            module.exports.validateAttributeName(name);
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

// TODO it should validate also the content of DECLARATION, DOCTYPE, PI

module.exports.validateDocument = function (document) {
    const type = module.exports.getType(document);
    if (module.exports.getType(document) !== 'DOCUMENT') {
        throw new Error(`Invalid JSML document: it is a ${type}`);
    }
    const [, ...items] = document;
    const spectrum = map(items, module.exports.getType).join('');
    if (!DOCUMENT_SPECTRUM_REGEXP.test(spectrum)) {
        throw new Error(`Invalid JSML document: it does not match ${DOCUMENT_SPECTRUM_REGEXP}`);
    }
    forEach(items, (item) => {
        if (isString(item) && item.trim() !== '') {
            throw new Error('Invalid JSML document: only whitespace text is allowed at its level');
        }
    });
    module.exports.validateJSML(module.exports.getRoot(document));
};

module.exports.xmlDeclaration = function (encoding = 'utf-8') {
    return ['?xml', `version="1.0" encoding="${encoding}"`];
};

module.exports.docType = function (content) {
    return ['!DOCTYPE', content];
};

module.exports.processingInstruction = function (target, content) {
    return [`?${target}`, content];
};

module.exports.cdata = function (content) {
    return ['!CDATA', content];
};

module.exports.isElementName = function (name) {
    return NAME_REGEXP.test(name);
};

// This method works also with invalid data:

module.exports.getType = function (item) {
    if (isString(item)) {
        return 'TEXT';
    }
    if (!isArray(item)) {
        return 'UNKNOWN';
    }
    const [tag] = item;
    if (!isString(tag)) {
        return 'UNKNOWN';
    }
    if (module.exports.isElementName(tag)) {
        return 'ELEMENT';
    }
    switch (tag) {
        case '!DOCUMENT':
            return 'DOCUMENT';
        case '!DOCTYPE':
            return 'DOCTYPE';
        case '!CDATA':
            return 'CDATA';
    }
    if (tag.startsWith('?')) {
        if (tag === '?xml') {
            return 'DECLARATION';
        }
        return 'PI';
    }
    return 'UNKNOWN';
};

// The following methods work only for valid JSML

module.exports.getRoot = function ([...items]) {
    return find(items, (item) => module.exports.getType(item) === 'ELEMENT');
};

module.exports.destructureElement = function ([tag, attributes, ...children]) {
    if (isArray(attributes) || isString(attributes)) {
        children = [attributes, ...children];
        attributes = undefined;
    }
    return { tag, attributes, children };
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
