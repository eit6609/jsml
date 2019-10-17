'use strict';

const
    { isEmpty, last } = require('lodash'),
    htmlparser = require('htmlparser2');

class JsonMLHandler {

    constructor () {
        this.stack = [];
    }

    onopentag (name, attributes) {
        const element = [name];
        if (!isEmpty(attributes)) {
            element.push(attributes);
        }
        this.stack.push(element);
    }

    ontext (text) {
        last(this.stack).push(text);
    }

    onclosetag () {
        const element = this.stack.pop();
        if (this.stack.length !== 0) {
            last(this.stack).push(element);
        } else {
            this.root = element;
        }
    }

}

class JsonMLParser {
    parse (xml) {
        const handler = new JsonMLHandler();
        const parser = new htmlparser.Parser(handler);
        parser.write(xml.trim());
        parser.end();
        return handler.root;
    }
}

module.exports = JsonMLParser;
