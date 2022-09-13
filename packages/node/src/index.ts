import { createCanvas, loadImage } from "canvas";
import { AwesomeQR } from "@qrcode-js/core";
export { AwesomeQR };

export default function QRCodeNode() {
  // Doesn't really matter size here
  // will be updated with setOptions
  const canvas = createCanvas(400, 400);
  return new AwesomeQR(canvas, createCanvas, loadImage);
}
