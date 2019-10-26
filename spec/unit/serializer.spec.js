'use strict';

const
    fs = require('fs'),
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
        it('should store the options with default values', () => {
            const sut = new JSMLSerializer();
            expect(sut.newline).toBeFalse();
            expect(sut.appendDeclaration).toBeFalse();
            expect(sut.docType).toBeUndefined();
        });
        it('should store the options with explicit values', () => {
            const sut = new JSMLSerializer({
                newline: true,
                appendDeclaration: true,
                docType: 'doctype'
            });
            expect(sut.newline).toBeTrue();
            expect(sut.appendDeclaration).toBeTrue();
            expect(sut.docType).toBe('doctype');
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

    describe('nl()', () => {
        it('should append `\\n` if this.newline is `true`', () => {
            const sut = new JSMLSerializer({ newline: true });
            sut.chunks = [];
            sut.nl();
            expect(sut.chunks).toEqual(['\n']);
        });
        it('should not do anything if this.newline is `false`', () => {
            const sut = new JSMLSerializer();
            sut.chunks = [];
            sut.nl();
            expect(sut.chunks).toEqual([]);
        });
    });

    describe('serialize()', () => {
        it('should throw an Error if the jsml is invalid', () => {
            const sut = new JSMLSerializer();
            const jsml = [];
            try {
                sut.serialize(jsml);
                fail();
            } catch (error) {
                expect(error.message).toBe('Invalid JSML: [] is an empty array');
            }
        });
        it('should append the expected prologue and then call serializeRecursive() with the right parameters and ' +
            'then return this.chunks joined by \'\' [with appendDeclaration, docType]', () => {
            const sut = new JSMLSerializer({ appendDeclaration: true, docType: 'a-doc-type' });
            const jsml = 'jsml';
            spyOn(sut, 'serializeRecursive');
            spyOn(sut, 'append').and.callThrough();
            spyOn(sut, 'nl').and.callThrough();
            const result = sut.serialize(jsml);
            expect(result).toBe(sut.chunks.join(''));
            expect(sut.append).toHaveBeenCalledWith('<?xml version="1.0" encoding="utf-8"?>');
            expect(sut.append).toHaveBeenCalledWith('a-doc-type');
            expect(sut.nl).toHaveBeenCalledWith();
            expect(sut.nl).toHaveBeenCalledTimes(2);
            expect(sut.serializeRecursive).toHaveBeenCalledWith(jsml);
        });
        it('should append the expected prologue and then call serializeRecursive() with the right parameters and ' +
            'then return this.chunks joined by \'\' [with appendDeclaration]', () => {
            const sut = new JSMLSerializer({ appendDeclaration: true });
            const jsml = 'jsml';
            spyOn(sut, 'serializeRecursive');
            spyOn(sut, 'append').and.callThrough();
            spyOn(sut, 'nl').and.callThrough();
            const result = sut.serialize(jsml);
            expect(result).toBe(sut.chunks.join(''));
            expect(sut.append).toHaveBeenCalledWith('<?xml version="1.0" encoding="utf-8"?>');
            expect(sut.nl).toHaveBeenCalledWith();
            expect(sut.nl).toHaveBeenCalledTimes(1);
            expect(sut.serializeRecursive).toHaveBeenCalledWith(jsml);
        });
        it('should append the expected prologue and then call serializeRecursive() with the right parameters and ' +
            'then return this.chunks joined by \'\' [with no options]', () => {
            const sut = new JSMLSerializer();
            const jsml = 'jsml';
            spyOn(sut, 'serializeRecursive');
            spyOn(sut, 'append').and.callThrough();
            spyOn(sut, 'nl').and.callThrough();
            const result = sut.serialize(jsml);
            expect(result).toBe(sut.chunks.join(''));
            expect(sut.nl).not.toHaveBeenCalled();
            expect(sut.serializeRecursive).toHaveBeenCalledWith(jsml);
        });
    });

    describe('save()', () => {
        it('should open the file with the given name, call serialize() with the right parameters and synchronously ' +
            'write to the file the result of serialize()', () => {
            const sut = new JSMLSerializer();
            const jsml = 'jsml';
            const result = 'result';
            spyOn(sut, 'serialize').and.returnValue(result);
            sut.save(jsml, FILENAME);
            expect(sut.serialize).toHaveBeenCalledWith(jsml);
            const fileContent = fs.readFileSync(FILENAME, 'utf8');
            expect(fileContent).toBe(result);
        });
    });

});
