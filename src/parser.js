'use strict';

const
    { assign } = require('lodash'),
    fs = require('fs'),
    JSMLHandler = require('./handler.js'),
    htmlparser = require('htmlparser2');

class JSMLParser {

    parseString (xml, options) {
        const handler = new JSMLHandler();
        const parser = new htmlparser.Parser(handler, assign(options || {}, { xmlMode: true, decodeEntities: true }));
        parser.write(xml);
        parser.end();
        return handler.root;
    }

    parseFile (filename, options) {
        const xml = fs.readFileSync(filename, 'utf8');
        return this.parseString(xml, options);
    }

}

module.exports = JSMLParser;
