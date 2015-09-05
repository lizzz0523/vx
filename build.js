var webpack = require('webpack'),

    fs = require('fs'),
    path = require('path'),
    uglify = require('uglify-js');

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
        }
    });

compiler.run(function (err, stats) {
    // console.log(stats);
});


var code = fs.readFileSync(
        path.join(__dirname, './dist', 'vx.js'),
        'utf8'
    );

fs.writeFileSync(
    path.join(__dirname, './dist', 'vx.min.js'),
    uglify.minify(code, {fromString: true}).code
);


