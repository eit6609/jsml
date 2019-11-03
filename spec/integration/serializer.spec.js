'use strict';

const
    fs = require('fs'),
    iconv = require('iconv-lite'),
    { JSMLSerializer } = require('../../src/index.js');

const FILENAME = 'spec/fixtures/temp.xml';

describe('JSMLSerializer [integration]', () => {

    const jsml = [
        'root',
        ['child1', { with: 'a difficult value, because of <&>""\'\'' }],
        ['child2', { with: 'a simple value' }, ['empty']],
        ['!CDATA', 'A CDATA here, with a naugthy ]]> inside!'],
        [
            'child3',
            [
                'sub1',
                [
                    'sub2',
                    [
                        'sub3', 'a difficult text, because of &<'
                    ]
                ]
            ]
        ],
        ['?please', 'do not ignoré me!'],
    ];

    describe('serialize()', () => {
        it('should give the expected XML', () => {
            const expectedXML = '<root><child1 with="a difficult value, because of &lt;&amp;>&quot;&quot;&apos;' +
                '&apos;" /><child2 with="a simple value"><empty /></child2><![CDATA[A CDATA here, with a naugthy' +
                ' ]]]]><![CDATA[> inside!]]><child3><sub1><sub2><sub3>a difficult text, because of &amp;&lt;</sub3>' +
                '</sub2></sub1></child3><?please do not ignoré me!?></root>';
            const sut = new JSMLSerializer();
            const xml = sut.serialize(jsml);
            expect(xml).toEqual(expectedXML);
        });
    });

    describe('save()', () => {
        it('should save the expected XML to the file with the expected encoding', () => {
            const document = [
                '!DOCUMENT',
                ['?xml', 'version="1.0" encoding="ISO-8859-1"'],
                ['!DOCTYPE', 'jsmltest'],
                jsml
            ];
            const expectedXML = `<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE jsmltest>
<root>
    <child1 with="a difficult value, because of &lt;&amp;>&quot;&quot;&apos;&apos;" />
    <child2 with="a simple value">
        <empty />
    </child2>
    <![CDATA[A CDATA here, with a naugthy ]]]]><![CDATA[> inside!]]>
    <child3>
        <sub1>
            <sub2>
                <sub3>a difficult text, because of &amp;&lt;</sub3>
            </sub2>
        </sub1>
    </child3>
    <?please do not ignoré me!?>
</root>`;
            const sut = new JSMLSerializer({ spacesPerLevel: 4 });
            sut.save(document, FILENAME);
            const xml = iconv.decode(fs.readFileSync(FILENAME), 'ISO-8859-1');
            expect(xml).toEqual(expectedXML);
        });
    });

});
