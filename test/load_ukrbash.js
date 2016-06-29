"use strict";

var request = require('request');
var qs = require('querystring');
var MongoClient = require('mongodb').MongoClient;
var config = require('../server/config.json');

var params = {
    client: 'fe94a8bd9dcd2037',
    limit: 500,
    start: 0
};

var db;

MongoClient.connect(config.mongo.uri, config.mongo.options, function (err, _db) {
    db = _db;
    fetch();
});

function fetch() {
    var start = Date.now();
    request('https://api.ukrbash.org/1/quotes.getTheBest.json?' + qs.stringify(params), function (_1, _2, data) {
        data = JSON.parse(data).map(function (quote) {
            if ('quote' == quote.type) {
                return {
                    _id: +quote.id,
                    status: quote.status,
                    add_date: new Date(quote.add_date * 1000),
                    pub_date: new Date(quote.pub_date * 1000),
                    author_id: +quote.author_id,
                    author: quote.author,
                    rating: +quote.rating,
                    tags: quote.tags,
                    text: quote.text
                }
            }
            else {
                console.log(quote);
            }
        });
        db.collection('ukrbash').insertMany(data, function (err, result) {
            if (err) {
                console.error(err);
            }
            else {
                console.log(params.start + '\t' + (Date.now() - start));
                if (data.length >= params.limit) {
                    params.start += params.limit;
                    fetch();
                }
                else {
                    process.exit();
                }
            }
        })
    })
}
