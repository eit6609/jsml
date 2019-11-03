'use strict';

const {
        JSMLUtils: {
            getEncoding,
            validateElementName,
            validatePITarget,
            validateAttributeName,
            validateJSML,
            validateDocument,
            xmlDeclaration,
            docType,
            processingInstruction,
            cdata,
            isElementName,
            getType,
            getRoot,
            destructureElement,
            getTag,
            getAttributes,
            getChildren,
            getChildrenStartIndex
        }
    } = require('../../src/index.js'),
    { JSMLUtils } = require('../../src/index.js');

describe('JSMLUtils', () => {

    describe('getEncoding()', () => {
        it('should return undefined if the declaration does not contain the encoding', () => {
            expect(getEncoding(['?xml', ''])).toBeUndefined();
        });
        it('should return the encoding', () => {
            expect(getEncoding(['?xml', 'encoding="enc"'])).toBe('enc');
        });
        it('should translate the ISO-10646-UCS-2 encoding to utf16', () => {
            expect(getEncoding(['?xml', 'encoding="ISO-10646-UCS-2"'])).toBe('utf16');
        });
        it('should translate the ISO-10646-UCS-4 encoding to utf32', () => {
            expect(getEncoding(['?xml', 'encoding="ISO-10646-UCS-4"'])).toBe('utf32');
        });
    });

    describe('validateElementName()', () => {
        it('should throw if the argument does not match the regexp', () => {
            try {
                validateElementName('12');
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML: the string \'12\', is not a valid element name');
            }
        });
        it('should throw if the argument begins with the reserved prefix `XML`', () => {
            try {
                validateElementName('XmLElement');
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML: the element name \'XmLElement\' is not valid because ' +
                    'it starts with \'xml\'');
            }
        });
        it('should accept the names that match the regexp and do not start with `xml`', () => {
            validateElementName('div');
        });
        it('should accept the special names `?xml` and `!CDATA`', () => {
            validateElementName('?xml');
            validateElementName('!CDATA');
        });
        it('should call validatePITarget() if the arguments starts with `?`', () => {
            spyOn(JSMLUtils, 'validatePITarget');
            validateElementName('?xml-stylesheet');
            expect(JSMLUtils.validatePITarget).toHaveBeenCalledWith('xml-stylesheet');
        });
    });

    describe('validatePITarget()', () => {
        it('should throw if the argument does not match the regexp', () => {
            try {
                validatePITarget('hello!');
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML: the string \'hello!\', is not a valid PI target');
            }
        });
        it('should accept the names that match the regexp', () => {
            validatePITarget('xml-pi');
        });
    });

    describe('validateAttributeName()', () => {
        it('should throw if the argument does not match the regexp', () => {
            try {
                validateAttributeName('hello?');
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML: the string \'hello?\', is not a valid attribute name');
            }
        });
        it('should accept the names that match the regexp', () => {
            validateAttributeName('xmlns');
        });
    });

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
                expect(error.message).toBe('Invalid JSML: the string \'not valid\', is not a valid element name');
            }
        });
        it('should throw if the tag is not a valid XML name [because it starts with `xml`]', () => {
            try {
                validateJSML(['xmlnotvalid']);
                fail();
            } catch (error) {
                expect(error.message)
                    .toBe('Invalid JSML: the element name \'xmlnotvalid\' is not valid because it starts with \'xml\'');
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
                expect(error.message).toBe('Invalid JSML: the string \'!CDATA\', is not a valid attribute name');
            }
        });
        it('should return if the argument is a string', () => {
            validateJSML('text');
        });
        it('should return if the argument is a valid array', () => {
            validateJSML(['tag', { some: 'attributes' }, ['tag', 'child']]);
        });
    });

    describe('validateDocument()', () => {
        it('should accept a document with only the root element and whitespace', () => {
            validateDocument(['!DOCUMENT', '\t', ['tag'], '\n']);
        });
        it('should accept a document with declaration, root element and whitespace', () => {
            validateDocument(['!DOCUMENT', ['?xml'], '\n', ['tag'], '\n']);
        });
        it('should accept a document with declaration, doctype, root element and whitespace', () => {
            validateDocument(['!DOCUMENT', ['?xml'], ['!DOCTYPE'], ['tag'], '\n']);
        });
        it('should accept a document with declaration, doctype, PI, root element and whitespace', () => {
            validateDocument(['!DOCUMENT', ['?xml'], ['?hello'], ['!DOCTYPE'], ['tag'], '\n']);
        });
        it('should throw if the argument type is not `DOCUMENT`', () => {
            try {
                validateDocument(['tag']);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML document: it is a ELEMENT');
            }
        });
        it('should throw if it contains children that are not declarations, doctypes, pis, elements, ' +
            'whitespaces', () => {
            try {
                validateDocument(['!DOCUMENT', ['elem'], 'a text here!']);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML document: only whitespace text is allowed at its level');
            }
        });
        it('should throw if there is no root element', () => {
            try {
                validateDocument(['!DOCUMENT']);
                fail();
            } catch (error) {
                expect(error.message).toMatch(/^Invalid JSML document: it does not match/);
            }
        });
        it('should throw if the order: declaration, doctype, root element is not respected', () => {
            try {
                validateDocument(['!DOCUMENT'], ['tag'], ['?xml'], '!DOCTYPE');
                fail();
            } catch (error) {
                expect(error.message).toMatch(/^Invalid JSML document: it does not match/);
            }
        });
    });

    describe('xmlDeclaration()', () => {
        it('should return a declaration with utf-8 encoding if no encoding is provided', () => {
            expect(xmlDeclaration()).toEqual(['?xml', 'version="1.0" encoding="utf-8"']);
        });
        it('should return a declaration with the provided encoding', () => {
            expect(xmlDeclaration('enc')).toEqual(['?xml', 'version="1.0" encoding="enc"']);
        });
    });

    describe('docType()', () => {
        it('should return a !DOCTYPE with the provided content', () => {
            expect(docType('content')).toEqual(['!DOCTYPE', 'content']);
        });
    });

    describe('processingInstruction()', () => {
        it('should return a processing instruction with the provided target an', () => {
            expect(processingInstruction('target', 'content')).toEqual(['?target', 'content']);
        });
    });

    describe('cdata()', () => {
        it('should return a !CDATA with the provided content', () => {
            expect(cdata('content')).toEqual(['!CDATA', 'content']);
        });
    });

    describe('isElementName()', () => {
        it('should return true if the argument is a valid element name', () => {
            expect(isElementName('a-valid.name')).toBeTrue();
        });
        it('should return false if the argument is not a valid element name', () => {
            expect(isElementName('an invalid name')).toBeFalse();
        });
    });

    describe('getType()', () => {
        it('should return UNKNOWN if the argument is neither a string nor an array', () => {
            expect(getType(9)).toBe('UNKNOWN');
        });
        it('should return TEXT if the argument is a string', () => {
            expect(getType('hello')).toBe('TEXT');
        });
        it('should return UNKNOWN if the argument is an array starting with a non-string item', () => {
            expect(getType([99])).toBe('UNKNOWN');
        });
        it('should return UNKNOWN if the argument is an array starting with an unknown item', () => {
            expect(getType([' '])).toBe('UNKNOWN');
        });
        it('should return ELEMENT if the argument is an array starting with a legal element name', () => {
            expect(getType(['hello'])).toBe('ELEMENT');
        });
        it('should return DOCUMENT if the argument is an array starting with `!DOCUMENT`', () => {
            expect(getType(['!DOCUMENT'])).toBe('DOCUMENT');
        });
        it('should return DOCTYPE if the argument is an array starting with `!DOCTYPE`', () => {
            expect(getType(['!DOCTYPE'])).toBe('DOCTYPE');
        });
        it('should return CDATA if the argument is an array starting with `!CDATA`', () => {
            expect(getType(['!CDATA'])).toBe('CDATA');
        });
        it('should return DECLARATION if the argument is an array starting with `?xml`', () => {
            expect(getType(['?xml'])).toBe('DECLARATION');
        });
        it('should return PI if the argument is an array starting with `?`', () => {
            expect(getType(['?xml-stylesheet'])).toBe('PI');
        });
    });

    describe('getRoot()', () => {
        it('should return undefined if there is no root', () => {
            expect(getRoot([])).toBeUndefined();
        });
        it('should return the first element', () => {
            expect(getRoot(['no', 'no', ['yes']])).toEqual(['yes']);
        });
    });

    describe('destructureElement()', () => {
        it('should return an object with tag, no attributes and no children', () => {
            expect(destructureElement(['tag'])).toEqual({ tag: 'tag', attributes: undefined, children: [] });
        });
        it('should return an object with tag, attributes and no children', () => {
            expect(destructureElement(['tag', { an: 'attribute' }]))
                .toEqual({ tag: 'tag', attributes: { an: 'attribute' }, children: [] });
        });
        it('should return an object with tag, attributes and children', () => {
            expect(destructureElement(['tag', { an: 'attribute' }, 'my', 'children']))
                .toEqual({ tag: 'tag', attributes: { an: 'attribute' }, children: ['my', 'children'] });
        });
    });

    describe('getTag()', () => {
        it('should call validateElement() and return the first item', () => {
            const element = ['p', 'text'];
            expect(getTag(element)).toBe('p');
        });
    });

    describe('getAttributes()', () => {
        it('should return undefined if there is no second item', () => {
            const element = ['p'];
            expect(getAttributes(element)).toBeUndefined();
        });
        it('should return undefined if the second item is not an object', () => {
            const element = ['p', 'text'];
            expect(getAttributes(element)).toBeUndefined();
        });
        it('should return the second item if it is an object', () => {
            const element = ['p', { class: 'first' }, 'text'];
            expect(getAttributes(element)).toEqual({ class: 'first' });
        });
    });

    describe('getChildren()', () => {
        it('should return [] if there is no second item', () => {
            const element = ['p'];
            expect(getChildren(element)).toEqual([]);
        });
        it('should return [] if the second item is an object and there is no third ' +
            'item', () => {
            const element = ['p', { class: 'first' }];
            expect(getChildren(element)).toEqual([]);
        });
        it('should return a slice from the second item if it is not an object', () => {
            const element = ['p', 'child1', 'child2'];
            expect(getChildren(element)).toEqual(['child1', 'child2']);
        });
        it('should return a slice from the third item if the second is an object', () => {
            const element = ['p', { class: 'first' }, 'child1', 'child2'];
            expect(getChildren(element)).toEqual(['child1', 'child2']);
        });
    });

    describe('getChildrenStartIndex()', () => {
        it('should return 1 if there is no second item', () => {
            const element = ['p'];
            expect(getChildrenStartIndex(element)).toBe(1);
        });
        it('should return 2 if the second item is an object', () => {
            const element = ['p', { class: 'first' }];
            expect(getChildrenStartIndex(element)).toBe(2);
        });
    });

});
