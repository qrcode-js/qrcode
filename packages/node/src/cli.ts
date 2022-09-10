import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "node:fs/promises";
import QRCodeNode from "./index.js";
import type { Options } from "@qrcode-js/core";

async function main(): Promise<void> {
  yargs(hideBin(process.argv))
    .scriptName("qrcode")
    .usage(
      "$0 <output_path> [options...]\n\nAll options are prefixed with '--opt.'. Example: --opt.text 'this is a text', or --opt.margin.size 40"
    )
    .command(
      "$0 <output_path>",
      "",
      (yargs) => {
        yargs.option("opt", {
          string: true,
          describe: "Used to set options for creating the QR. See above.",
          default: {},
        });
      },
      handleDefaultCommand
    )
    .wrap(null)
    .strict()
    .parseSync();
}

function handleDefaultCommand(args: any) {
  const myQR = QRCodeNode(args.opt as Options);
  myQR.draw().then((d) => {
    if (!d) {
      console.error(
        "Error. Received undefined despite being on Node. Please report this!"
      );
      return;
    }
    fs.writeFile(args.output_path, d);
  });
}
main().catch(console.error);
