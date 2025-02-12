import path from "path";
import { fileURLToPath } from "url";

import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  mode: "development",
  devtool: "inline-source-map",
  target: "webworker",
  entry: {
    background: "./src/background.js",
    popup: "./src/popup.js",
    content: "./src/content.js",
    options: "./src/options.js",
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js",
    globalObject: "this",
  },
  resolve: {
    alias: {
      "@huggingface/transformers": path.resolve(
        __dirname,
        "node_modules/@huggingface/transformers"
      ),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/popup.html",
      filename: "popup.html",
    }),
    new HtmlWebpackPlugin({
      template: "./src/options.html",
      filename: "options.html",
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "public",
          to: ".", // Copies to build folder
        },
        {
          from: "src/popup.css",
          to: "popup.css",
        },
        {
          from: "src/content.css",
          to: "content.css",
        },
      ],
    }),
  ],
};

export default config;
