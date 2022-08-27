# @qrcode-js/node

## Description

This is a wrapper around the core package, enabling creation of QRs on the server side, on Node environments.

Behind the scenes it uses the `canvas` package to use the canvas like the built-in in browsers.

## Example

```typescript
import QRCodeNode from "@qrcode-js/node";
import { promises as fs } from "fs";

async function main() {
  const myQR = QRCodeNode({
    text: "https://github.com/qrcode-js/qrcode",
    colorDark: "#123456",
    size: 1000,
    logo: { round: 0.4, margin: 0 },
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
  await myQR.draw().then((d) => fs.writeFile("dist/qrcode.png", d));
}
main().catch(console.error);
```
