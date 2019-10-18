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

A  more compex exaple is this XML:

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

## The library

JSML is a compact structure, which can be easily:

* created as an object literal
* parsed from an XML
* serialized to an XML
* manipulated

This library for Node.js (> 8.10) provides:

* a parser that creates a JSML from an XML string
* a serializer that creates an XML string from a JSML
* a set of utilities for the manipulation of a JSML

### API
