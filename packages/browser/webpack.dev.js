import path from "path";

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
    path: path.resolve(path.dirname(import.meta.url).slice(8), "./dist"),
    filename: "dev.js",
    libraryTarget: "umd",
    globalObject: "this",
    library: "QRCode",
  },
};
