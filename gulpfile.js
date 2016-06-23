var gulp = require('gulp');
var sass = require('gulp-sass');
var coffee = require('gulp-coffee');
var jsdom = (require('jsdom')).jsdom;
var fs = require('fs');
var _ = require('underscore');
var minifier = require('minifier');
var fse = require('fs.extra');
var data = require('./client/js/data');
// var S = require('string');

gulp.task('app', function () {
    var version = Date.now();
    var string = fs.readFileSync('client/index.html');
    var document = jsdom(string.toString('utf8'));
    var files = ['\n(function(version){'];
    _.each(document.querySelectorAll('script'), function (script) {
        if (script.getAttribute('src')) {
            return files.push(fs.readFileSync('client' + script.getAttribute('src')));
        }
    });
    files.push("}).call(this, " + version + ");\n");
    files = files.join("\n");
    _.each(document.querySelectorAll('[data-src]'), function (script) {
        script.innerHTML = fs.readFileSync('client' + script.getAttribute('data-src'));
        return script.removeAttribute('data-src');
    });
    fse.mkdirpSync('app');
    fs.writeFileSync('app/script.js', files);
    minifier.minify('app/script.js');
    files = fs.readFileSync('app/script.min.js');
    fs.unlinkSync('app/script.min.js');
    string = files.toString('utf8');
    (document.getElementById('script')).innerHTML = "<script>\n//\t<![CDATA[\n" + string + "\n//\t]]>\n</script>";
    files = [];
    _.each(document.querySelectorAll('[rel=stylesheet]'), function (style) {
        var src;
        src = style.getAttribute('href');
        if (src && src.indexOf('http') < 0) {
            files.push(fs.readFileSync('client' + src));
        }
        return document.head.removeChild(style);
    });
    string = files.join("\n");
    string = string.replace(/\.\.\/fonts\//g, '/images/');
    fs.writeFileSync('client/all.css', string);
    minifier.minify('client/all.css');
    fs.unlinkSync('client/all.css');
    style = document.createElement('style');
    files = fs.readFileSync('client/all.min.css');
    files = files.toString('utf8').replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '');
    style.innerHTML = "\n" + files + "\n";
    document.head.appendChild(style);
    fs.unlinkSync('client/all.min.css');
    document.querySelector('[http-equiv="Last-Modified"]').setAttribute('content', new Date(version).toUTCString());
    var iter = document.createNodeIterator(document.documentElement, 128);
    while (true) {
        var comment = iter.nextNode();
        if (!comment) {
            break;
        }
        comment.parentNode.removeChild(comment);
    }
    fse.mkdirp('app/languages');
    string = document.documentElement.outerHTML;
    string = string.replace(/>\s*</mg, '><');
    string = '<!DOCTYPE html>\n' + string;
    fs.writeFileSync('app/index.html', string);
    fs.readdirSync('client/languages').filter(function (name) {
        return /\.json$/.test(name);
    }).forEach(function (name) {
        var language = name.split('.')[0];
        var dictionary = JSON.parse(fs.readFileSync('client/languages/' + name));
        return fs.writeFileSync(`app/languages/${language}.json`, JSON.stringify(dictionary));
    });
    fse.copy('client/favicon.ico', 'app/favicon.ico', {
        replace: true
    });
    fse.copyRecursive('client/images', 'app/images', Function());
    fse.copyRecursive('client/lib/components-font-awesome/fonts', 'app/images', Function());
});

gulp.task('translate', function () {
    gulp.src('client/sass/*.sass').pipe(sass()).pipe(gulp.dest('client/sass/'));
});

gulp.task('countries', function () {
    var css = [];
    data.countries.forEach(function (country) {
        if (country.flag) {
            css.push(`option[value="${country.iso}"]::before{content:"${country.flag}"}`);
        }
    });
    fs.writeFileSync('client/sass/countries.css', css.join('\n'));
});

gulp.task('default', ['translate', 'country', 'app']);
