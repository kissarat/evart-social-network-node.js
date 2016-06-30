"use strict";

var MongoClient = require('mongodb').MongoClient;
var config = require('../server/config.json');
var utils = require('../server/utils');
var _ = require('underscore');
var logins = require('./domains');
logins.push('admin');

var db;
var user_ids;

MongoClient.connect(config.mongo.uri, config.mongo.options, function (err, _db) {
    db = _db;
    db.collection('user').find({domain: {$in: logins}}, function (err, reader) {
        reader.toArray(function (err, users) {
            user_ids = _.pluck(users, '_id');
            run();
        });
    });
});

// var i = 1;
function run() {
    db.collection('bash_im').find({}, function (err, reader) {
        let message = db.collection('message');
        function wall() {
            reader.each(function (err, quote) {
                if (quote) {
                    let quotes = [];
                    quote.text.split('\n').forEach(function (text) {
                        text = text.trim();
                        if (text) {
                            let pair = _.sample(user_ids, 2);
                            quotes.push({
                                _id: utils.id12('Message'),
                                source: pair[0],
                                target: pair[1],
                                type: 'dialog',
                                time: quote.pub_date,
                                text: quote.text
                            });
                        }
                    });
                    message.insertMany(quotes, wall);
                    // if (i % 1000 === 0) {
                    //     gc();
                    // }
                    // i++;
                }
                else {
                    process.exit();
                }
            })
        }

        wall();
    });
}
