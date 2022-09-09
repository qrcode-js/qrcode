import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "node:fs/promises";
import QRCodeNode from "./index.js";
import type { Options } from "@qrcode-js/core";

async function main(): Promise<void> {
  yargs(hideBin(process.argv))
    .scriptName("qrcode")
    .command(
      "$0 [options] <output_path>",
      "All options are prefixed with '--opt.'. Example: --opt.text 'this is a text', or --opt.margin.size 40",
      {},
      handleDefaultCommand
    )
    .option("opt", {
      default: {},
    })
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
