# jsml

JSML (JavaScript Markup Language) is a library that enable a compact and straightforward representation of XML
in JavaScript.

It was born from a couple of good ideas:

* [JsonML](http://www.jsonml.org/), which is a JSON representation of XML.
* [Hiccup](https://github.com/weavejester/hiccup), which is a Clojure library for HTML templating that converts Clojure data structures to HTML.

## The rules

The very simple rules for the representation are:

* an element is represented by an array, where:
    * the first item is a string that represents the tag
    * the second item can be an object: in this case the value of its properties
      must be strings, and it represents the attributes
    * the other items, starting from index 2 if there are attributes, and from 1
      if there are not, represent the children
* a text is represented by a string

Wait a minute, this is JsonML! Well, *when stringified to JSON* it is JsonML. But in this library we focus in the *live* JavaScript structure, that's why we used another name.

### Examples:

JavaScript|XML
----------|---
`['br']`|`<br />`
`['p', 'a paragraph text']`|`<p>a paragraph text</p>`
`['span', {class: 'small'}, 'a span text']`|`<span class="small">a span text</span>`

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

As you can see the `CDATA` is treated as an element with the special tag `!CDATA` and a text child.

### Why another representation?

There are many other JavaScript representation for XML, why is this needed?

Well, because it is the most compact and... fun to use for a programmer!

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
parseString(xml: string, options?: object): (string | array)
```

* `xml` is a string containing the XML.
* `options` is optional and contains the options for the htmlparser2 parser.

The result is a JSML structure.

```js
parseFile(filename: string, options?: object): (string | array)
```

* `filename` is a string containing the file name.
* `options` is optional and contains the options for the htmlparser2 parser.

All the content of the file gets read (synchronously) and passed to the `parseString()` method.

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
constructor of the parser and use the `root` attribute of the handler when you have finished.

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
const jsml = handler.root;
// ...
```

#### JSMLSerializer

With the Serializer you can transform a JSML into an XML string.

Let's see the methods that the user is likely to need more often.

```js
constructor (options?: object)
```

These are the supported options:

* `newline`, boolean, default `false`. It triggers the insertion of newlines at the end of the tags. It's not really a
pretty printing, just a way to have something more understandable than a very long line of text when your JSML was
created as a literal, and therefore it is unlikely that you have added tabs and newlines.
* `doctTpe`, the `DOCTYPE` declaration. The default is `null`, that means "no doctype".
* `appendDeclaration`, when `true` it triggers the output of the XML declaration `<?xml version="1.0" encoding="utf-8"?>`
   at the beginning of the output. The default is `false`.

```js
serialize (jsml: (string | array)): string
```

It validates the input (with `JSMLUtils.validateJSML`) and then it generates the XML string from the JSML.

The parameters are:

* `jsml`, the JSML structure

```js
save (jsml: (string | array), filename: string)
```

A utility method that saves (synchronously) the generated XML to a file.

It opens the file and write the result of `serialize`.

The parameters are:

* `jsml`, the JSML structure
* `filename`, the name of the file

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

let serializer = new JSMLSerializer({ newline: true });
console.log(serializer.serialize(jsml));

/*
<root>
<a-list-element attr="value">
<a-flat-element attr1="val1" attr2="val2" />
<an-element-with-text>this is the text</an-element-with-text>
</a-list-element>
</root>
*/

jsml = [
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

let serializer = new JSMLSerializer({
    newline: true,
    appendDeclaration: true,
    docType: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
});
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

There are very few utilities, just to avoid the boilerplate for  accessing the parts of an element.

There is also a validation function, which is very useful.

Sorry, no functions for navigation and modification, but the structure is so simple that they are hardly needed. You can code them by yourself, after all you are a programmer and I don't want you to miss all the fun!

```js
validateJSML (jsml: any)
```

It throws an Error if `jsml` is not a well formed JSML, i.e. it does not follow the mapping rules stated at the
beginning of this README.

```js
validateElement (element: any)
```

It throws an Error if `jsml` is not a well formed JSML element, i.e. it does not follow the mapping rules stated at the
beginning of this README.

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

const { JSMLUtils: { getTag, getAttributes, getChildren, getChildrenStartIndex, validateJSML, validateElement } } = require('jsml');

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

console.log(getTag(jsml));
// html
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
validateElement('string');
// Error: Invalid JSML element: 'string' is not an array
```
