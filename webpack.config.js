var path = require('path')
var webpack = require('webpack')
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var stylusLoader = ExtractTextPlugin.extract('style-loader', 'css-loader!stylus-loader')
var autoprefixer = require('autoprefixer-stylus')
var isProduction = process.env.NODE_ENV === 'production'


module.exports = {
    entry: {
        app: ['./js/entry.js'],
        styles: ['./styles/main.styl'], // Build css as separate bundle for production
        vendor: ['d3', 'react', 'topojson', 'jsnox', 'array.prototype.find'],
    },
    output: {
        path: path.join(__dirname, 'assets'),
        publicPath: '/assets/',
        filename: '[name].js'
    },
    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"},
            { test: /\.styl$/, loader: stylusLoader }
        ]
    },
    plugins: ([
        isProduction && new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        }),
        isProduction && new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),
        new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.js'),
        new ExtractTextPlugin('styles.css')
    ]).filter(function(x) { return !!x }),

    stylus: { use: [autoprefixer()] }
}
