'use strict';

const
    { forEach, map, isEmpty, isNumber, isNil, isString, pad, some, toPairs } = require('lodash'),
    { destructureElement, getEncoding, getType, validateJSML, validateDocument } = require('./utils.js'),
    fs = require('fs'),
    iconv = require('iconv-lite');

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

    static escapeCDATA (text) {
        return text
            .replace(/]]>/g, ']]]]><![CDATA[>');
    }

    static serializeAttributes (attributes) {
        return map(
            toPairs(attributes),
            ([name, value]) => `${name}="${JSMLSerializer.escapeAttributeValue(value)}"`
        ).join(' ');
    }

    constructor (options) {
        options = options || {};
        if (!isNil(options.spacesPerLevel) && !isNumber(options.spacesPerLevel)) {
            throw new Error('spacesPerLevel must be a number');
        }
        this.spacesPerLevel = options.spacesPerLevel;
    }

    save (item, filename, encoding = 'utf8') {
        const xml = this.serialize(item);
        if (getType(item) === 'DOCUMENT') {
            encoding = getEncoding(item[1]);
        }
        console.log(encoding);
        fs.writeFileSync(filename, iconv.encode(xml, encoding));
    }

    serialize (item) {
        const type = getType(item);
        if (type === 'DOCUMENT') {
            validateDocument(item);
        } else if (type === 'ELEMENT' || type === 'TEXT') {
            validateJSML(item);
        } else {
            throw new Error(`Cannot serialize a ${type}`);
        }
        this.chunks = [];
        this.serializeItem(item, 0);
        return this.chunks.join('').trim();
    }

    serializeItem (item, level) {
        switch (getType(item)) {
            case 'DOCUMENT':
                this.serializeDocument(item);
                break;
            case 'DECLARATION':
            case 'PI':
                this.serializePI(item, level);
                break;
            case 'DOCTYPE':
                this.serializeDoctype(item);
                break;
            case 'ELEMENT':
                this.serializeElement(item, level);
                break;
            case 'CDATA':
                this.serializeCDATA(item, level);
                break;
            case 'TEXT':
                this.serializeText(item);
                break;
        }
    }

    serializeDocument ([, ...items]) {
        forEach(items, (item) => {
            this.serializeItem(item, 0);
            this.nl();
        });
    }

    serializePI ([name, content], level) {
        this.indent(level);
        this.append(`<${name} ${content}?>`);
    }

    serializeDoctype ([, content]) {
        this.append(`<!DOCTYPE ${content}>`);
    }

    // eslint-disable-next-line max-statements
    serializeElement (element, level) {
        const { tag, attributes, children } = destructureElement(element);
        const hasChildren = children.length !== 0;
        const hasTextChildren = some(children, isString);
        if (level !== null) {
            this.prepareForAppendTag(level);
        }
        const openTag = !isEmpty(attributes) ?
            `<${tag} ${JSMLSerializer.serializeAttributes(attributes)}${hasChildren ? '>' : ' />'}` :
            `<${tag}${hasChildren ? '>' : ' />'}`;
        this.append(openTag);
        if (level !== null && !hasTextChildren) {
            this.nl();
        }
        if (hasChildren) {
            const childrenLevel = level === null || hasTextChildren ? null : level + 1;
            forEach(children, (child) => this.serializeItem(child, childrenLevel));
            if (level !== null && !hasTextChildren) {
                this.prepareForAppendTag(level);
            }
            this.append(`</${tag}>`);
            if (level !== null) {
                this.nl();
            }
        }
    }

    serializeText (text) {
        this.append(JSMLSerializer.escapeText(text));
    }

    serializeCDATA ([, content], level) {
        this.indent(level);
        this.append(`<![CDATA[${JSMLSerializer.escapeCDATA(content)}]]>`);
    }

    prepareForAppendTag (level) {
        if (this.chunks[this.chunks.length - 1] !== '\n') {
            this.nl();
        }
        this.indent(level);
    }

    indent (level) {
        if (isNumber(this.spacesPerLevel)) {
            this.append(pad('', level * this.spacesPerLevel));
        }
    }

    nl () {
        if (isNumber(this.spacesPerLevel)) {
            this.append('\n');
        }
    }

    append (text) {
        this.chunks.push(text);
    }

}

module.exports = JSMLSerializer;
