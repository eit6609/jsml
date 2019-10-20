'use strict';

const
    { forEach, map, isArray, isEmpty, isString, toPairs } = require('lodash'),
    { getAttributes, getChildren, getTag, validate } = require('./utils.js'),
    fs = require('fs');

class JSMLSerializer {

    static escapeAttributeValue (text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    static escapeText (text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;');
    }

    static serializeAttributes (attributes) {
        return map(
            toPairs(attributes),
            ([name, value]) => `${name}="${JSMLSerializer.escapeAttributeValue(value)}"`
        ).join(' ');
    }

    constructor (options) {
        options = options || {};
        this.newline = options.newline === true;
    }

    append (text) {
        this.chunks.push(text);
    }

    nl () {
        if (this.newline) {
            this.append('\n');
        }
    }

    //eslint-disable-next-line max-statements
    serializeRecursive (jsml) {
        if (isString(jsml)) {
            this.append(JSMLSerializer.escapeText(jsml));
        } else {
            const tag = getTag(jsml);
            if (tag === '!CDATA') {
                this.append(`<![CDATA[${jsml[1]}]]>`);
                this.nl();
            } else {
                const attributes = getAttributes(jsml);
                const children = getChildren(jsml);
                const hasChildren = children.length !== 0;
                if (attributes && !isEmpty(attributes)) {
                    this.append(
                        `<${tag} ${JSMLSerializer.serializeAttributes(attributes)}${hasChildren ? '>' : ' />'}`
                    );
                } else {
                    this.append(`<${tag}${hasChildren ? '>' : ' />'}`);
                }
                if (!hasChildren || isArray(children[0])) {
                    this.nl();
                }
                if (hasChildren) {
                    forEach(children, (child) => this.serializeRecursive(child));
                    this.append(`</${tag}>`);
                    this.nl();
                }
            }
        }
    }

    serialize (jsml, docType = null, appendDeclaration = true) {
        validate(jsml);
        this.chunks = [];
        if (appendDeclaration) {
            this.append('<?xml version="1.0" encoding="utf-8"?>');
            this.nl();
        }
        if (docType) {
            this.append(docType);
            this.nl();
        }
        this.serializeRecursive(jsml);
        return this.chunks.join('');
    }

    save (jsml, filename, docType = null) {
        fs.writeFileSync(filename, this.serialize(jsml, docType), 'utf8');
    }

}

module.exports = JSMLSerializer;
