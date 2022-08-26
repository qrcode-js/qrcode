import { createCanvas, loadImage } from "canvas";
import { AwesomeQR, Options } from "@qrcode-js/core";
export { AwesomeQR };

export default function QRCodeNode(options: Options) {
  const size = options.size || 400;
  const canvas = createCanvas(size, size);
  return new AwesomeQR(canvas, createCanvas, loadImage, options);
}
