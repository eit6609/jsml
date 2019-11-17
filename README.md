# JSML

JSML (JavaScript Markup Language) is a library that enables a compact and straightforward representation of XML
in JavaScript.

It was born from a couple of good ideas:

* [JsonML](http://www.jsonml.org/), which is a JSON representation of XML.
* [Hiccup](https://github.com/weavejester/hiccup), which is a Clojure library for HTML templating that converts Clojure
  data structures to HTML.

Run this to install:

```bash
npm i @eit6609/jsml
```

## The rules

The very simple rules for the representation are:

* an element is represented by an array, where:
    * the first item is a string that represents the tag
    * the second item can be an object: in this case the value of its properties
      must be strings, and it represents the attributes
    * the other items, starting from index 2 if there are attributes, and from 1
      if there are not, represent the children
* a text is represented by a string

Wait a minute, this is JsonML! Well, *when stringified to JSON* it is JsonML. But in this library we focus in the *live*
JavaScript structure, that's why we called it JSML instead.

### Examples:

JavaScript|XML
----------|---
`'a text'`|`a text`
`['br']`|`<br />`
`['p', 'a paragraph text']`|`<p>a paragraph text</p>`
`['span', {class: 'small'}, 'a span text']`|`<span class="small">a span text</span>`
`['!CDATA', 'Unescaped <data>']` | `<![CDATA[Unescaped <data>]]>`
`['?please', 'execute me']` | `<?please execute me?>`

As you can see the `CDATA` is represented by an element with the special tag `!CDATA` and a text child.

The processing instructions are represented by an element with the special tag `?target` and a text child.

A  more complex example is this XML:

```xml
<root>
    <a-list-element attr="value">
        <a-flat-element attr1="val1" attr2="val2"/>
        <a-flat-element attr1="val3" attr2="val4"/>
        <an-element-with-text>this is the text</an-element-with-text>
    </a-list-element>
<![CDATA[A CDATA here!]]>
</root>
```

that is represented, in JavaScript, by this structure:

```js
const jsml = [
    'root',
    '\n    ',
    [
        'a-list-element',
        {attr: 'value'},
        '\n        ',
        ['a-flat-element', {attr1: 'val1', attr2: 'val2'}],
        '\n        ',
        ['a-flat-element', {attr1: 'val3', attr2: 'val4'}],
        '\n        ',
        ['an-element-with-text', 'this is the text']
        '\n    '
    ],
    '\n',
    ['!CDATA', 'A CDATA here!']
]
```

## Document

In order to be fully lossless the library must allow you to parse an XML document into a JSML, modify it, and then save
it without losing anything of the original document.

To do that we need to wrap the JSML in another structure that represents the XML document containing all the "siblings"
of the JSML.

The document is represented by an element with a special name:

```js
['!DOCUMENT', child1, child2, ..., child(n)]
```

The following rules apply to the children:

* there must be one and only one JSML element, which is called *root element*
* there can by one and only one XML declaration, represented by `['?xml', 'content']`, and it must be the first child
* there can by one and only one DOCTYPE, represented by `['!DOCTYPE', 'content']`, and it must be after the XML
  declaration and before the root element
* any number of blanks and processing instructions, represented by `['?target', 'content']` can be among the above
  distinguished children

This is an example of document:

```js
const doc = [
    '!DOCUMENT',
    ['?xml', 'version="1.0" encoding="utf-8"'],
    ['!DOCTYPE', 'html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"',
    ['?xml-stylesheet', 'type="text/xsl" href="style.xsl"'],
    ['html']
];
```

### Why another representation?

There are many other JavaScript representation for XML, why is this needed?

Well, because it is the most compact and... fun to use for a programmer!

And also because the library offers a complete toolkit.

## The library

JSML is a compact structure, which can be easily:

* created as an object literal
* parsed from an XML
* serialized to an XML
* manipulated

This library for Node.js (>= 6.10) provides:

* a handler for [htmlparser2](https://github.com/fb55/htmlparser2)
* a parser that creates a JSML from an XML string
* a serializer that creates an XML string from a JSML
* a set of utilities for the manipulation of a JSML

### API

#### JSMLParser

This is a very thin wrapper around htmlparser2, to hide the details of the parser if you don't care about it and you
just want a JSML.

But if you know htmlparser2 you can configure it using its options.

Let's see the methods.

```js
constructor(options?: object)
```

* `options` is optional and contains the options for the htmlparser2 parser.

```js
parseString(xml: string): (string | array)
```

* `xml` is a string containing the XML.

The result is a JSML or a document, depending on the input.

```js
parseFile(filename: string, encoding?: string): (string | array)
```

* `filename` the name of the file.
* `encoding` is a the encoding to use to open the file. The default is `utf8`.

All the content of the file gets read synchronously with the specified encoding and passed to the `parseString()`
method.

##### Example

```js
'use strict';

const { JSMLParser } = require('jsml'),

const xml = `<root>
    <a-list-element attr="value">
        <a-flat-element attr1="val1" attr2="val2" />
        <a-flat-element attr1="val3" attr2="val4" />
        <an-element-with-text>this is the text</an-element-with-text>
    </a-list-element>
<![CDATA[A CDATA here!]]>
</root>`;

const jsml = new JSMLParser().parseString(xml);
console.dir(jsml, { depth: null });

/*
[ 'root',
  '\n    ',
  [ 'a-list-element',
    { attr: 'value' },
    '\n        ',
    [ 'a-flat-element', { attr1: 'val1', attr2: 'val2' } ],
    '\n        ',
    [ 'a-flat-element', { attr1: 'val3', attr2: 'val4' } ],
    '\n        ',
    [ 'an-element-with-text', 'this is the text' ],
    '\n    ' ],
  '\n',
  [ '!CDATA', 'A CDATA here!' ],
  '\n' ]
*/
```

#### JSMLHandler

If you are not satisfied with the simple implementation of the parser, which parses a string with the whole XML, you can
use directly htmlparser2 with its streaming interface. Just pass an instance of JSMLHandler as handler to the
constructor of the parser and call `getResult()` on the handler when you have finished.

##### Example

```js
'use strict';

const
    { JSMLHandler } = require('jsml'),
    { Parser } = require('htmlparser2');

const handler = new JSMLHandler();
const parser = new Parser(handler, { xmlMode: true, decodeEntities: true }));

function getNextChunk () {
    // ...
}

let chunk;
while (chunk = getNextChunk()) {
	parser.write(chunk);
}
parser.end();
const jsml = handler.getResult();
// ...
```

#### JSMLSerializer

With the Serializer you can transform a JSML into an XML string.

Let's see the methods that the user is likely to need more often.

```js
constructor (options?: object)
```

These are the supported options:

* `spacesPerLevel`, number, optional. If not nil it triggers the formatting of the XML with newlines and indentations.
  Use any number <= 0 to emit only newlines. It should **not** be used when serializing a JSML that already contains
  newlines and indentations, maybe because it was parsed from a file. Its use case is the serialization of a JSML built
  with literals, because you are unlikely to insert newlines and blanks in such a compact structure. See the following
  examples.

```js
serialize (item: (string | array)): string
```

The input can be a document or a JSML. It validates the input and then it generates the XML string.

The parameters are:

* `item`, the JSML or document

```js
save (item: (string | array), filename: string, encoding?: string)
```

A utility method that saves (synchronously) the generated XML to a file.

The parameters are:

* `item`, the JSML or document
* `filename`, the name of the file
* `encoding`, the encoding to use to write to the file. If `encoding` is not present and `item` is a document, the
encoding declared in the XML declaration is used. The default is `utf8`.

#### Examples

```js
'use strict';

const { JSMLSerializer } = require('jsml');

let jsml = [
    'root',
    [
        'a-list-element',
        {attr: 'value'},
        ['a-flat-element', {attr1: 'val1', attr2: 'val2'}],
        ['an-element-with-text', 'this is the text']
    ]
];

let serializer = new JSMLSerializer();
console.log(serializer.serialize(jsml));

/*
<root><a-list-element attr="value"><a-flat-element attr1="val1" attr2="val2" /><an-element-with-text>this is the text</an-element-with-text></a-list-element></root>
*/

let serializer = new JSMLSerializer({ spacesPerLevel: 0 });
console.log(serializer.serialize(jsml));

/*
<root>
<a-list-element attr="value">
<a-flat-element attr1="val1" attr2="val2" />
<an-element-with-text>this is the text</an-element-with-text>
</a-list-element>
</root>
*/

let serializer = new JSMLSerializer({ spacesPerLevel: 4 });
console.log(serializer.serialize(jsml));

/*
<root>
    <a-list-element attr="value">
        <a-flat-element attr1="val1" attr2="val2" />
        <an-element-with-text>this is the text</an-element-with-text>
    </a-list-element>
</root>
*/

const doc = [
    '!DOCUMENT',
    ['?xml', 'version="1.0" encoding="utf-8"'],
    ['!DOCTYPE', 'html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"',
    [
        'html',
        { xmlns: 'http://www.w3.org/1999/xhtml' },
        [
            'head',
            ['title', 'Cover']
        ],
        [
            'body',
            [
                'div',
                { style: 'text-align:center;height:100%;' },
                [
                    'img',
                    {
                        alt: 'Can\'t see this image?',
                        src: 'cover.jpg',
                        style: 'max-width:100%;height:100%;'
                    }
                ]
            ]
        ]
    ]
];

let serializer = new JSMLSerializer({ spacesPerLevel: 4 });
console.log(serializer.serialize(jsml));

/*
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <title>Cover</title>
    </head>
    <body>
        <div style="text-align:center;height:100%;">
            <img alt="Can&apos;t see this image?" src="cover.jpg" style="max-width:100%;height:100%;" />
        </div>
    </body>
</html>
*/
```

#### JSMLUtils

There are quite a few utilities, to avoid the boilerplate for accessing the parts of an element, create the items of a
document, get the type of an item and have some validation.

Sorry, no functions for navigation and modification, but the structure is so simple that they are hardly needed. You
can code them by yourself, after all you are a programmer and I don't want you to miss all the fun!

```js
getEncoding (declaration: array): string
```

It extracts the encoding from the passed XML declaration, if it has one. Otherwise `undefined` is returned.

```js
validateElementName (name: string)
```

It throws an Error if `name` is not a valid element name.

```js
validatePITarget (target: string)
```

It throws an Error if `target` is not a valid processing instruction target.

```js
validateAttributeName (name: string)
```

It throws an Error if `name` is not a valid attribute name.

```js
validateJSML (jsml: any)
```

It throws an Error if `jsml` is not a well formed JSML, i.e. it does not follow the mapping rules seen above.

```js
validateDocument (document: any)
```

It throws an Error if `document` does not follow the rules for the document seen above.

```js
xmlDeclaration (encoding?: string)): array
```

It creates an XML declaration with the optional encoding (default is `utf8`).

```js
docType (content: string)): array
```

It creates a DOCTYPE.

```js
processingInstruction (target: string, content: string)): array
```

It creates a processing instruction.

```js
cdata (content: string)): array
```

It creates a CDATA.

```js
isElementName (name: string): boolean
```
It returns `true` if `name` is a valid XML element name, i.e., not a special name like `?xml` or `!DOCUMENT`.

```js
getType (item: any): string
```
It returns the type of the argument, which can be one of the following values:

* `DOCUMENT`
* `DECLARATION`
* `DOCTYPE`
* `PI`
* `ELEMENT`
* `CDATA`
* `TEXT`
* `UNKNOWN`

```js
getRoot (document: array): array
```
It gets the root element of the document.

```js
destructureElement (jsml: array): object
```
It returns an object describing the element, like this:

```js
{
    tag: 'a-tag',
    attributes: { some: 'value' }
    children: ['a text']
}
```

* `tag` is a string
* `attributes` is an object and it can be `undefined`
* `children` is an array and it can be empty

```js
getTag (jsml: (string | array)): string
```
It gets the tag of the element. Not a big effort, it is equivalent to `jsml[0]`, but it completes the functions that
give a uniform access to the parts of an element.

```js
getAttributes (jsml: (string | array)): object?
```

It gets the attributes of an element, if it has some. Otherwise it returns `undefined`

```js
getChildren (jsml: (string | array)): array
```

It gets the children of an element, if it has some. Otherwise it returns `[]`.

```js
getChildrenStartIndex (jsml: (string | array)): integer
```

It gets the index where the (possible) children of an element begin, which is `1` or `2`.

##### Examples

```js
'use strict';

const {
    JSMLUtils: {
        getEncoding, xmlDeclaration, docType, processingInstruction, cdata, isElementName, getType, destructureElement,
        getTag, getAttributes, getChildren, getChildrenStartIndex, validateJSML
    }
} = require('jsml');

const jsml = [
    'html',
    { xmlns: 'http://www.w3.org/1999/xhtml' },
    [
        'head',
        ['title', 'Cover']
    ],
    [
        'body',
        [
            'div',
            { style: 'text-align:center;height:100%;' },
            [
                'img',
                {
                    alt: 'Can\'t see this image?',
                    src: 'cover.jpg',
                    style: 'max-width:100%;height:100%;'
                }
            ]
        ]
    ]
];

console.log(getEncoding(['?xml', 'version="1.0" encoding="ISO-8859-1"']));
// 'ISO-8859-1'
console.log(xmlDeclaration('ISO-8859-1'));
// ['?xml', 'version="1.0" encoding="ISO-8859-1"']
console.log(docType('html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"'));
// ['!DOCTYPE', 'html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"']
console.log(processingInstruction('?xml-stylesheet', 'href="style.css"');
// ['?xml-stylesheet', 'href="style.css"']
console.log(cdata('<som&> data');
// ['!CDATA', '<som&> data']
console.log(isElementName('!DOCTYPE');
// false
console.log(getType(['?xml', 'version="1.0" encoding="ISO-8859-1"']));
// 'DECLARATION'
console.log(getType(['!DOCTYPE', 'html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"']));
// 'DOCTYPE'
console.log(getType(['?xml-stylesheet', 'href="style.css"']));
// 'PI'
console.log(getType(['p', 'some text']));
// 'ELEMENT'
console.log(getType(['!CDATA', '<some> & data']));
// 'CDATA'
console.log(getType('9'));
// 'TEXT'
console.log(getType(9));
// 'UNKNOWN'
console.log(destructureElement(['span', { class: 'sc' }, 'this is small capitals']));
// { tag: 'span', attributes: { class: 'sc' }, children: ['this is small capitals']}
console.log(getTag(jsml));
// 'html'
console.log(getAttributes(jsml));
// { xmlns: 'http://www.w3.org/1999/xhtml' }
console.log(getChildren(jsml)[0]);
// ['head', ['title', 'Cover']]
console.log(getAttributes(['p', 'text of p']));
// undefined
console.log(getChildren(['hr']));
// []
console.log(getChildrenStartIndex(['br']));
// 1
console.log(getChildrenStartIndex(['span', { class: 'big' }]));
// 2
validateJSML(42);
// Error: Invalid JSML: 42 is neither an array nor a string
```
