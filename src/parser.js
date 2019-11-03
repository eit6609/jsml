'use strict';

const
    { assign } = require('lodash'),
    fs = require('fs'),
    htmlparser = require('htmlparser2'),
    iconv = require('iconv-lite'),
    JSMLHandler = require('./handler.js');

class JSMLParser {

    constructor (options) {
        this.options = options;
    }

    parseString (xml, handler, ParserConstructor) {
        handler = handler || new JSMLHandler();
        ParserConstructor = ParserConstructor || htmlparser.Parser;
        const parser = new ParserConstructor(
            handler,
            assign(this.options || {}, { xmlMode: true, decodeEntities: true })
        );
        parser.write(xml);
        parser.end();
        return handler.getResult();
    }

    parseFile (filename, encoding = 'utf8') {
        const xml = iconv.decode(fs.readFileSync(filename), encoding);
        return this.parseString(xml);
    }

}

module.exports = JSMLParser;
