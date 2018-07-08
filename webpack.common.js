const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: {
        main: './src/js/main.js',
        restaurant_info: './src/js/restaurant_info.js',
        swindex: './src/js/sw/index.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname, 'src'),
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.css$/,
                include: path.resolve(__dirname, 'src'),
                use: ['style-loader', MiniCssExtractPlugin.loader, 'css-loader']
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(['dist'], {
            exclude: ['polyfills.bundle.js', 'polyfills.bundle.js.map', 'img', 'noimg.png', 'noimg.svg', 'loadjs.min.js', 'sw.js', 'manifest.json', 'icon-144x144.png', 'icon-192x192.png', 'icon-512x512.png']
        }),
        new MiniCssExtractPlugin({
            filename: 'style.bundle.css'
        }),
        new HtmlWebpackPlugin({
            inject: false,
            title: 'Restaurant Reviews',
            template: './src/index.html',
            filename: 'index.html'

        }),
        new HtmlWebpackPlugin({
            inject: false,
            title: 'Restaurant Info',
            template: './src/restaurant.html',
            filename: 'restaurant.html'
        })
    ]
};