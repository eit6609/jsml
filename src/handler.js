'use strict';

const
    { isEmpty, last } = require('lodash');

class JSMLHandler {

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

    oncdatastart () {
        this.onopentag('!CDATA');
    }

    oncdataend () {
        this.onclosetag();
    }

}

module.exports = JSMLHandler;
