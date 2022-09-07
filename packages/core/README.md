<!-- Auto-generated README. Do not edit directly -->

# @qrcode-js/core

## Description

This is the core package. It draws effectively the QR based on options provived.
It is platform agnostic and works both in browsers and server environment thanks to the wrappers.

We have extended the API to provide lots of customization, for example with the custom function `drawFunction` and `onEvent`.
Basically they provide a method to take "control" of the canvas. More on them in the API section

Basically the wrappers ensure that the core has all stuff to work with. For example in browsers canvas is provided by default and ready to use. On Node doesn't exist this implementation and so we have to use an external package (`canvas`).

There are no examples provided as this package alone doesn't make mush sense.
If you're looking for examples, check out the wrappers (Node and Browser).

## API

```typescript
type Options = {
  text: string;
  autoColor?: boolean;
  background?: {
    dimming?: string;
    image?: Union;
  };
  colorDark?: string;
  colorLight?: string;
  dots?: {
    round?: number;
    scale?: number;
  };
  drawFunction?: Union;
  finder?: {
    round?: number;
  };
  gradient?: Function;
  logo?: {
    image?: Union;
    margin?: number;
    round?: number;
    scale?: number;
  };
  margin?: number;
  onEvent?: Function;
  qr?: {
    correctLevel?: number;
    maskPattern?: number;
    version?: number;
  };
  size?: number;
  whiteMargin?: boolean;
};
type EventTypes =
  | "start-foreground"
  | "end-foreground"
  | "start-background"
  | "end-background"
  | "final-canvas";
```

### text

**Type** `string`

**Required**

Text to be encoded in the QR code.

<hr />

### autoColor

**Type** `boolean`

**defaultValue** `true`

Automatically calculate the _colorLight_ value from the QR code's background.

<hr />

### background

**Type** `Object`

Background options

<hr />

### background.dimming

**Type** `string`

**defaultValue** `"rgba(0, 0, 0, 0)"`

Color of the dimming mask above the background image.

Accepts a CSS &lt;color&gt;.

For more information about CSS &lt;color&gt;, please refer to [https://developer.mozilla.org/en-US/docs/Web/CSS/color_value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value).

<hr />

### background.image

**Type** `string | Buffer`

Background image to be used in the QR code.

Accepts a `data:` string in web browsers or a Buffer in Node.js.

<hr />

### colorDark

**Type** `string`

**defaultValue** `"#000000"`

Color of the blocks on the QR code.

Accepts a CSS &lt;color&gt;.

For more information about CSS &lt;color&gt;, please refer to [https://developer.mozilla.org/en-US/docs/Web/CSS/color_value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value).

<hr />

### colorLight

**Type** `string`

**defaultValue** `"#ffffff"`

Color of the empty areas on the QR code.

Accepts a CSS &lt;color&gt;.

For more information about CSS &lt;color&gt;, please refer to [https://developer.mozilla.org/en-US/docs/Web/CSS/color_value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value).

<hr />

### dots

**Type** `Object`

Options for data/ECC dots.

<hr />

### dots.round

**Type** `number`

**range** `0..1`

**default** `0`

Percentage to round the dots (after scaling) in the QR

<hr />

### dots.scale

**Type** `number`

**range** `0..1`

**default** `1`

Scale factor for all dots.

<hr />

### drawFunction

**Type** `"telegram" | (( canvasContext: CanvasRenderingContext2D, left: number, top: number, nSize: number, scale: number, round: number, parameters: { isTiming: boolean; isAlignment: boolean; }, otherCells: { top: boolean; left: boolean; right: boolean; bottom: boolean; } ) => undefined)`

Custom function to draw a custom shape as a dot in the QR.

Accepts either a string or a custom function.
As a string it currently accepts only "telegram" mode.
As a function here are the parameters:

- canvasContext: the current drawing context
- left: how many cells are from the left margin
- top: how many cells are from the top margin
- nSize: size in pixels of a single cell
- scale: scale of data blocks as provided in initial options
- round: round of data block as provided in initial options
- parameters: tell if the cell is special (timing or alignment) or regular
- otherCells: tell if the neighbour cells are empty or full

<hr />

### finder

**Type** `Object`

Options for finder squares.

<hr />

### finder.round

**Type** `number`

**range** `0..1`

**default** `0`

Percentage to round the three finder in the QR

<hr />

### gradient

**Type** `(ctx: CanvasRenderingContext2D, size: number) => CanvasGradient`

Function for creating a gradient as foreground color

Must return a CanvasGradient

Overrides colorDark option

<hr />

### logo

**Type** `Object`

Logo options

<hr />

### logo.image

**Type** `string | Buffer`

Logo image to be displayed at the center of the QR code.

Accepts a `data:` string in web browsers or a Buffer in Node.js.

When set to `undefined` or `null`, the logo is disabled.

<hr />

### logo.margin

**Type** `number`

**defaultValue** `10`

Size of margins around the logo image in pixels.

<hr />

### logo.round

**Type** `number`

**range** `0..1`

**defaultValue** `0.4`

Corner radius of the logo image in pixels.

<hr />

### logo.scale

**Type** `number`

**defaultValue** `0.2`

Ratio of the logo size to the QR code size.

<hr />

### margin

**Type** `number`

**defaultValue** `20`

Size of margins around the QR code body in pixel.

<hr />

### onEvent

**Type** `( type: EventTypes, canvasContext: CanvasRenderingContext2D, parameters: object ) => undefined`

Custom function called at certain phases of drawing the QR.
Useful for customizing the canvas if something is not supported by this library
Actually called when:

- starting painting foreground
- end painting foreground
- starting painting background
- end painting background

<hr />

### qr

**Type** `Object`

<hr />

### qr.correctLevel

**Type** `number`

**defaultValue** `0`

Error correction level of the QR code.

Accepts a value provided by _QRErrorCorrectLevel_.

For more information, please refer to [https://www.qrcode.com/en/about/error_correction.html](https://www.qrcode.com/en/about/error_correction.html).

<hr />

### qr.maskPattern

**Type** `number`

**This is an advanced option.**

Specify the mask pattern to be used in QR code encoding.

Accepts a value provided by _QRMaskPattern_.

To find out all eight mask patterns, please refer to [https://en.wikipedia.org/wiki/File:QR_Code_Mask_Patterns.svg](https://en.wikipedia.org/wiki/File:QR_Code_Mask_Patterns.svg)

For more information, please refer to [https://en.wikiversity.org/wiki/Reed%E2%80%93Solomon_codes_for_coders#Masking](https://en.wikiversity.org/wiki/Reed%E2%80%93Solomon_codes_for_coders#Masking).

<hr />

### qr.version

**Type** `number`

**This is an advanced option.**

Specify the version to be used in QR code encoding.

Accepts an integer in range [1, 40].

For more information, please refer to [https://www.qrcode.com/en/about/version.html](https://www.qrcode.com/en/about/version.html).

<hr />

### size

**Type** `number`

**defaultValue** `400`

Size of the QR code in pixel.

<hr />

### whiteMargin

**Type** `boolean`

**defaultValue** `false`

Use a white margin instead of a transparent one which reveals the background of the QR code on margins.

<hr />
