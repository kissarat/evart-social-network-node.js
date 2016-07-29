"use strict";

var gulp = require('gulp');
var sass = require('gulp-sass');
var coffee = require('gulp-coffee');
var jsdom = (require('jsdom')).jsdom;
var fs = require('fs');
var _ = require('underscore');
var minifier = require('minifier');
var fse = require('fs.extra');
var data = require('./client/js/data');

var jsVersion = 1;
var cssVersion = 1;
var htmlVersion = 1;
var newlines = '\n\n\n\n';

function version(v) {
    return ['/**',
    '* @author Taras Labiak <kissarat@gmail.com>',
    `* @version ${v}`,
    '*/'].join('\n') + '\n\n';
}

// const cloudfront = '//d2sywt0ovr790u.cloudfront.net/';
// var origin = '//d2sywt0ovr790u.cloudfront.net/';
const own_cdn = 'http://static.evart.com/';

gulp.task('app', function () {
    fse.mkdirp('app');
    var string = fs.readFileSync('client/index.html');
    var doc = string.toString('utf8');
    doc = jsdom(doc);
    string = [];
    _.each(doc.querySelectorAll('script'), function (script) {
        if (script.getAttribute('src') && !script.classList.contains('admin')) {
            fs.readFileSync('client' + script.getAttribute('src'))
                .toString('utf8')
                .split('\n')
                .forEach(line => string.push(line));
        }
    });
    string = string
        .filter(line => !/^\s*\/\//.test(line))
        .join('\n');
    fs.writeFileSync('app/script.js', string);
    var script = doc.getElementById('script');
    script.innerHTML = `<script src="${own_cdn}script.js"></script>`;
    _.each(doc.querySelectorAll('.include[data-src]'), function (script) {
        script.innerHTML = fs.readFileSync('client' + script.getAttribute('data-src'));
        script.removeAttribute('data-src');
    });
    string = [];
    _.each(doc.querySelectorAll('[rel=stylesheet]'), function (style) {
        var src = style.getAttribute('href');
        if (src && src.indexOf('http') < 0) {
            let style = fs.readFileSync('client' + src);
            string.push(style.toString('utf8').replace(/\.\.\/fonts\//, '/fonts/'));
        }
        doc.head.removeChild(style);
    });
    string = string.join("\n");
    fs.writeFileSync('app/style.css', string);
    var link = doc.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', own_cdn + 'style.css');
    doc.head.appendChild(link);
    var iter = doc.createNodeIterator(doc.documentElement, 128, null, false);
    while (true) {
        var comment = iter.nextNode();
        if (!comment) {
            break;
        }
        comment.parentNode.removeChild(comment);
    }
    fse.mkdirp('app/languages');
    string = doc.documentElement.outerHTML
        .replace(/>\s*</mg, '><')
        .replace(/\s+/g, ' ')
        .replace('</body>',
            newlines +
            // '<a id="author" href="http://kissarat.github.io/">\n\tDeveloped by Taras Labiak\n</a>' +
                '' +
            newlines + '</body>')
        .replace('<meta name="robots" content="index,nofollow">',
            newlines +
            '<meta name="author"  content="Taras Labiak"/>' +
            '\n<meta name="contact" content="kissarat@gmail.com"/>' +
            `\n<!-- @version ${htmlVersion} -->` +
            newlines +
            '<meta name="robots" content="index,nofollow"/>'
        );
    fs.writeFileSync('app/index.html', `<!DOCTYPE html>\n` + string);
    fs.readdirSync('client/languages').filter(function (name) {
        return /\.json$/.test(name);
    }).forEach(function (name) {
        var language = name.split('.')[0];
        var dictionary = JSON.parse(fs.readFileSync('client/languages/' + name));
        return fs.writeFileSync(`app/languages/${language}.json`, JSON.stringify(dictionary));
    });
    fse.copy('client/favicon.ico', 'app/favicon.ico', {replace: true});
    fse.copyRecursive('client/images', 'app/images', Function());
    fse.copyRecursive('client/fonts', 'app/fonts', Function());
    fse.copyRecursive('client/sound', 'app/sound', Function());
    fse.copyRecursive('client/pages', 'app/pages', Function());
    fse.copyRecursive('client/svg', 'app/svg', Function());
    fse.copyRecursive('client/lib/components-font-awesome/fonts', 'app/fonts', Function());
});

gulp.task('minify', function () {
    {
        minifier.minify('app/style.css');
        let string = fs.readFileSync('app/style.min.css');
        fs.unlinkSync('app/style.min.css');
        string = string.toString('utf8').replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '');
        fs.writeFileSync('app/style.css', version(cssVersion) + string);
    }

    {
        minifier.minify('app/script.js');
        let string = fs.readFileSync('app/script.min.js');
        fs.writeFileSync('app/script.js', version(jsVersion) + string);
        fs.unlinkSync('app/script.min.js');
    }
});

gulp.task('default', [
    'app',
    'minify'
]);
