'use strict';

const
    { JSMLHandler } = require('../../src/index.js');

describe('JSMLHandler', () => {

    let sut;
    beforeEach(() => {
        sut = new JSMLHandler();
    });

    describe('constructor()', () => {
        it('should initialize the stack', () => {
            expect(sut.stack).toBeEmptyArray();
            expect(sut.document).toEqual(['!DOCUMENT']);
        });
    });

    describe('onopentag()', () => {
        it('should push the representation of the empty element on the stack [with attributes]', () => {
            sut.onopentag('a-tag-name', { some: 'attribute' });
            expect(sut.stack).toEqual([['a-tag-name', { some: 'attribute' }]]);
        });
        it('should push the representation of the empty element on the stack [without attributes]', () => {
            sut.onopentag('a-tag-name', {});
            expect(sut.stack).toEqual([['a-tag-name']]);
        });
    });

    describe('ontext()', () => {
        it('should do nothing if the stack is empty', () => {
            sut.ontext('some text');
            expect(sut.stack).toBeEmptyArray();
        });
        it('should append the text to the top element', () => {
            sut.onopentag('a-tag-name');
            sut.ontext('some text');
            expect(sut.stack).toEqual([['a-tag-name', 'some text']]);
        });
    });

    describe('onclosetag()', () => {
        it('should pop the top element and, if the stack is empty, set the element as root', () => {
            sut.onopentag('a-tag-name', { some: 'attribute' });
            sut.onclosetag();
            expect(sut.stack).toBeEmptyArray();
            expect(sut.root).toEqual(['a-tag-name', { some: 'attribute' }]);
        });
        it('should pop the top element and, if the stack is not empty, append the element to the new top ' +
            'element', () => {
            sut.onopentag('a-tag-name', { some: 'attribute' });
            sut.onopentag('another-tag-name');
            sut.onclosetag();
            expect(sut.stack).toEqual([['a-tag-name', { some: 'attribute' }, ['another-tag-name']]]);
        });
    });

    describe('oncdatastart()', () => {
        it('should call sut.onopentag() with the special "!CDATA" tag and no attributes', () => {
            spyOn(sut, 'onopentag');
            sut.oncdatastart();
            expect(sut.onopentag).toHaveBeenCalledWith('!CDATA');
        });
    });

    describe('oncdataend()', () => {
        it('should call sut.onclosetag()', () => {
            spyOn(sut, 'onclosetag');
            sut.oncdataend();
            expect(sut.onclosetag).toHaveBeenCalledWith();
        });
    });

    describe('onprocessinginstruction()', () => {
        it('should append the PI to the document if the stack is empty', () => {
            sut.onprocessinginstruction('?a-pi', '?a-pi its content?');
            expect(sut.stack).toBeEmptyArray();
            expect(sut.document).toEqual(['!DOCUMENT', ['?a-pi', 'its content']]);
        });
        it('should append the XML declaration to the document if the stack is empty', () => {
            sut.onprocessinginstruction('?xml', '?xml its content?');
            expect(sut.stack).toBeEmptyArray();
            expect(sut.document).toEqual(['!DOCUMENT', ['?xml', 'its content']]);
        });
        it('should append the DOCTYPE to the document if the stack is empty', () => {
            sut.onprocessinginstruction('!DOCTYPE', '!DOCTYPE its content');
            expect(sut.stack).toBeEmptyArray();
            expect(sut.document).toEqual(['!DOCUMENT', ['!DOCTYPE', 'its content']]);
        });
        it('should append the PI to the stack if it is not empty', () => {
            sut.stack = ['elem'];
            sut.onprocessinginstruction('?a-pi', '?a-pi its content?');
            expect(sut.document).toEqual(['!DOCUMENT']);
            expect(sut.stack).toEqual(['elem', ['?a-pi', 'its content']]);
        });
    });

});
