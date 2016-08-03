"use strict";

var jsdom = require('jsdom');
var MongoClient = require('mongodb').MongoClient;
var config = require('../server/config.json');
var _ = require('underscore');

var db;

MongoClient.connect(config.mongo.uri, config.mongo.options, function (err, _db) {
    db = _db;
    fetch();
});

var i = 1158;

function fetch() {
    var start = Date.now();
    jsdom.env('http://bash.im/index/' + i, function (err, window) {
        var quotes = _.toArray(window.document.querySelectorAll('.quote')).map(function (q) {
            var rating = q.querySelector('.rating');
            if (rating) {
                return {
                    _id: +(rating.getAttribute('id').slice(1)),
                    pub_date: new Date(q.querySelector('.date').innerHTML),
                    rating: +(rating.innerHTML),
                    text: q.querySelector('.text').innerHTML.replace(/<br>/g, '\n')
                }
            }
            else {
                return false;
            }
        });
        db.collection('bash_im').insertMany(quotes.filter(_.identity), function (err, result) {
            if (err) {
                console.error(err);
            }
            else {
                console.log(i + '\t' + (Date.now() - start));
                i--;
                if (i > 0) {
                    fetch();
                }
                else {
                    process.exit();
                }
            }
        })
    })
}
