import QRCodeNode from "./lib/index.js";
import fs from "node:fs/promises";

async function init() {
  const myQR = QRCodeNode();
  myQR.setOptions({
    text: "https://github.com/qrcode-js/qrcode",
    color: "#005c66",
    size: 1000,
    dots: {
      scale: 0.75,
      round: 1,
    },
    finder: {
      round: 0.5,
    },
    gradient: (ctx, size) => {
      const gradient = ctx.createLinearGradient(0, 0, size, 0);
      gradient.addColorStop(0, "green");
      gradient.addColorStop(0.5, "grey");
      gradient.addColorStop(1, "red");
      return gradient;
    },
    drawFunction: "telegram",
    // drawFunction: (
    //   canvasContext,
    //   left,
    //   top,
    //   nSize,
    //   scale,
    //   round,
    //   parameters,
    //   otherCells
    // ) => {
    //   if (parameters.isTiming) {
    //     AwesomeQR._drawDot(canvasContext, left, top, nSize, scale, round);
    //   }
    // },
  });

  await fs.mkdir("dist", { recursive: true });
  await myQR.draw().then((d) => {
    if (!d) {
      console.error(
        "Error. Received undefined despite being on Node. Please report this!",
      );
      return;
    }
    fs.writeFile("dist/qrcode.png", d);
  });
}
init();
