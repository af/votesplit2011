var path = require('path')
var webpack = require('webpack')
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var stylusLoader = ExtractTextPlugin.extract('style-loader', 'css-loader!stylus-loader')


module.exports = {
    entry: {
        app: ['./js/entry.js'],
        styles: ['./styles/main.styl'], // Build css as separate bundle for production
        vendor: ['d3', 'topojson'],
    },
    output: {
        path: path.join(__dirname, 'assets'),
        filename: '[name].js'
    },
    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"},
            { test: /\.styl$/, loader: stylusLoader }
        ]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.js'),
        new ExtractTextPlugin('main.css')
    ]
}
