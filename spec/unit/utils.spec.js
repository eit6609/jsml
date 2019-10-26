'use strict';

const {
        JSMLUtils: { validateElement, validateJSML, getTag, getAttributes, getChildren, getChildrenStartIndex }
    } = require('../../src/index.js'),
    { JSMLUtils } = require('../../src/index.js');

describe('JSMLUtils', () => {

    describe('validateJSML()', () => {
        it('should throw if the argument is neither an array nor a string', () => {
            try {
                validateJSML(9);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML: 9 is neither an array nor a string');
            }
        });
        it('should throw if the argument is an empty array', () => {
            try {
                validateJSML([]);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML: [] is an empty array');
            }
        });
        it('should throw if the argument is an array with a non string as first item', () => {
            try {
                validateJSML([9]);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML: first item 9 is not a string');
            }
        });
        it('should throw if the argument is an array with an empty string as first item', () => {
            try {
                validateJSML(['']);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML: first item \'\' is the empty string');
            }
        });
        it('should throw if the tag is not a valid XML name [because of illegal characters]', () => {
            try {
                validateJSML(['not valid']);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML: the string \'not valid\', is not a valid XML name');
            }
        });
        it('should throw if the tag is not a valid XML name [because it starts with `xml`]', () => {
            try {
                validateJSML(['xmlnotvalid']);
                fail();
            } catch (error) {
                expect(error.message)
                    .toBe('Invalid JSML: the name \'xmlnotvalid\', is not valid because it starts with \'XML\'');
            }
        });
        it('should throw if the argument has attributes with non string values', () => {
            try {
                validateJSML(['ns:tag', { number: 9 }]);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML: the value of attribute \'number\', 9, is not a string');
            }
        });
        it('should throw if the argument has attributes with an invalid XML name [because of illegal ' +
            'characters]', () => {
            try {
                validateJSML(['tag', { '!CDATA': 'val' }]);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML: the string \'!CDATA\', is not a valid XML name');
            }
        });
        it('should throw if the argument has attributes with an invalid XML name [because it starts with ' +
            '`xml`]', () => {
            try {
                validateJSML(['tag', { xml: 'true' }]);
                fail();
            } catch (error) {
                expect(error.message)
                    .toBe('Invalid JSML: the name \'xml\', is not valid because it starts with \'XML\'');
            }
        });
        it('should return if the argument is a string', () => {
            validateJSML('text');
        });
        it('should return if the argument is a valid array', () => {
            validateJSML(['tag', { some: 'attributes' }, ['tag', 'child']]);
        });
    });

    describe('validateElement()', () => {
        it('should throw if the argument is not an array', () => {
            try {
                validateElement('hello');
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML element: \'hello\' is not an array');
            }
        });
        it('should throw if the argument is an empty array', () => {
            try {
                validateElement([]);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML element: [] is an empty array');
            }
        });
        it('should throw if the argument is an array with a non string as first item', () => {
            try {
                validateElement([9]);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML element: first item 9 is not a string');
            }
        });
        it('should throw if the argument is an array with an empty string as first item', () => {
            try {
                validateElement(['']);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML element: first item \'\' is the empty string');
            }
        });
        it('should return if the argument an array with a non empty string as first item', () => {
            validateElement(['tag']);
        });
    });

    describe('getTag()', () => {
        it('should call validateElement() and return the first item', () => {
            spyOn(JSMLUtils, 'validateElement');
            const element = ['p', 'text'];
            expect(getTag(element)).toBe('p');
            expect(JSMLUtils.validateElement).toHaveBeenCalledWith(element);
        });
    });

    describe('getAttributes()', () => {
        it('should call validateElement() and return undefined if there is no second item', () => {
            spyOn(JSMLUtils, 'validateElement');
            const element = ['p'];
            expect(getAttributes(element)).toBeUndefined();
            expect(JSMLUtils.validateElement).toHaveBeenCalledWith(element);
        });
        it('should call validateElement() and return undefined if the second item is not an object', () => {
            spyOn(JSMLUtils, 'validateElement');
            const element = ['p', 'text'];
            expect(getAttributes(element)).toBeUndefined();
            expect(JSMLUtils.validateElement).toHaveBeenCalledWith(element);
        });
        it('should call validateElement() and return the second item if it is an object', () => {
            spyOn(JSMLUtils, 'validateElement');
            const element = ['p', { class: 'first' }, 'text'];
            expect(getAttributes(element)).toEqual({ class: 'first' });
            expect(JSMLUtils.validateElement).toHaveBeenCalledWith(element);
        });
    });

    describe('getChildren()', () => {
        it('should call validateElement() and return [] if there is no second item', () => {
            spyOn(JSMLUtils, 'validateElement');
            const element = ['p'];
            expect(getChildren(element)).toEqual([]);
            expect(JSMLUtils.validateElement).toHaveBeenCalledWith(element);
        });
        it('should call validateElement() and return [] if the second item is an object and there is no third ' +
            'item', () => {
            spyOn(JSMLUtils, 'validateElement');
            const element = ['p', { class: 'first' }];
            expect(getChildren(element)).toEqual([]);
            expect(JSMLUtils.validateElement).toHaveBeenCalledWith(element);
        });
        it('should call validateElement() and return a slice from the second item if it is not an object', () => {
            spyOn(JSMLUtils, 'validateElement');
            const element = ['p', 'child1', 'child2'];
            expect(getChildren(element)).toEqual(['child1', 'child2']);
            expect(JSMLUtils.validateElement).toHaveBeenCalledWith(element);
        });
        it('should call validateElement() and return a slice from the third item if the second is an object', () => {
            spyOn(JSMLUtils, 'validateElement');
            const element = ['p', { class: 'first' }, 'child1', 'child2'];
            expect(getChildren(element)).toEqual(['child1', 'child2']);
            expect(JSMLUtils.validateElement).toHaveBeenCalledWith(element);
        });
    });

    describe('getChildrenStartIndex()', () => {
        it('should call validateElement() and return 1 if there is no second item', () => {
            spyOn(JSMLUtils, 'validateElement');
            const element = ['p'];
            expect(getChildrenStartIndex(element)).toBe(1);
            expect(JSMLUtils.validateElement).toHaveBeenCalledWith(element);
        });
        it('should call validateElement() and return 2 if the second item is an object', () => {
            spyOn(JSMLUtils, 'validateElement');
            const element = ['p', { class: 'first' }];
            expect(getChildrenStartIndex(element)).toBe(2);
            expect(JSMLUtils.validateElement).toHaveBeenCalledWith(element);
        });
    });

});
