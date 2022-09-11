import path from "node:path";
import { fileURLToPath } from "node:url";

export default {
  mode: "production",
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    path: path.join(fileURLToPath(import.meta.url), "../dist"),
    filename: "index.js",
    libraryTarget: "umd",
    globalObject: "this",
    library: "QRCode",
  },
};
