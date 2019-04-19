'use strict';

const Visualizer = require('webpack-visualizer-plugin');

const path = require('path');
const webpack = require('webpack');

const DEFAULTS = {
    isDevelopment: process.env.NODE_ENV !== 'production',
    baseDir: path.join(__dirname, '..'),
};

module.exports = {
    mode: (DEFAULTS.isDevelopment ? "development" : "production"),
    entry: "./dist/index",
    output: {
        path: path.resolve(__dirname, "dist", "browser"),
        filename: "steem-content-renderer.min.js",
        library: "steem-content-renderer",
        libraryTarget: "umd"
    },
    devtool: (DEFAULTS.isDevelopment ? 'cheap-eval-source-map' : 'source-map'),
    target: "web",
    module: {
        rules: []
    },
    optimization: {
        minimize: (DEFAULTS.isDevelopment ? false : true)
    },
    performance: {
        hints: false
    },
    resolve: {
        extensions: [".js", ".json"]
    },
    node: {
        fs: "empty" // fix can't resolve "fs" in winston
    },
    plugins: [
        new Visualizer({
            filename: './statistics.html'
        })
    ]
}