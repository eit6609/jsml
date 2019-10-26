'use strict';

const
    fs = require('fs'),
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
    ];

    describe('serialize()', () => {
        it('should give the expected XML', () => {
            const expectedXML = '<root><child1 with="a difficult value, because of &lt;&amp;>&quot;&quot;&apos;' +
                '&apos;" /><child2 with="a simple value"><empty /></child2><![CDATA[A CDATA here, with a naugthy' +
                ' ]]]]><![CDATA[> inside!]]><child3><sub1><sub2><sub3>a difficult text, because of &amp;&lt;</sub3>' +
                '</sub2></sub1></child3></root>';
            const sut = new JSMLSerializer();
            const xml = sut.serialize(jsml);
            expect(xml).toEqual(expectedXML);
        });
    });

    describe('save()', () => {
        it('should save the expected XML to the expected file', () => {
            const expectedXML = `<?xml version="1.0" encoding="utf-8"?>
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
</root>
`;
            const sut = new JSMLSerializer({ newline: true, appendDeclaration: true, docType: '<!DOCTYPE jsmltest>' });
            sut.save(jsml, FILENAME);
            const xml = fs.readFileSync(FILENAME, 'utf8');
            expect(xml).toEqual(expectedXML);
        });
    });

});
