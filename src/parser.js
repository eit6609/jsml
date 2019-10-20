'use strict';

const
    { assign } = require('lodash'),
    JSMLHandler = require('./handler.js'),
    htmlparser = require('htmlparser2');

class JSMLParser {
    parse (xml, options) {
        const handler = new JSMLHandler();
        const parser = new htmlparser.Parser(handler, assign(options || {}, { xmlMode: true, decodeEntities: true }));
        parser.write(xml);
        parser.end();
        return handler.root;
    }
}

module.exports = JSMLParser;
