"use strict";

var MongoClient = require('mongodb').MongoClient;
var config = require('../server/config.json');
var utils = require('../server/utils');
var _ = require('underscore');
var fs = require('fs');

var db;

MongoClient.connect(config.mongo.uri, config.mongo.options, function (err, _db) {
    db = _db;
    dump(0);
});

var size = 500;

function dump(i) {
    db.collection('bash_im').aggregate([{$skip: i * size}, {$limit: size}], function (err, quotes) {
        if (err) {
            return console.error(err);
        }
        if (quotes.length === 0) {
            process.exit();
        }
        var html = ['<!DOCTYPE html><html lang="en"><head></head><body>'.replace(/></g, '\n')];
        var page = i + 1;
        if (page > 1) {
            html.push(`<a href="${page - 1}.html">Предыдущая</a>`);
        }
        html.push(`<a href="${page + 1}.html">Следующая</a>`);
        html.push('<article>');
        quotes.forEach(function (quote) {
            html.push(`\n<div class="quote" id="${quote._id}">`);
            html.push(`<strong class="date">${quote.time}</strong>`);
            html.push('<section>');
            quote.text.split('\n').join('<br/>');
            html.push('</section>');
            html.push('</div>');
        });
        html.push('</article>');
        html.push('</body>\n</html>');
        fs.writeFileSync(`bash.im/${page}.html`, html.join('\n'));
        dump(i + 1);
    });
}
