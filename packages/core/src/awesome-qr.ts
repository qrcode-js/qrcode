import { QRCodeModel, QRErrorCorrectLevel, QRUtil } from "./qrcode.js";
import merge from "lodash/merge.js";
import cloneDeep from "lodash/cloneDeep.js";
import type { Options } from "./types.js";

const defaultScale = 0.4;

export class AwesomeQR {
  // Functions dependent on environment (Node.js or browser)
  private createCanvas: Function;
  private loadImage: Function;

  // Output canvas and context
  // In browser is passed with invocation
  // In Node it is created at runtime
  private canvas: any;
  private canvasContext: CanvasRenderingContext2D;
  private qrCode: QRCodeModel;
  private options: Required<Options>;

  static CorrectLevel = QRErrorCorrectLevel;

  static defaultOptions: Options = {
    text: "",
    size: 400,
    margin: 20,
    colorDark: "#000000",
    colorLight: "rgba(0,0,0,0)",
    qr: {
      correctLevel: QRErrorCorrectLevel.M,
    },
    background: { dimming: "rgba(0,0,0,0)" },
    logo: { scale: 0.2, margin: 10, round: 0.4 },
    whiteMargin: false,
    autoColor: true,
    dots: {
      scale: 1,
      round: 0,
    },
    finder: {
      round: 0,
    },
  };

  constructor(
    canvas: HTMLCanvasElement | any,
    createCanvas:
      | ((width: number, height: number) => HTMLCanvasElement)
      | Function,
    loadImage: Function,
    options: Options
  ) {
    const _options = cloneDeep(AwesomeQR.defaultOptions);

    merge(_options, options);

    this.createCanvas = createCanvas;
    this.loadImage = loadImage;

    this.options = _options as Required<Options>;
    this.canvas = canvas;
    this.canvas.width = this.options.size!;
    this.canvas.height = this.options.size!;
    this.canvasContext = this.canvas.getContext("2d");
    this.qrCode = new QRCodeModel(-1, this.options.qr.correctLevel);
    if (Number.isInteger(this.options.qr.maskPattern)) {
      this.qrCode.maskPattern = this.options.qr.maskPattern!;
    }
    if (Number.isInteger(this.options.qr.version)) {
      this.qrCode.typeNumber = this.options.qr.version!;
    }
    this.qrCode.addData(this.options.text);
    this.qrCode.make();
  }

  draw(): Promise<Buffer | string> {
    return new Promise((resolve) => this._draw().then(resolve));
  }

  private _clear() {
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  static _removePortion(canvasContext: CanvasRenderingContext2D) {
    const oldGlobalCompositeOperation = canvasContext.globalCompositeOperation;
    const oldFillStyle = canvasContext.fillStyle;
    canvasContext.globalCompositeOperation = "destination-out";
    canvasContext.fillStyle = "#FFFFFF";
    canvasContext.fill();
    canvasContext.globalCompositeOperation = oldGlobalCompositeOperation;
    canvasContext.fillStyle = oldFillStyle;
  }

  static _prepareRoundedCornerClip(
    canvasContext: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    canvasContext.beginPath();
    canvasContext.moveTo(x, y);
    canvasContext.arcTo(x + w, y, x + w, y + h, r);
    canvasContext.arcTo(x + w, y + h, x, y + h, r);
    canvasContext.arcTo(x, y + h, x, y, r);
    canvasContext.arcTo(x, y, x + w, y, r);
    canvasContext.closePath();
  }

  private static _getAverageRGB(createCanvas: Function, image: any) {
    const blockSize = 5;
    const defaultRGB = {
      r: 0,
      g: 0,
      b: 0,
    };
    let width, height;
    let i = -4;
    const rgb = {
      r: 0,
      g: 0,
      b: 0,
    };
    let count = 0;

    height = image.naturalHeight || image.height;
    width = image.naturalWidth || image.width;

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    if (!context) {
      return defaultRGB;
    }

    context.drawImage(image, 0, 0);

    let data;
    try {
      data = context.getImageData(0, 0, width, height);
    } catch (e) {
      return defaultRGB;
    }

    while ((i += blockSize * 4) < data.data.length) {
      if (
        data.data[i] > 200 ||
        data.data[i + 1] > 200 ||
        data.data[i + 2] > 200
      )
        continue;
      ++count;
      rgb.r += data.data[i];
      rgb.g += data.data[i + 1];
      rgb.b += data.data[i + 2];
    }

    rgb.r = ~~(rgb.r / count);
    rgb.g = ~~(rgb.g / count);
    rgb.b = ~~(rgb.b / count);

    return rgb;
  }

  static _drawDot(
    canvasContext: CanvasRenderingContext2D,
    left: number,
    top: number,
    nSize: number,
    scale: number,
    round: number
  ) {
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

  static _drawTelegramDot(
    canvasContext: CanvasRenderingContext2D,
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
  ) {
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

  private _drawPoint(
    canvasContext: CanvasRenderingContext2D,
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
  ) {
    const scale = this.options.dots.scale || defaultScale;
    const round = this.options.dots.round || 0;
    const drawFunction = this.options.drawFunction;
    if (drawFunction === undefined) {
      return AwesomeQR._drawDot(canvasContext, left, top, nSize, scale, round);
    } else if (drawFunction == "telegram") {
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
    }
  }

  private _drawFinder(
    canvasContext: CanvasRenderingContext2D,
    left: number,
    top: number,
    size: number
  ) {
    // range [0-1]
    const rounded = Math.min(Math.max(this.options.finder.round || 0, 0), 1);
    AwesomeQR._prepareRoundedCornerClip(
      canvasContext,
      left * size,
      top * size,
      7 * size,
      7 * size,
      3.5 * rounded * size
    );
    canvasContext.fill();
    AwesomeQR._prepareRoundedCornerClip(
      canvasContext,
      (left + 1) * size,
      (top + 1) * size,
      5 * size,
      5 * size,
      2.5 * rounded * size
    );
    AwesomeQR._removePortion(canvasContext);
    AwesomeQR._prepareRoundedCornerClip(
      canvasContext,
      (left + 2) * size,
      (top + 2) * size,
      3 * size,
      3 * size,
      1.5 * rounded * size
    );
    canvasContext.fill();
  }

  private async _draw(): Promise<Buffer | string> {
    const nCount = this.qrCode.moduleCount!;
    const rawSize = this.options.size!;
    let rawMargin = this.options.margin!;

    if (rawMargin < 0 || rawMargin * 2 >= rawSize) {
      rawMargin = 0;
    }

    const rawViewportSize = rawSize - 2 * rawMargin;
    const margin = Math.ceil(rawMargin);

    /**
     * Size of a single dot
     */
    const nSize = Math.ceil(rawViewportSize / nCount);
    /**
     * Internal size (no margin)
     */
    const viewportSize = nSize * nCount;
    /**
     * Internal size + 2 * margin
     */
    const size = viewportSize + 2 * margin;

    const mainCanvas = this.createCanvas(size, size);
    const mainCanvasContext: CanvasRenderingContext2D =
      mainCanvas.getContext("2d");
    mainCanvasContext.fillStyle = this.options.colorDark!;

    this._clear();

    // Translate to make the top and left margins off the viewport
    mainCanvasContext.save();
    mainCanvasContext.translate(margin, margin);

    if (this.options.onEvent) {
      this.options.onEvent("start-foreground", mainCanvasContext, {
        nCount,
        nSize,
      });
    }

    const alignmentPatternCenters = QRUtil.getPatternPosition(
      this.qrCode.typeNumber
    )!;

    var logoSide: number = nCount / 2;
    if (!!this.options.logo.image) {
      const logoScale = Math.min(Math.max(this.options.logo.scale!, 0), 1);
      let logoMargin = this.options.logo.margin!;
      if (logoMargin < 0) {
        logoMargin = 0;
      }

      const logoSize = viewportSize * logoScale;
      const logoX = 0.5 * (viewportSize - logoSize);

      logoSide = Math.floor(logoX / nSize);
    }

    const isInLogoZone = (row: number, col: number) =>
      col >= logoSide &&
      col < nCount - logoSide &&
      row >= logoSide &&
      row < nCount - logoSide;

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
              row >= alignmentPatternCenters[i]! - 2 &&
              row <= alignmentPatternCenters[i]! + 2 &&
              col >= alignmentPatternCenters[j]! - 2 &&
              col <= alignmentPatternCenters[j]! + 2
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

    // - FINDER

    this._drawFinder(mainCanvasContext, 0, 0, nSize);
    this._drawFinder(mainCanvasContext, nCount - 7, 0, nSize);
    this._drawFinder(mainCanvasContext, 0, nCount - 7, nSize);

    if (typeof this.options.gradient === "function") {
      const gradient = this.options.gradient(mainCanvasContext, viewportSize);
      mainCanvasContext.fillStyle = gradient;
      mainCanvasContext.globalCompositeOperation = "source-in";
      mainCanvasContext.fillRect(0, 0, viewportSize, viewportSize);
      mainCanvasContext.globalCompositeOperation = "source-over";
    }

    // Fill the margin
    if (this.options.whiteMargin) {
      mainCanvasContext.fillStyle = "#FFFFFF";
      mainCanvasContext.fillRect(-margin, -margin, size, margin);
      mainCanvasContext.fillRect(-margin, viewportSize, size, margin);
      mainCanvasContext.fillRect(viewportSize, -margin, margin, size);
      mainCanvasContext.fillRect(-margin, -margin, margin, size);
    }

    if (!!this.options.logo.image) {
      const logoImage = await this.loadImage(this.options.logo.image!);

      const logoScale = Math.min(Math.max(this.options.logo.scale!, 0), 1);
      let logoMargin = this.options.logo.margin!;
      const logoCornerRadius = Math.min(
        Math.max(this.options.logo.round!, 0),
        1
      );
      if (logoMargin < 0) {
        logoMargin = 0;
      }

      const logoSize = viewportSize * logoScale;
      const logoX = 0.5 * (viewportSize - logoSize);

      // Draw logo image
      AwesomeQR._prepareRoundedCornerClip(
        mainCanvasContext,
        logoX,
        logoX,
        logoSize,
        logoSize,
        logoCornerRadius * logoSize * 0.5
      );
      mainCanvasContext.clip();
      mainCanvasContext.drawImage(logoImage, logoX, logoX, logoSize, logoSize);
    }

    if (this.options.onEvent) {
      this.options.onEvent("end-foreground", mainCanvasContext, {
        nCount,
        nSize,
      });
    }

    const backgroundCanvas = this.createCanvas(size, size);
    const backgroundCanvasContext: CanvasRenderingContext2D =
      backgroundCanvas.getContext("2d");

    if (this.options.onEvent) {
      this.options.onEvent("start-background", backgroundCanvasContext, {
        nCount,
        nSize,
      });
    }

    if (!!this.options.background.image) {
      const backgroundImage = await this.loadImage(
        this.options.background.image!
      );

      const backgroundDimming = this.options.background.dimming!;

      if (this.options.autoColor) {
        const avgRGB = AwesomeQR._getAverageRGB(
          this.createCanvas,
          backgroundImage
        );
        this.options.colorDark = `rgb(${avgRGB.r},${avgRGB.g},${avgRGB.b})`;
      }

      backgroundCanvasContext.drawImage(backgroundImage, 0, 0, size, size);
      backgroundCanvasContext.rect(0, 0, size, size);
      backgroundCanvasContext.fillStyle = backgroundDimming;
      backgroundCanvasContext.fill();
    } else {
      backgroundCanvasContext.rect(0, 0, size, size);
      backgroundCanvasContext.fillStyle = this.options.colorLight!;
      backgroundCanvasContext.fill();
    }

    if (this.options.onEvent) {
      this.options.onEvent("end-background", backgroundCanvasContext, {
        nCount,
        nSize,
      });
    }

    // Apply foreground to background canvas
    backgroundCanvasContext.drawImage(mainCanvas, 0, 0);
    // Scale the final image
    this.canvasContext.drawImage(backgroundCanvas, 0, 0, rawSize, rawSize);

    if (this.options.onEvent) {
      this.options.onEvent("final-canvas", this.canvasContext, {
        nCount,
        nSize,
      });
    }

    if (isElement(this.canvas)) {
      return Promise.resolve(this.canvas.toDataURL());
    }

    return Promise.resolve(this.canvas.toBuffer());
  }
}

function isElement(obj: any): boolean {
  try {
    //Using W3 DOM2 (works for FF, Opera and Chrome)
    return obj instanceof HTMLElement;
  } catch (e) {
    //Browsers not supporting W3 DOM2 don't have HTMLElement and
    //an exception is thrown and we end up here. Testing some
    //properties that all elements have (works on IE7)
    return (
      typeof obj === "object" &&
      obj.nodeType === 1 &&
      typeof obj.style === "object" &&
      typeof obj.ownerDocument === "object"
    );
  }
}
