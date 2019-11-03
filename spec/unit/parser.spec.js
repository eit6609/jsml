'use strict';

const
    fs = require('fs'),
    { JSMLParser } = require('../../src/index.js');

const
    FILENAME_ASCII = 'spec/fixtures/test-ascii.xml',
    FILENAME_UTF8 = 'spec/fixtures/test-utf8.xml';

describe('JSMLParser', () => {

    let options, sut;
    beforeEach(() => {
        options = { another: 'option' };
        sut = new JSMLParser(options);
    });

    describe('constructor()', () => {
        it('should store the argument', () => {
            expect(sut.options).toBe(options);
        });
    });

    describe('parseString()', () => {
        const handler = {
            getResult () {
                return 'this is the result';
            }
        };
        let parser;
        class Parser {
            constructor (handler, options) {
                this.handler = handler;
                this.options = options;
                parser = this;
                spyOn(this, 'write');
                spyOn(this, 'end');
            }
            write () {
            }
            end () {
            }
        }
        const xml = 'xml';
        it('should create a handler and a parser with the expected options, then call parser.write() and ' +
            'parser.end(), then return handler.getResult()', () => {
            const result = sut.parseString(xml, handler, Parser);
            expect(parser.handler).toBe(handler);
            expect(parser.options).toEqual({
                xmlMode: true,
                decodeEntities: true,
                another: 'option'
            });
            expect(result).toBe('this is the result');
            expect(parser.write).toHaveBeenCalledWith(xml);
            expect(parser.end).toHaveBeenCalledWith();
        });
        it('should ovveride the options with xmlMode = `true` and decodeEntities = `true`', () => {
            sut = new JSMLParser({ xmlMode: false, decodeEntities: false });
            sut.parseString(xml, handler, Parser);
            expect(parser.options).toEqual({
                xmlMode: true,
                decodeEntities: true,
            });
        });
    });

    describe('parseFile()', () => {
        it('should open the file with the given name and encoding, sychronously read all its content and call ' +
            'sut.parseString() with the content', () => {
            spyOn(sut, 'parseString').and.returnValue('result');
            const xml = fs.readFileSync(FILENAME_ASCII, 'ascii');
            const result = sut.parseFile(FILENAME_ASCII, 'ascii');
            expect(result).toBe('result');
            expect(sut.parseString).toHaveBeenCalledWith(xml);
        });
        it('should open the file with the given name, sychronously read all its content with utf8 encoding and call ' +
            'sut.parseString() with the content', () => {
            spyOn(sut, 'parseString').and.returnValue('result');
            const xml = fs.readFileSync(FILENAME_UTF8, 'utf8');
            const result = sut.parseFile(FILENAME_UTF8);
            expect(result).toBe('result');
            expect(sut.parseString).toHaveBeenCalledWith(xml);
        });
    });

});
