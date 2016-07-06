"use strict";

var jsdom = require('jsdom');
var MongoClient = require('mongodb').MongoClient;
var config = require('../server/config.json');
var _ = require('underscore');

var users = [
    "admin",
    "dmitrienko_nadezhda",
    "dyadyura_galina",
    "sukharevskij_viktor",
    "tarasov_vladimir",
    "aleksejchuk_sergej",
    "emelyanov_anton",
    "babij_fedor",
    "kozlitin_vitalij",
    "manpel_leonid",
    "sipkov_evgenij",
    "kopeliovich_viktor",
    "voskobojnik_anna"
];
var db;

MongoClient.connect(config.mongo.uri, config.mongo.options, function (err, _db) {
    db = _db;
    db.collection('user').find({domain: {$in: users}}, function (err, reader) {
        reader.toArray(function (err, _users) {
            users = _.pluck(_users, '_id');
            run();
        });
    });
});


function run() {
    db.collection('ukrbash').find({}, function (err, reader) {
        function wall() {
            var message = db.collection('message');
            reader.each(function (err, quote) {
                if (quote) {
                    let data = {
                        owner: _.sample(users),
                        source: _.sample(users),
                        type: 'wall',
                        time: quote.add_date,
                        text: quote.text
                    };
                    message.insert(data, wall);
                }
                else {
                    process.exit();
                }
            })
        }
        wall();
    });
}
