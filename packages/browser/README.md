# @qrcode-js/browser

This is the wrapper around the core package to provide support in browsers.

## Examples

### (no framework)

```html
<html>
  <body>
    <canvas id="canvas"></canvas>
    <script src="https://unpkg.com/@qrcode-js/browser"></script>
    <script>
      const canvas = document.getElementById("canvas");
      const myQR = QRCode.QRCodeBrowser(canvas);
      myQR.setOptions({
        text: "https://github.com/qrcode-js/qrcode",
        color: "#123456",
        size: 450,
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
        //     QRCode.AwesomeQR._drawDot(canvasContext, left, top, nSize, scale, round);
        //   }
        // },
      });
      myQR.draw();
    </script>
  </body>
</html>
```

### Svelte

```html
<script>
  import { QRCodeBrowser } from "@qrcode-js/browser";
  import { onMount } from "svelte";

  let canvasElement;

  onMount(async () => {
    const qrCode = QRCodeBrowser(canvasElement);
    qrCode.setOptions({
      text: "https://github.com/qrcode-js/qrcode",
      size: 450,
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
      //     QRCode.AwesomeQR._drawDot(canvasContext, left, top, nSize, scale, round);
      //   }
      // },
    });
    qrCode.draw();
  });
</script>

<canvas bind:this={canvasElement} />
```

### React

Uses the useEffect hook to render only in browser context and not in SSR.
Also because SSR doesn't make much sense with canvas

```jsx
import { useRef } from "react";
import QRCodeBrowser from "@qrcode-js/browser";

export default function MyCanvas() {
  const canvasRef = useRef();
  useEffect(() => {
    if (!canvasRef.current) return;
    const myQR = QRCodeBrowser(canvasRef.current);
    myQR.setOptions({
      text: "https://github.com/qrcode-js/qrcode",
      colorDark: "#123456",
      size: 450,
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
      //     QRCode.AwesomeQR._drawDot(canvasContext, left, top, nSize, scale, round);
      //   }
      // },
    });
    myQR.draw();
  }, [canvasRef]);
  return <canvas ref={canvasRef}></canvas>;
}
```
