
const path = require('path');
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
  entry: {
    app: './src/main.ts'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'planetgen.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  devtool: 'source-map',
  devServer: {
    host: "0.0.0.0",
    port: 8080,
    disableHostCheck: true,
    contentBase: path.resolve(appDirectory, "./"),
    publicPath: "/",
    hot: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
        inject: true,
        template: path.resolve(appDirectory, "src/client/index.htm"),
    }),
    new CleanWebpackPlugin(),
  ],
  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'ts-loader',
      exclude: /node_modules/
    }]
  },
  mode: 'development'
}
