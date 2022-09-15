type ColorStop = {
  color: string;
  stop: number;
};

type LinearGradientDirections = "to-right" | "to-bottom";

type RadialGradient = {
  type: "round";
  colorStops: ColorStop[];
};

type LinearGradient = {
  type: "linear";
  direction: LinearGradientDirections;
  colorStops: ColorStop[];
};

export type Options = {
  /**
   * Text to be encoded in the QR code.
   */
  text: string;

  /**
   * Background options
   */
  background?: {
    /**
     * Color of the dimming mask above the background image.
     *
     * Accepts a CSS &lt;color&gt;.
     *
     * For more information about CSS &lt;color&gt;, please refer to [https://developer.mozilla.org/en-US/docs/Web/CSS/color_value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value).
     *
     * @defaultValue "rgba(0, 0, 0, 0)"
     */
    colorAbove?: string;

    /**
     * Color of the background of the QR.
     *
     * Goes behind an eventually image with `background.image` option
     *
     * @defaultValue "transparent"
     */
    colorBelow?: string;

    /**
     * Background image to be used in the QR code.
     *
     * Accepts a `data:` string in web browsers or a Buffer in Node.js.
     */
    image?: string | Buffer;
  };

  /**
   * Color of the blocks on the QR code.
   *
   * Accepts a CSS &lt;color&gt;.
   *
   * For more information about CSS &lt;color&gt;, please refer to [https://developer.mozilla.org/en-US/docs/Web/CSS/color_value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value).
   *
   * @defaultValue "#000000"
   */
  color?: string;

  /**
   * Options for data/ECC dots.
   */
  dots?: {
    /**
     * Percentage to round the dots (after scaling) in the QR
     * @range 0..1
     * @default 0
     */
    round?: number;

    /**
     * Scale factor for all dots.
     * @range 0..1
     * @default 1
     */
    scale?: number;
  };

  /**
   * Custom function to draw a custom shape as a dot in the QR.
   *
   * Accepts either a string or a custom function.
   * As a string it currently accepts only "telegram" mode.
   * As a function here are the parameters:
   *
   * - canvasContext: the current drawing context
   * - left: how many cells are from the left margin
   * - top: how many cells are from the top margin
   * - nSize: size in pixels of a single cell
   * - scale: scale of data blocks as provided in initial options
   * - round: round of data block as provided in initial options
   * - parameters: tell if the cell is special (timing or alignment) or regular
   * - otherCells: tell if the neighbour cells are empty or full
   */
  drawFunction?:
    | "telegram"
    | ((
        canvasContext: any,
        left: number,
        top: number,
        nSize: number,
        scale: number,
        round: number,
        parameters: {
          isTiming: boolean;
          isAlignment: boolean;
        },
        otherCells: {
          top: boolean;
          left: boolean;
          right: boolean;
          bottom: boolean;
        }
      ) => undefined);

  /**
   * Options for finder squares.
   */
  finder?: {
    /**
     * Percentage to round the three finder in the QR
     * @range 0..1
     * @default 0
     */
    round?: number;
  };

  /**
   * Function for creating a gradient as foreground color
   *
   * Can be of three types:
   * - A function that return a CanvasGradient object
   * - A LinearGradient object
   * - A RadialGradient object
   *
   * Overrides colorDark option
   */
  gradient?:
    | ((ctx: any, size: number) => any)
    | LinearGradient
    | RadialGradient;

  /**
   * Logo options
   */
  logo?: {
    /**
     * Logo image to be displayed at the center of the QR code.
     *
     * Accepts a `data:` string in web browsers or a Buffer in Node.js.
     *
     * When set to `undefined` or `null`, the logo is disabled.
     */
    image: string | Buffer;

    /**
     * Size of margins around the logo image in pixels.
     *
     * @defaultValue 10
     */
    margin?: number;

    /**
     * Corner radius of the logo image in pixels.
     *
     * @range 0..1
     *
     * @defaultValue 0.4
     */
    round?: number;

    /**
     * Ratio of the logo size to the QR code size.
     *
     * @defaultValue 0.2
     */
    scale?: number;
  };

  /**
   * Margin options
   */
  margin?: {
    /**
     * Color of the margins.
     *
     * Accepts a CSS &lt;color&gt;.
     *
     * For more information about CSS &lt;color&gt;, please refer to [https://developer.mozilla.org/en-US/docs/Web/CSS/color_value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value).
     *
     * @defaultValue "transparent"
     */
    color?: string;

    /**
     * Size of margins around the QR code body in pixel.
     *
     * @defaultValue 20
     */
    size?: number;
  };

  /**
   * Custom function called at certain phases of drawing the QR.
   * Useful for customizing the canvas if something is not supported by this library
   * Actually called when:
   *
   * - starting painting foreground
   * - end painting foreground
   * - starting painting background
   * - end painting background
   */
  onEvent?: (type: EventTypes, canvasContext: any, parameters?: object) => void;

  /**
   * QR options
   */
  qr?: {
    /**
     * Error correction level of the QR code.
     *
     * Accepts a value provided by _QRErrorCorrectLevel_.
     *
     * For more information, please refer to [https://www.qrcode.com/en/about/error_correction.html](https://www.qrcode.com/en/about/error_correction.html).
     *
     * @defaultValue 0
     */
    correctLevel?: number;

    /**
     * **This is an advanced option.**
     *
     * Specify the mask pattern to be used in QR code encoding.
     *
     * Accepts a value provided by _QRMaskPattern_.
     *
     * To find out all eight mask patterns, please refer to [https://en.wikipedia.org/wiki/File:QR_Code_Mask_Patterns.svg](https://en.wikipedia.org/wiki/File:QR_Code_Mask_Patterns.svg)
     *
     * For more information, please refer to [https://en.wikiversity.org/wiki/Reed%E2%80%93Solomon_codes_for_coders#Masking](https://en.wikiversity.org/wiki/Reed%E2%80%93Solomon_codes_for_coders#Masking).
     */
    maskPattern?: number;

    /**
     * **This is an advanced option.**
     *
     * Specify the version to be used in QR code encoding.
     *
     * Accepts an integer in range [1, 40].
     *
     * For more information, please refer to [https://www.qrcode.com/en/about/version.html](https://www.qrcode.com/en/about/version.html).
     */
    version?: number;
  };

  /**
   * Size of the QR code in pixel.
   *
   * @defaultValue 400
   */
  size?: number;
};

type EventTypes =
  | "start-foreground"
  | "gradient"
  | "end-foreground"
  | "start-background"
  | "end-background"
  | "final-canvas";
