'use strict';

const
    { JSMLParser } = require('../../src/index.js');

const
    FILENAME1 = 'spec/fixtures/test1.xml',
    FILENAME2 = 'spec/fixtures/test2.xml';

fdescribe('JSMLParser [integration]', () => {

    describe('parseString()', () => {
        it('should give the expected JSML', () => {
            const xml = `<root>
    <a-list-element attr1="value" attr2="&amp;&lt;&quot;&apos;">
        <a-flat-element attr1="val1" attr2="val2"/>
        <an-empty-element />
        <an-element-with-text and="attributes, too">this is the text</an-element-with-text>
    </a-list-element>
<![CDATA[A CDATA here, with unescaped <tags>, "quotes" & 'apostrophes']]>
</root>`;
            const expectedJSML = [
                'root',
                '\n    ',
                [
                    'a-list-element',
                    { attr1: 'value', attr2: '&<"\'' },
                    '\n        ',
                    ['a-flat-element', { attr1: 'val1', attr2: 'val2' }],
                    '\n        ',
                    ['an-empty-element'],
                    '\n        ',
                    ['an-element-with-text', { and: 'attributes, too' }, 'this is the text' ],
                    '\n    '
                ],
                '\n',
                ['!CDATA', 'A CDATA here, with unescaped <tags>, "quotes" & \'apostrophes\''],
                '\n'
            ];
            const sut = new JSMLParser();
            const jsml = sut.parseString(xml);
            expect(jsml).toEqual(expectedJSML);
        });
    });

    describe('parseFile()', () => {
        it('should give the expected JSML [with utf-8 encoding]', () => {
            const expectedDocument = [
                '!DOCUMENT',
                ['?xml', 'version="1.0" encoding="utf-8"'],
                ['!DOCTYPE', 'html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"'],
                [
                    'html',
                    { xmlns: 'http://www.w3.org/1999/xhtml' },
                    '\n    ',
                    [
                        'head',
                        '\n        ',
                        ['title', 'Title of the ebook'],
                        '\n    '
                    ],
                    '\n    ',
                    [
                        'body',
                        '\n        ',
                        [
                            'div',
                            { style: 'text-align:center;height:100%;' },
                            '\n            ',
                            [
                                'img',
                                {
                                    alt: 'Cover for "Title of the ebook"',
                                    src: 'images/cover.png',
                                    style: 'max-width:100%;height:100%;'
                                }
                            ],
                            '\n        '
                        ],
                        '\n    '
                    ],
                    '\n'
                ]
            ];
            const sut = new JSMLParser();
            const document = sut.parseFile(FILENAME1);
            expect(document).toEqual(expectedDocument);
        });
        it('should give the expected JSML [with ISO-10646-UCS-2 encoding]', () => {
            const expectedDocument = [
                '!DOCUMENT',
                ['?xml', 'version="1.0" encoding="ISO-10646-UCS-2"'],
                ['!DOCTYPE', 'html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"'],
                [
                    'html',
                    { xmlns: 'http://www.w3.org/1999/xhtml' },
                    '\n    ',
                    [
                        'head',
                        '\n        ',
                        ['title', 'Title of the ebook'],
                        '\n    '
                    ],
                    '\n    ',
                    [
                        'body',
                        '\n        ',
                        [
                            'div',
                            { style: 'text-align:center;height:100%;' },
                            '\n            ',
                            [
                                'img',
                                {
                                    alt: 'Cover for "Title of the ebook"',
                                    src: 'images/cover.png',
                                    style: 'max-width:100%;height:100%;'
                                }
                            ],
                            '\n        '
                        ],
                        '\n    '
                    ],
                    '\n'
                ]
            ];
            const sut = new JSMLParser();
            const document = sut.parseFile(FILENAME2, 'utf16');
            expect(document).toEqual(expectedDocument);
        });
    });

});
