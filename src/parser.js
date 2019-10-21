'use strict';

const
    { assign } = require('lodash'),
    fs = require('fs'),
    JSMLHandler = require('./handler.js'),
    htmlparser = require('htmlparser2');

class JSMLParser {

    constructor (options) {
        this.options = options;
    }

    parseString (xml) {
        const handler = new JSMLHandler();
        const parser = new htmlparser.Parser(
            handler,
            assign(this.options || {}, { xmlMode: true, decodeEntities: true })
        );
        parser.write(xml);
        parser.end();
        return handler.root;
    }

    parseFile (filename) {
        const xml = fs.readFileSync(filename, 'utf8');
        return this.parseString(xml);
    }

}

module.exports = JSMLParser;
