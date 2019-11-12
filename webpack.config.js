var path = require('path');

module.exports = {
  entry: {
    app: './main.ts'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'planetgen.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  devtool: 'source-map',
  plugins: [
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
