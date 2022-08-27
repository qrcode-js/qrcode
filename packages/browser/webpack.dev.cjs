const path = require("path");

module.exports = {
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
    path: path.resolve(__dirname, "./dist"),
    filename: "dev.js",
    libraryTarget: "umd",
    globalObject: "this",
    library: "QRCode",
  },
};
