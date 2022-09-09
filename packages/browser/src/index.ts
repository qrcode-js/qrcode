import { AwesomeQR, Options } from "@qrcode-js/core";
export { AwesomeQR };

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function loadImage(url: string) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = url;
  });
}

export function QRCodeBrowser(canvas: HTMLCanvasElement, options: Options) {
  return new AwesomeQR(canvas, createCanvas, loadImage, options);
}
