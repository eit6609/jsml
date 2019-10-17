# jsonml

A JsonML suite.

[JsonML](http://www.jsonml.org/) is a JSON representation of XML.

To be more precise, we are not interest in the *JSON* representation, which is a string, but in the *JavaScript*
representation of XML, which is live.

## A quick example

This XML

```xml
<root>
    <a-list attr="value">
        <a-flat-element attr1="val1", attr2="val2"/>
        <a-flat-element attr1="val3", attr2="val4"/>
        <an-element-with-text>this is the text</an-element-with-text>
    </a-list>
</root>
```

is represented, in JavaScript, by this object:

```javascript
[
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
    '\n'
]
```

It is a compact structure, which can be easily:

* created as an object literal
* parsed from an XML
* serialized to an XML
* manipulated

This library for Node.js provides:

* a parser that creates a JsonML from an XML string
* a serializer that creates an XML string from a JsonML
* a set of utilities for the manipulation of a JsonML
