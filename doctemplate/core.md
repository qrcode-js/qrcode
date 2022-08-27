# @qrcode-js/core

## Description

This is the core package. It draws effectively the QR based on options provived.
It is platform agnostic and works both in browsers and server environment thanks to the wrappers.

We have extended the API to provide lots of customization, for example with the custom function `drawFunction` and `onEvent`.
Basically they provide a method to take "control" of the canvas. More on them in the API section

Basically the wrappers ensure that the core has all stuff to work with. For example in browsers canvas is provided by default and ready to use. On Node doesn't exist this implementation and so we have to use an external package (`canvas`).

There are no examples provided as this package alone doesn't make mush sense.
If you're looking for examples, check out the wrappers (Node and Browser).

##API
