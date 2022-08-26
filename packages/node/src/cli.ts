import arg from "arg";
import set from "lodash/set";
import { promises as fs } from "fs";
import QRCodeNode from ".";
import type { Options } from "@qrcode-js/core";

async function main(): Promise<void> {
  const args = arg(
    {
      "--help": Boolean,
      "--opt": [String],
    },
    { permissive: true }
  );

  if (args["--help"]) {
    console.log("This should be a better helper");
    console.log("usage: cli.js [options...] pathOutput");
    console.log("2 parameters as options: --help and --opt");
    console.log("  --help: Display this help");
    console.log(
      "  --opt: Specify an option to customize the QR. Can be passed multiple times"
    );
    console.log(
      "To see the options available please refer to documentation of @qrcode-js/core (check version before starting reading)"
    );
    console.log(
      "Check lodash 'set' function to understand better or see the example below"
    );
    console.log(
      "(yarn or npm run) qrcode --opt text='this a example' --opt colorDark='#123456' path/to/qr.png"
    );
    return;
  }

  if (args._.length > 1) {
    throw "Unknown arguments passed: " + args._.slice(1).join(", ");
  }
  if (args._.length == 0) {
    throw "No output location passed";
  }
  // Force because it's checked its existance.
  const output = args._[0]!;

  const options: Partial<Options> = {};

  for (let opt of args["--opt"]!) {
    let equalPosition = opt.indexOf("=");
    let key = opt.slice(0, equalPosition);
    let value = opt.slice(equalPosition + 1);
    set<Options>(options, key, parseFloat(value) ? parseFloat(value) : value);
  }

  const myQR = QRCodeNode(options as Options);
  await myQR.draw().then((d) => fs.writeFile(output, d));
}
main().catch(console.error);
