'use strict';

const
    fs = require('fs'),
    { forEach } = require('lodash'),
    iconv = require('iconv-lite'),
    { JSMLSerializer } = require('../../src/index.js');

const FILENAME = 'spec/fixtures/temp.xml';

describe('JSMLSerializer', () => {

    describe('static escapeAttributeValue()', () => {
        it('should replace `&`, `<`, `"`, `\'` with the right character entities', () => {
            const input = '-&-<->-"-\'-';
            const output = JSMLSerializer.escapeAttributeValue(input);
            expect(output).toBe('-&amp;-&lt;->-&quot;-&apos;-');
        });
    });

    describe('static escapeText()', () => {
        it('should replace `&`, `<` with the right character entities', () => {
            const input = '-&-<->-"-\'-';
            const output = JSMLSerializer.escapeText(input);
            expect(output).toBe('-&amp;-&lt;->-"-\'-');
        });
    });

    describe('static escapeCDATA()', () => {
        it('should replace `]]>` with `]]]]><![CDATA[>`, creating two joined CDATAs', () => {
            const input = '-&-<->-"-\'-]]>-';
            const output = JSMLSerializer.escapeCDATA(input);
            expect(output).toBe('-&-<->-"-\'-]]]]><![CDATA[>-');
        });
    });

    describe('static serializeAttributes()', () => {
        it('should create the attribute list with the required escaping', () => {
            const input = {
                name1: 'val&1',
                name2: '<val2>',
                name3: '\'val3"',
            };
            const output = JSMLSerializer.serializeAttributes(input);
            expect(output).toBe('name1="val&amp;1" name2="&lt;val2>" name3="&apos;val3&quot;"');
        });
    });

    describe('constructor()', () => {
        it('should store nothing with undefined options', () => {
            const sut = new JSMLSerializer();
            expect(sut.spacesPerLevel).toBeUndefined();
        });
        it('should store the non empty options', () => {
            const sut = new JSMLSerializer({ spacesPerLevel: 4 });
            expect(sut.spacesPerLevel).toBe(4);
        });
        it('should throw if the options are not valid', () => {
            try {
                new JSMLSerializer({ spacesPerLevel: 'no' });
            } catch (error) {
                expect(error.message).toBe('spacesPerLevel must be a number');
            }
        });
    });

    describe('save()', () => {
        it('should call serialize() with the right parameters and synchronously write the result' +
            'write to the file with the given name using the default encoding: utf8', () => {
            const sut = new JSMLSerializer();
            const jsml = 'jsml - à';
            const result = 'result';
            spyOn(sut, 'serialize').and.returnValue(result);
            sut.save(jsml, FILENAME);
            expect(sut.serialize).toHaveBeenCalledWith(jsml);
            const fileContent = iconv.decode(fs.readFileSync(FILENAME), 'utf8');
            expect(fileContent).toBe(result);
        });
        it('should call serialize() with the right parameters and synchronously write the result' +
            'write to the file with the given name using the given encoding', () => {
            const sut = new JSMLSerializer();
            const jsml = 'jsml - à';
            const result = 'result';
            spyOn(sut, 'serialize').and.returnValue(result);
            sut.save(jsml, FILENAME, 'ISO-8859-1');
            expect(sut.serialize).toHaveBeenCalledWith(jsml);
            const fileContent = iconv.decode(fs.readFileSync(FILENAME), 'ISO-8859-1');
            expect(fileContent).toBe(result);
        });
        it('should call serialize() with the right parameters and synchronously write the result' +
            'write to the file with the given name using the encoding of the XML declaration', () => {
            const sut = new JSMLSerializer();
            const doc = [
                '!DOCUMENT',
                ['?xml', 'encoding="ISO-10646-UCS-4"'],
                ['an-element']
            ];
            const result = 'à t€xt';
            spyOn(sut, 'serialize').and.returnValue(result);
            sut.save(doc, FILENAME);
            expect(sut.serialize).toHaveBeenCalledWith(doc);
            const fileContent = iconv.decode(fs.readFileSync(FILENAME), 'utf32');
            expect(fileContent).toBe(result);
        });
    });

    describe('serialize()', () => {
        it('should throw an Error if the argument is neither a jsml nor a document', () => {
            const sut = new JSMLSerializer();
            const jsml = [];
            try {
                sut.serialize(jsml);
                fail();
            } catch (error) {
                expect(error.message).toBe('Cannot serialize a UNKNOWN');
            }
        });
        it('should throw an Error if the argument is an invalid jsml', () => {
            const sut = new JSMLSerializer();
            const jsml = ['tag', []];
            try {
                sut.serialize(jsml);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML: [] is an empty array');
            }
        });
        it('should throw an Error if the argument is an invalid document', () => {
            const sut = new JSMLSerializer();
            const jsml = ['!DOCUMENT', []];
            try {
                sut.serialize(jsml);
                fail();
            } catch (error) {
                expect(error.message).toMatch(/^Invalid JSML document/);
            }
        });
        it('should call serializeItem()', () => {
            const sut = new JSMLSerializer();
            spyOn(sut, 'serializeItem');
            const doc = ['!DOCUMENT', ['root']];
            sut.serialize(doc);
            expect(sut.serializeItem).toHaveBeenCalledWith(doc, 0);
        });
    });

    describe('serializeDocument()', () => {
        it('should call serializeItem() and nl() for all its items', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'serializeItem');
            spyOn(sut, 'nl');
            sut.serializeDocument(['!DOCUMENT', 1, 2, 3]);
            forEach([1, 2, 3], (item) => {
                expect(sut.serializeItem).toHaveBeenCalledWith(item, 0);
            });
            expect(sut.nl).toHaveBeenCalledTimes(3);
        });
    });

    describe('serializeItem()', () => {
        it('should call serializeDocument() if the item type is DOCUMENT', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'serializeDocument');
            sut.serializeItem(['!DOCUMENT'], 'level');
            expect(sut.serializeDocument).toHaveBeenCalledWith(['!DOCUMENT']);
        });
        it('should call serializePI() if the item type is DECLARATION', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'serializePI');
            sut.serializeItem(['?xml'], 'level');
            expect(sut.serializePI).toHaveBeenCalledWith(['?xml'], 'level');
        });
        it('should call serializePI() if the item type is PI', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'serializePI');
            sut.serializeItem(['?xml-stylesheet'], 'level');
            expect(sut.serializePI).toHaveBeenCalledWith(['?xml-stylesheet'], 'level');
        });
        it('should call serializeDoctype() if the item type is DOCTYPE', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'serializeDoctype');
            sut.serializeItem(['!DOCTYPE'], 'level');
            expect(sut.serializeDoctype).toHaveBeenCalledWith(['!DOCTYPE']);
        });
        it('should call serializeElement() if the item type is ELEMENT', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'serializeElement');
            sut.serializeItem(['html'], 'level');
            expect(sut.serializeElement).toHaveBeenCalledWith(['html'], 'level');
        });
        it('should call serializeCDATA() if the item type is CDATA', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'serializeCDATA');
            sut.serializeItem(['!CDATA'], 'level');
            expect(sut.serializeCDATA).toHaveBeenCalledWith(['!CDATA'], 'level');
        });
        it('should call serializeText() if the item type is TEXT', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'serializeText');
            sut.serializeItem('a text', 'level');
            expect(sut.serializeText).toHaveBeenCalledWith('a text');
        });
    });

    describe('serializePI()', () => {
        it('should call indent() and append() with the right parameters', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'indent');
            spyOn(sut, 'append');
            sut.serializePI(['?xml-stylesheet', 't&xt'], 'level');
            expect(sut.indent).toHaveBeenCalledWith('level');
            expect(sut.append).toHaveBeenCalledWith('<?xml-stylesheet t&xt?>');
        });
    });

    describe('serializeDoctype()', () => {
        it('should call append() with the right parameters', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'append');
            sut.serializeDoctype(['!DOCTYPE', 't&xt']);
            expect(sut.append).toHaveBeenCalledWith('<!DOCTYPE t&xt>');
        });
    });

    describe('serializeElement()', () => {
        it('should call prepareForAppendTag(), append(), nl() if level is not null', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'prepareForAppendTag');
            spyOn(sut, 'append');
            spyOn(sut, 'nl');
            sut.serializeElement(['p'], 'level');
            expect(sut.prepareForAppendTag).toHaveBeenCalledWith('level');
            expect(sut.append).toHaveBeenCalledWith('<p />');
            expect(sut.nl).toHaveBeenCalledWith();
        });
        it('should call only append() if level is null', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'prepareForAppendTag');
            spyOn(sut, 'append');
            spyOn(sut, 'nl');
            sut.serializeElement(['span'], null);
            expect(sut.prepareForAppendTag).not.toHaveBeenCalled();
            expect(sut.append).toHaveBeenCalledWith('<span />');
            expect(sut.nl).not.toHaveBeenCalled();
        });
        it('should call prepareForAppendTag(), append(), nl(), serializeItem() if level is not null', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'prepareForAppendTag');
            spyOn(sut, 'append');
            spyOn(sut, 'nl');
            spyOn(sut, 'serializeItem');
            sut.serializeElement(['p', { class: 'special' }, ['one'], ['two'], ['three']], 3);
            expect(sut.prepareForAppendTag).toHaveBeenCalledWith(3);
            expect(sut.prepareForAppendTag).toHaveBeenCalledTimes(2);
            expect(sut.append).toHaveBeenCalledWith('<p class="special">');
            expect(sut.append).toHaveBeenCalledWith('</p>');
            forEach([['one'], ['two'], ['three']], (item) => {
                expect(sut.serializeItem).toHaveBeenCalledWith(item, 4);
            });
            expect(sut.nl).toHaveBeenCalledWith();
            expect(sut.nl).toHaveBeenCalledTimes(2);
        });
        it('should call prepareForAppendTag(), append(), nl(), serializeItem() if level is not null [when there is ' +
            'at least a text child]', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'prepareForAppendTag');
            spyOn(sut, 'append');
            spyOn(sut, 'nl');
            spyOn(sut, 'serializeItem');
            sut.serializeElement(['p', { class: 'special' }, ['one'], 'two', ['three']], 3);
            expect(sut.prepareForAppendTag).toHaveBeenCalledWith(3);
            expect(sut.prepareForAppendTag).toHaveBeenCalledTimes(1);
            expect(sut.append).toHaveBeenCalledWith('<p class="special">');
            expect(sut.append).toHaveBeenCalledWith('</p>');
            forEach([['one'], 'two', ['three']], (item) => {
                expect(sut.serializeItem).toHaveBeenCalledWith(item, null);
            });
            expect(sut.nl).toHaveBeenCalledWith();
            expect(sut.nl).toHaveBeenCalledTimes(1);
        });
        it('should call only append() and serializeItem() if level is null', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'prepareForAppendTag');
            spyOn(sut, 'append');
            spyOn(sut, 'nl');
            spyOn(sut, 'serializeItem');
            sut.serializeElement(['p', { class: 'special' }, ['one'], ['two'], ['three']], null);
            expect(sut.prepareForAppendTag).not.toHaveBeenCalled();
            expect(sut.append).toHaveBeenCalledWith('<p class="special">');
            expect(sut.append).toHaveBeenCalledWith('</p>');
            forEach([['one'], ['two'], ['three']], (item) => {
                expect(sut.serializeItem).toHaveBeenCalledWith(item, null);
            });
            expect(sut.nl).not.toHaveBeenCalled();
        });
    });

    describe('serializeText()', () => {
        it('should call append() with the right parameters', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'append');
            sut.serializeText('t&xt');
            expect(sut.append).toHaveBeenCalledWith('t&amp;xt');
        });
    });

    describe('serializeCDATA()', () => {
        it('should call indent() and append() with the right parameters', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'indent');
            spyOn(sut, 'append');
            sut.serializeCDATA(['!CDATA', '<text>'], 'level');
            expect(sut.indent).toHaveBeenCalledWith('level');
            expect(sut.append).toHaveBeenCalledWith('<![CDATA[<text>]]>');
        });
    });

    describe('prepareForAppendTag()', () => {
        it('should call nl() and indent() if the last chunk is not a newline', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            spyOn(sut, 'nl');
            spyOn(sut, 'indent');
            sut.prepareForAppendTag('level');
            expect(sut.nl).toHaveBeenCalledWith();
            expect(sut.indent).toHaveBeenCalledWith('level');
        });
        it('should call indent() if the last chunk is a newline', () => {
            const sut = new JSMLSerializer();
            sut.chunks = ['\n'];
            spyOn(sut, 'nl');
            spyOn(sut, 'indent');
            sut.prepareForAppendTag('level');
            expect(sut.nl).not.toHaveBeenCalled();
            expect(sut.indent).toHaveBeenCalledWith('level');
        });
    });

    describe('indent()', () => {
        it('should append this.spacesPerLevel * level blanks if this.spacesPerLevel is not nil', () => {
            const sut = new JSMLSerializer({ spacesPerLevel: 4 });
            sut.chunks = [];
            sut.indent(3);
            expect(sut.chunks).toEqual(['            ']);
        });
        it('should not do anything if this.spacesPerLevel is nil', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            sut.indent(4);
            expect(sut.chunks).toEqual([]);
        });
    });

    describe('nl()', () => {
        it('should append `\\n` if this.spacesPerLevel is not nil', () => {
            const sut = new JSMLSerializer({ spacesPerLevel: 0 });
            sut.chunks = [];
            sut.nl();
            expect(sut.chunks).toEqual(['\n']);
        });
        it('should not do anything if this.spacesPerLevel is nil', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            sut.nl();
            expect(sut.chunks).toEqual([]);
        });
    });

    describe('append()', () => {
        it('should append the argument to this.chunks', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            sut.append('hello');
            sut.append('goodbye');
            expect(sut.chunks).toEqual(['hello', 'goodbye']);
        });
    });

});
