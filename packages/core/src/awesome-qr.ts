import { QRCodeModel, QRErrorCorrectLevel, QRUtil } from "./qrcode.js";
import type { Options } from "./types.js";

// Base interface for basic typing
interface BaseCanvas {
  width: number;
  height: number;
  getContext: (ctx: "2d") => any;
  toBuffer?: () => any;
}

const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

interface LogoOptions {
  image: any;
  scale: number;
  logoX: number;
  logoY: number;
}

// Options that don't have default value
type ExcludedProperties =
  | "gradient"
  | "background"
  | "drawFunction"
  | "onEvent"
  | "text";

export class AwesomeQR<CanvasLike extends BaseCanvas> {
  // Functions dependent on environment (Node.js or browser)
  private createCanvas;
  private loadImage;

  // Output canvas and context
  // Canvas must be created before calling constructor
  private canvas;
  private canvasContext;

  // qrCode from core library (qrcode.ts)
  private qrCode: QRCodeModel | null = null;

  private options: Options | null = null;

  static CorrectLevel = QRErrorCorrectLevel;

  static defaultOptions: Required<Omit<Options, ExcludedProperties>> = {
    color: "#000000",
    dots: {
      scale: 1,
      round: 0,
    },
    finder: {
      round: 0,
    },
    logo: { scale: 0.2, margin: 10, round: 0.4, image: "" },
    margin: { size: 20 },
    qr: {
      correctLevel: QRErrorCorrectLevel.M,
    },
    size: 400,
  };

  constructor(
    canvas: CanvasLike,
    createCanvas: (width: number, height: number) => CanvasLike,
    loadImage: any
  ) {
    // Save arguments
    this.canvas = canvas;
    this.createCanvas = createCanvas;
    this.loadImage = loadImage;
    this.canvasContext = this.canvas.getContext("2d");
  }

  // Function to set options
  // Can be called multiple times during the lifecyle of this class
  setOptions(options: Options): void {
    if (!options) return;

    this.options = options;

    const size = this.options.size ?? AwesomeQR.defaultOptions.size;
    this.canvas.width = size;
    this.canvas.height = size;

    const correctLevel =
      this.options.qr?.correctLevel ??
      AwesomeQR.defaultOptions.qr.correctLevel ??
      0;
    this.qrCode = new QRCodeModel(-1, correctLevel);

    const maskPattern = this.options.qr?.maskPattern;
    if (maskPattern && Number.isInteger(maskPattern)) {
      this.qrCode.maskPattern = maskPattern;
    }

    const version = this.options.qr?.version;
    if (version && Number.isInteger(version)) {
      this.qrCode.typeNumber = version;
    }

    this.qrCode.addData(
      this.options.text || "https://github.com/qrcode-js/qrcode"
    );
    this.qrCode.make();
  }

  // Promise-base function to draw the qrcode
  draw(): Promise<Buffer | undefined> {
    return new Promise((resolve) => this._draw().then(resolve));
  }

  private _clear(): void {
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Removes a portion (a rect) in the canvas
  static _removePortion(canvasContext: any): void {
    const oldGlobalCompositeOperation = canvasContext.globalCompositeOperation;
    const oldFillStyle = canvasContext.fillStyle;
    canvasContext.globalCompositeOperation = "destination-out";
    canvasContext.fillStyle = "#FFFFFF";
    canvasContext.fill();
    canvasContext.globalCompositeOperation = oldGlobalCompositeOperation;
    canvasContext.fillStyle = oldFillStyle;
  }

  // Prepares a rect (with rounded corners).
  // Doesn't take any action further
  static _prepareRoundedCornerClip(
    canvasContext: any,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    canvasContext.beginPath();
    canvasContext.moveTo(x, y);
    canvasContext.arcTo(x + w, y, x + w, y + h, r);
    canvasContext.arcTo(x + w, y + h, x, y + h, r);
    canvasContext.arcTo(x, y + h, x, y, r);
    canvasContext.arcTo(x, y, x + w, y, r);
    canvasContext.closePath();
  }

  // Draws a basic dot (with rounded corners)
  // Color must be selected before
  static _drawDot(
    canvasContext: any,
    left: number,
    top: number,
    nSize: number,
    scale: number,
    round: number
  ): void {
    AwesomeQR._prepareRoundedCornerClip(
      canvasContext,
      (left + (1 - scale) / 2) * nSize,
      (top + (1 - scale) / 2) * nSize,
      scale * nSize,
      scale * nSize,
      0.5 * scale * round * nSize
    );
    canvasContext.fill();
  }

  // Draws a tipical telegram dot
  // Cares about siblings
  static _drawTelegramDot(
    canvasContext: any,
    left: number,
    top: number,
    nSize: number,
    round: number,
    otherCells: {
      top: boolean;
      left: boolean;
      right: boolean;
      bottom: boolean;
    }
  ): void {
    const x = left * nSize;
    const y = top * nSize;
    const roundPx = (round * nSize) / 2;
    canvasContext.beginPath();
    canvasContext.moveTo(x, y);
    canvasContext.arcTo(
      x + nSize,
      y,
      x + nSize,
      y + nSize,
      otherCells.top || otherCells.right ? 0 : roundPx
    );
    canvasContext.arcTo(
      x + nSize,
      y + nSize,
      x,
      y + nSize,
      otherCells.bottom || otherCells.right ? 0 : roundPx
    );
    canvasContext.arcTo(
      x,
      y + nSize,
      x,
      y,
      otherCells.bottom || otherCells.left ? 0 : roundPx
    );
    canvasContext.arcTo(
      x,
      y,
      x + nSize,
      y,
      otherCells.top || otherCells.left ? 0 : roundPx
    );
    canvasContext.closePath();
    canvasContext.fill();
  }

  // Decides which function to call to draw a dot
  // Depends on the "drawFunction" option
  private _drawPoint(
    canvasContext: any,
    left: number,
    top: number,
    nSize: number,
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
  ): void {
    if (!this.options) return;
    let scale =
      this.options.dots?.scale ?? AwesomeQR.defaultOptions.dots.scale ?? 1;
    scale = clamp(scale, 0, 1);

    let round =
      this.options.dots?.round ?? AwesomeQR.defaultOptions.dots.round ?? 0;
    round = clamp(round, 0, 1);

    const drawFunction = this.options.drawFunction;
    if (drawFunction === "telegram") {
      return AwesomeQR._drawTelegramDot(
        canvasContext,
        left,
        top,
        nSize,
        round,
        otherCells
      );
    } else if (typeof drawFunction === "function") {
      return drawFunction(
        canvasContext,
        left,
        top,
        nSize,
        scale,
        round,
        parameters,
        otherCells
      );
    } else {
      return AwesomeQR._drawDot(canvasContext, left, top, nSize, scale, round);
    }
  }

  // Draws a single finder
  private _drawFinder(
    canvasContext: any,
    left: number,
    top: number,
    nSize: number
  ): void {
    if (!this.options) return;
    // range [0-1]
    let round =
      this.options.finder?.round ?? AwesomeQR.defaultOptions.finder.round ?? 0;
    round = clamp(round, 0, 1);
    AwesomeQR._prepareRoundedCornerClip(
      canvasContext,
      left * nSize,
      top * nSize,
      7 * nSize,
      7 * nSize,
      3.5 * round * nSize
    );
    canvasContext.fill();
    AwesomeQR._prepareRoundedCornerClip(
      canvasContext,
      (left + 1) * nSize,
      (top + 1) * nSize,
      5 * nSize,
      5 * nSize,
      2.5 * round * nSize
    );
    AwesomeQR._removePortion(canvasContext);
    AwesomeQR._prepareRoundedCornerClip(
      canvasContext,
      (left + 2) * nSize,
      (top + 2) * nSize,
      3 * nSize,
      3 * nSize,
      1.5 * round * nSize
    );
    canvasContext.fill();
  }

  // Draws the foreground canvas (dot, finders and logo)
  private async _drawForeground(): Promise<CanvasLike> {
    if (!this.options || !this.qrCode)
      throw new Error("Must call setOptions before draw");
    /**
     * Count of the squares
     */
    const nCount = this.qrCode.moduleCount;
    /**
     * Original size
     */
    const initialSize = this.options.size ?? AwesomeQR.defaultOptions.size;

    /**
     * Size of a single dot
     */
    const nSize = Math.ceil(initialSize / nCount);
    /**
     * Internal size
     */
    const size = nSize * nCount;

    const mainCanvas = this.createCanvas(size, size);
    const mainCanvasContext = mainCanvas.getContext("2d");
    mainCanvasContext.fillStyle =
      this.options.color ?? AwesomeQR.defaultOptions.color;

    if (this.options.onEvent) {
      this.options.onEvent("start-foreground", mainCanvasContext, {
        nCount,
        nSize,
      });
    }

    const alignmentPatternCenters = QRUtil.getPatternPosition(
      this.qrCode.typeNumber
    );

    let logoOptions: LogoOptions | null = null;
    let logoSideX: number = nCount / 2;
    let logoSideY: number = nCount / 2;
    if (this.options.logo?.image) {
      const logoImage = await this.loadImage(this.options.logo.image);

      let logoScale =
        this.options.logo.scale ?? AwesomeQR.defaultOptions.logo.scale ?? 0;
      logoScale = clamp(logoScale, 0, 1);

      let logoMargin =
        this.options.logo.margin ?? AwesomeQR.defaultOptions.logo.margin ?? 0;
      if (logoMargin < 0) {
        logoMargin = 0;
      }

      let displayRatioX = 1;
      let displayRatioY = 1;
      if (logoImage.width > logoImage.height) {
        displayRatioY = logoImage.height / logoImage.width;
      } else {
        displayRatioX = logoImage.width / logoImage.height;
      }

      const logoSpace = size * logoScale;
      const logoX = 0.5 * (size - logoSpace * displayRatioX);
      const logoY = 0.5 * (size - logoSpace * displayRatioY);

      logoSideX = Math.floor((logoX - logoMargin) / nSize);
      logoSideY = Math.floor((logoY - logoMargin) / nSize);

      logoOptions = {
        scale: logoScale,
        image: logoImage,
        logoX,
        logoY,
      };
    }

    const isInLogoZone = (row: number, col: number) =>
      col >= logoSideX &&
      col < nCount - logoSideX &&
      row >= logoSideY &&
      row < nCount - logoSideY;

    for (let row = 0; row < nCount; row++) {
      for (let col = 0; col < nCount; col++) {
        const isBlkPosCtr =
          (col < 8 && (row < 8 || row >= nCount - 8)) ||
          (col >= nCount - 8 && row < 8);
        // If in finder zone then don't print at all
        if (isBlkPosCtr) continue;

        const isLogoZone = isInLogoZone(row, col);
        // If in logo zone then don't print at all
        if (isLogoZone) continue;

        const isTiming =
          (row == 6 && col >= 8 && col <= nCount - 8) ||
          (col == 6 && row >= 8 && row <= nCount - 8);

        let isAlignment = false;
        for (let i = 0; i < alignmentPatternCenters.length; i++) {
          for (let j = 0; j < alignmentPatternCenters.length; j++) {
            // Check if point is on the border of the alignment pattern
            if (
              row >= alignmentPatternCenters[i] - 2 &&
              row <= alignmentPatternCenters[i] + 2 &&
              col >= alignmentPatternCenters[j] - 2 &&
              col <= alignmentPatternCenters[j] + 2
            ) {
              isAlignment = true;
              break;
            }
            // Check if point is the center of the alignment pattern
            if (
              row == alignmentPatternCenters[i] &&
              col == alignmentPatternCenters[j]
            ) {
              isAlignment = true;
              break;
            }
          }
        }

        const bIsDark = !!this.qrCode.isDark(row, col);

        if (bIsDark) {
          this._drawPoint(
            mainCanvasContext,
            col,
            row,
            nSize,
            {
              isTiming,
              isAlignment,
            },
            {
              top:
                (row != 0 &&
                  this.qrCode.isDark(row - 1, col) &&
                  !isInLogoZone(row - 1, col)) ||
                false,
              left:
                (col != 0 &&
                  this.qrCode.isDark(row, col - 1) &&
                  !isInLogoZone(row, col - 1)) ||
                false,
              right:
                (col != nCount - 1 &&
                  this.qrCode.isDark(row, col + 1) &&
                  !isInLogoZone(row, col + 1)) ||
                false,
              bottom:
                (row != nCount - 1 &&
                  this.qrCode.isDark(row + 1, col) &&
                  !isInLogoZone(row + 1, col)) ||
                false,
            }
          );
        }
      }
    }

    // - FINDERS
    this._drawFinder(mainCanvasContext, 0, 0, nSize);
    this._drawFinder(mainCanvasContext, nCount - 7, 0, nSize);
    this._drawFinder(mainCanvasContext, 0, nCount - 7, nSize);

    let gradient;
    if (typeof this.options.gradient === "function") {
      const grad = this.options.gradient(mainCanvasContext, size);
      if (grad?.toString() == "[object CanvasGradient]") {
        gradient = grad;
      } else {
        console.error(
          "Returned object from gradient function does not seem to be a Gradient"
        );
      }
    } else if (typeof this.options.gradient === "object") {
      if (this.options.gradient.type === "linear") {
        const direction = this.options.gradient.direction;
        gradient = mainCanvasContext.createLinearGradient(
          0,
          0,
          direction === "to-right" ? size : 0,
          direction === "to-bottom" ? size : 0
        );
      } else {
        gradient = mainCanvasContext.createRadialGradient(
          size / 2,
          size / 2,
          0,
          size / 2,
          size / 2,
          (size / 2) * Math.SQRT2
        );
      }
      for (const colorStop of this.options.gradient.colorStops) {
        gradient.addColorStop(colorStop.stop, colorStop.color);
      }
    }

    if (gradient) {
      mainCanvasContext.fillStyle = gradient;
      mainCanvasContext.globalCompositeOperation = "source-in";
      mainCanvasContext.fillRect(0, 0, size, size);
      mainCanvasContext.globalCompositeOperation = "source-over";
    } else {
      if (this.options.onEvent) {
        this.options.onEvent("gradient", mainCanvasContext, {
          nSize,
          nCount,
          size,
        });
      }
    }

    if (logoOptions) {
      let logoCornerRound =
        this.options.logo?.round ?? AwesomeQR.defaultOptions.logo.round ?? 0;
      logoCornerRound = clamp(logoCornerRound, 0, 1);

      const logoSpaceWidth = size - 2 * logoOptions.logoX;
      const logoSpaceHeight = size - 2 * logoOptions.logoY;
      const isHeightMinor = logoSpaceHeight < logoSpaceWidth;

      // Draw logo image
      AwesomeQR._prepareRoundedCornerClip(
        mainCanvasContext,
        logoOptions.logoX,
        logoOptions.logoY,
        logoSpaceWidth,
        logoSpaceHeight,
        logoCornerRound *
          0.5 *
          (isHeightMinor ? logoSpaceHeight : logoSpaceWidth)
      );
      mainCanvasContext.clip();
      mainCanvasContext.drawImage(
        logoOptions.image,
        logoOptions.logoX,
        logoOptions.logoY,
        logoSpaceWidth,
        logoSpaceHeight
      );
    }

    if (this.options.onEvent) {
      this.options.onEvent("end-foreground", mainCanvasContext, {
        nCount,
        nSize,
      });
    }

    return mainCanvas;
  }

  // Draws the background canvas (image, colorBelow and colorAbove)
  private async _drawBackground(): Promise<void> {
    if (!this.options || !this.qrCode)
      throw new Error("Must call setOptions before draw");
    if (!this.options.background) {
      return;
    }

    const size = this.options.size ?? AwesomeQR.defaultOptions.size ?? 0;
    const margin =
      this.options.margin?.size ?? AwesomeQR.defaultOptions.margin?.size ?? 0;
    const bgMargin = this.options.margin?.color ? margin : 0;
    if (this.options.onEvent) {
      this.options.onEvent("start-background", this.canvasContext);
    }
    if (this.options.background.colorBelow) {
      this.canvasContext.fillStyle = this.options.background.colorBelow;
      this.canvasContext.fillRect(
        bgMargin,
        bgMargin,
        size - 2 * bgMargin,
        size - 2 * bgMargin
      );
    }
    if (this.options.background.image) {
      const backgroundImage = await this.loadImage(
        this.options.background.image
      );
      this.canvasContext.drawImage(
        backgroundImage,
        bgMargin,
        bgMargin,
        size - 2 * bgMargin,
        size - 2 * bgMargin
      );
    }
    if (this.options.background.colorAbove) {
      this.canvasContext.fillStyle = this.options.background.colorAbove;
      this.canvasContext.fillRect(
        bgMargin,
        bgMargin,
        size - 2 * bgMargin,
        size - 2 * bgMargin
      );
    }
    if (this.options.onEvent) {
      this.options.onEvent("end-background", this.canvasContext);
    }
  }

  // Draws the qrcode. Merges the foreground with the background
  private async _draw(): Promise<Buffer | undefined> {
    if (!this.options || !this.qrCode)
      throw new Error("Must call setOptions before draw");

    const size = this.options.size ?? AwesomeQR.defaultOptions.size ?? 0;

    let margin =
      this.options.margin?.size ?? AwesomeQR.defaultOptions.margin.size ?? 0;

    if (margin < 0 || margin * 2 >= size) {
      margin = 0;
    }

    this._clear();

    const mainCanvas = await this._drawForeground();
    await this._drawBackground();

    // Apply foreground to final canvas
    this.canvasContext.drawImage(
      mainCanvas,
      margin,
      margin,
      size - 2 * margin,
      size - 2 * margin
    );

    // Fill the margin
    if (this.options.margin?.color) {
      this.canvasContext.fillStyle = this.options.margin.color;
      this.canvasContext.fillRect(0, 0, size - margin, margin);
      this.canvasContext.fillRect(size - margin, 0, margin, size - margin);
      this.canvasContext.fillRect(margin, size - margin, size - margin, margin);
      this.canvasContext.fillRect(0, margin, margin, size - margin);
    }

    if (this.options.onEvent) {
      this.options.onEvent("final-canvas", this.canvasContext);
    }

    if (this.canvas.toBuffer) {
      return this.canvas.toBuffer();
    }

    return;
  }
}
