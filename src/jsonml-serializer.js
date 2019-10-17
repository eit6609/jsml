'use strict';

const
    { isArray, forEach, map, isEmpty, isString, toPairs } = require('lodash'),
    { getAttributes, getChildren, getTag, validate } = require('./jsonml-utils.js'),
    fs = require('fs');

class JsonMLSerializer {

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
            ([name, value]) => `${name}="${JsonMLSerializer.escapeAttributeValue(value)}"`
        ).join(' ');
    }

    constructor (pretty = true) {
        this.pretty = pretty;
    }

    append (text) {
        this.chunks.push(text);
    }

    nl () {
        if (this.pretty) {
            this.append('\n');
        }
    }

    serializeRecursive (jsonml) {
        if (isString(jsonml)) {
            this.append(JsonMLSerializer.escapeText(jsonml));
        } else {
            const tag = getTag(jsonml);
            const attributes = getAttributes(jsonml);
            const children = getChildren(jsonml);
            const hasChildren = children.lengh !== 0;
            if (attributes && !isEmpty(attributes)) {
                this.append(
                    `<${tag} ${JsonMLSerializer.serializeAttributes(attributes)}${hasChildren ? '>' : '/>'}`
                );
            } else {
                this.append(`<${tag}${hasChildren ? '>' : '/>'}`);
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

    serialize (jsonml, docType = null, appendDeclaration = true) {
        validate(jsonml);
        this.chunks = [];
        if (appendDeclaration) {
            this.append('<?xml version="1.0" encoding="utf-8"?>');
            this.nl();
        }
        if (docType) {
            this.append(docType);
            this.nl();
        }
        this.serializeRecursive(jsonml);
        return this.chunks.join('');
    }

    save (jsonml, filename, docType = null) {
        fs.writeFileSync(filename, this.serialize(jsonml, docType), 'utf8');
    }

}

module.exports = JsonMLSerializer;
