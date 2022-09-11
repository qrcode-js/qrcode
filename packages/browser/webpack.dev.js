import path from "node:path";
import { fileURLToPath } from "node:url";

export default {
  mode: "development",
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
  watch: true,
  output: {
    path: path.join(fileURLToPath(import.meta.url), "../dist"),
    filename: "dev.js",
    libraryTarget: "umd",
    globalObject: "this",
    library: "QRCode",
  },
};
