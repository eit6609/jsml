'use strict';

const
    { isEmpty, last } = require('lodash');

class JSMLHandler {

    constructor () {
        this.document = ['!DOCUMENT'];
        this.stack = [];
    }

    onopentag (name, attributes = {}) {
        const element = [name];
        if (!isEmpty(attributes)) {
            element.push(attributes);
        }
        this.stack.push(element);
    }

    ontext (text) {
        if (isEmpty(this.stack)) {
            return;
        }
        last(this.stack).push(text);
    }

    onclosetag () {
        const element = this.stack.pop();
        if (this.stack.length !== 0) {
            last(this.stack).push(element);
        } else {
            this.root = element;
            this.document.push(element);
        }
    }

    oncdatastart () {
        this.onopentag('!CDATA');
    }

    oncdataend () {
        this.onclosetag();
    }

    onprocessinginstruction (name, text) {
        if (name.startsWith('?')) {
            text = text.substring(name.length + 1, text.length - 1);
        } else {
            text = text.substring(name.length + 1);
        }
        const target = this.stack.length !== 0 ? this.stack : this.document;
        target.push([name, text]);
    }

    getResult () {
        return this.document.length > 2 ? this.document : this.root;
    }

}

module.exports = JSMLHandler;
