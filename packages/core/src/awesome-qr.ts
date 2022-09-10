import { QRCodeModel, QRErrorCorrectLevel, QRUtil } from "./qrcode.js";
import type { Options } from "./types.js";

interface BaseCanvas {
  width: number;
  height: number;
  getContext: (ctx: "2d") => any;
  toBuffer?: () => any;
}

const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

export class AwesomeQR<Canvas extends BaseCanvas> {
  // Functions dependent on environment (Node.js or browser)
  private createCanvas;
  private loadImage;

  // Output canvas and context
  // In browser it is passed with invocation
  // In Node it is created at runtime
  private canvas;
  private canvasContext;
  private qrCode;
  private options;

  static CorrectLevel = QRErrorCorrectLevel;

  static defaultOptions: Options = {
    text: "",
    size: 400,
    margin: { size: 20 },
    color: "#000000",
    qr: {
      correctLevel: QRErrorCorrectLevel.M,
    },
    logo: { scale: 0.2, margin: 10, round: 0.4, image: "" },
    dots: {
      scale: 1,
      round: 0,
    },
    finder: {
      round: 0,
    },
  };

  constructor(
    canvas: Canvas,
    createCanvas: (width: number, height: number) => Canvas,
    loadImage: any,
    options: Options
  ) {
    // Save arguments
    this.canvas = canvas;
    this.createCanvas = createCanvas;
    this.loadImage = loadImage;
    this.options = options;

    const size = this.options.size ?? AwesomeQR.defaultOptions.size ?? 0;
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvasContext = this.canvas.getContext("2d");

    const correctLevel =
      this.options.qr?.correctLevel ??
      AwesomeQR.defaultOptions.qr?.correctLevel ??
      0;
    this.qrCode = new QRCodeModel(-1, correctLevel);

    const maskPattern =
      this.options.qr?.maskPattern ??
      AwesomeQR.defaultOptions.qr?.maskPattern ??
      0;
    if (Number.isInteger(maskPattern)) {
      this.qrCode.maskPattern = maskPattern;
    }

    const version =
      this.options.qr?.version ?? AwesomeQR.defaultOptions.qr?.version ?? 0;
    if (Number.isInteger(version)) {
      this.qrCode.typeNumber = version;
    }

    this.qrCode.addData(this.options.text);
    this.qrCode.make();
  }

  draw(): Promise<Buffer | undefined> {
    return new Promise((resolve) => this._draw().then(resolve));
  }

  private _clear() {
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  static _removePortion(canvasContext: any) {
    const oldGlobalCompositeOperation = canvasContext.globalCompositeOperation;
    const oldFillStyle = canvasContext.fillStyle;
    canvasContext.globalCompositeOperation = "destination-out";
    canvasContext.fillStyle = "#FFFFFF";
    canvasContext.fill();
    canvasContext.globalCompositeOperation = oldGlobalCompositeOperation;
    canvasContext.fillStyle = oldFillStyle;
  }

  static _prepareRoundedCornerClip(
    canvasContext: any,
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

  static _drawDot(
    canvasContext: any,
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
  ) {
    let scale =
      this.options.dots?.scale ?? AwesomeQR.defaultOptions.dots?.scale ?? 1;
    scale = clamp(scale, 0, 1);

    let round =
      this.options.dots?.round ?? AwesomeQR.defaultOptions.dots?.round ?? 0;
    round = clamp(round, 0, 1);

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
    canvasContext: any,
    left: number,
    top: number,
    size: number
  ) {
    // range [0-1]
    let round =
      this.options.finder?.round ?? AwesomeQR.defaultOptions.finder?.round ?? 0;
    round = clamp(round, 0, 1);
    AwesomeQR._prepareRoundedCornerClip(
      canvasContext,
      left * size,
      top * size,
      7 * size,
      7 * size,
      3.5 * round * size
    );
    canvasContext.fill();
    AwesomeQR._prepareRoundedCornerClip(
      canvasContext,
      (left + 1) * size,
      (top + 1) * size,
      5 * size,
      5 * size,
      2.5 * round * size
    );
    AwesomeQR._removePortion(canvasContext);
    AwesomeQR._prepareRoundedCornerClip(
      canvasContext,
      (left + 2) * size,
      (top + 2) * size,
      3 * size,
      3 * size,
      1.5 * round * size
    );
    canvasContext.fill();
  }

  private async _draw(): Promise<Buffer | undefined> {
    /**
     * Count of the squares
     */
    const nCount = this.qrCode.moduleCount;
    /**
     * Original size
     */
    const size = this.options.size ?? AwesomeQR.defaultOptions.size ?? 0;
    /**
     * Original margin
     */
    let margin =
      this.options.margin?.size ?? AwesomeQR.defaultOptions.margin?.size ?? 0;

    if (margin < 0 || margin * 2 >= size) {
      margin = 0;
    }

    const marginCeiled = Math.ceil(margin);

    /**
     * Size of a single dot
     */
    const nSize = Math.ceil((size - 2 * margin) / nCount);
    /**
     * Internal size (no margin)
     */
    const viewportSize = nSize * nCount;
    /**
     * Internal size + 2 * margin
     */
    const totalSize = viewportSize + 2 * marginCeiled;

    const mainCanvas = this.createCanvas(totalSize, totalSize);
    const mainCanvasContext = mainCanvas.getContext("2d");
    mainCanvasContext.fillStyle =
      this.options.color ?? AwesomeQR.defaultOptions.color ?? "";

    this._clear();

    // Translate to make the top and left margins off the viewport
    mainCanvasContext.save();
    mainCanvasContext.translate(marginCeiled, marginCeiled);

    if (this.options.onEvent) {
      this.options.onEvent("start-foreground", mainCanvasContext, {
        nCount,
        nSize,
      });
    }

    const alignmentPatternCenters = QRUtil.getPatternPosition(
      this.qrCode.typeNumber
    );

    let logoSide: number = nCount / 2;
    if (this.options.logo?.image) {
      let logoScale =
        this.options.logo.scale ?? AwesomeQR.defaultOptions.logo?.scale ?? 0;
      logoScale = clamp(logoScale, 0, 1);

      let logoMargin =
        this.options.logo.margin ?? AwesomeQR.defaultOptions.logo?.margin ?? 0;
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

    if (typeof this.options.gradient === "function") {
      const gradient = this.options.gradient(mainCanvasContext, viewportSize);
      if (gradient?.toString() == "[object CanvasGradient]") {
        mainCanvasContext.fillStyle = gradient;
        mainCanvasContext.globalCompositeOperation = "source-in";
        mainCanvasContext.fillRect(0, 0, viewportSize, viewportSize);
        mainCanvasContext.globalCompositeOperation = "source-over";
      } else {
        console.error(
          "Returned object from gradient function does not seem to be a Gradient"
        );
      }
    }

    // Fill the margin
    if (this.options.margin?.color) {
      mainCanvasContext.fillStyle = this.options.margin.color;
      mainCanvasContext.fillRect(
        -marginCeiled,
        -marginCeiled,
        totalSize - marginCeiled,
        marginCeiled
      );
      mainCanvasContext.fillRect(
        viewportSize,
        -marginCeiled,
        marginCeiled,
        totalSize - marginCeiled
      );
      mainCanvasContext.fillRect(
        0,
        viewportSize,
        totalSize - marginCeiled,
        marginCeiled
      );
      mainCanvasContext.fillRect(
        -marginCeiled,
        0,
        marginCeiled,
        totalSize - marginCeiled
      );
    }

    if (this.options.logo?.image) {
      const logoImage = await this.loadImage(this.options.logo.image);

      let logoScale =
        this.options.logo.scale ?? AwesomeQR.defaultOptions.logo?.scale ?? 1;
      logoScale = clamp(logoScale, 0, 1);

      let logoMargin =
        this.options.logo.margin ?? AwesomeQR.defaultOptions.logo?.margin ?? 0;
      if (logoMargin < 0) {
        logoMargin = 0;
      }

      let logoCornerRound =
        this.options.logo.round ?? AwesomeQR.defaultOptions.logo?.round ?? 0;
      logoCornerRound = clamp(logoCornerRound, 0, 1);

      const logoSize = viewportSize * logoScale;
      const logoX = 0.5 * (viewportSize - logoSize);

      // Draw logo image
      AwesomeQR._prepareRoundedCornerClip(
        mainCanvasContext,
        logoX,
        logoX,
        logoSize,
        logoSize,
        logoCornerRound * logoSize * 0.5
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

    if (this.options.background) {
      if (this.options.onEvent) {
        this.options.onEvent("start-background", this.canvasContext);
      }
      if (this.options.background.colorBelow) {
        this.canvasContext.fillStyle = this.options.background.colorBelow;
        this.canvasContext.fillRect(0, 0, size, size);
      }
      if (this.options.background.image) {
        const backgroundImage = await this.loadImage(
          this.options.background.image
        );

        this.canvasContext.drawImage(backgroundImage, 0, 0, size, size);
      }
      if (this.options.background.colorAbove) {
        this.canvasContext.fillStyle = this.options.background.colorAbove;
        this.canvasContext.fillRect(0, 0, size, size);
      }
      if (this.options.onEvent) {
        this.options.onEvent("end-background", this.canvasContext);
      }
    }

    // Apply foreground to final canvas
    this.canvasContext.drawImage(mainCanvas, 0, 0, size, size);

    if (this.options.onEvent) {
      this.options.onEvent("final-canvas", this.canvasContext);
    }

    if (this.canvas.toBuffer) {
      return Promise.resolve(this.canvas.toBuffer());
    }

    return;
  }
}
