import { AwesomeQR, Options } from "@qrcode-js/core";
export { AwesomeQR };

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function loadImage(url: string) {
  const image = new Image();
  image.src = url;
  return image;
}

export function QRCodeBrowser(canvas: HTMLCanvasElement, options: Options) {
  return new AwesomeQR(canvas, createCanvas, loadImage, options);
}
