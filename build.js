var webpack = require('webpack'),
    CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin'),
    UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');

var compiler = webpack({
        context: __dirname + '/src',
        entry: {
            'vx': './vx.js',
            'vx-compiler': './compiler/index.js'
        },
        output: {
            path: __dirname + '/dist',
            filename: '[name].js',
            library: '[name]',
            libraryTarget: 'umd'
        },
        plugins: [
            // new UglifyJsPlugin()
        ]
    });

compiler.run(function (err, stats) {
    console.log(stats);
});