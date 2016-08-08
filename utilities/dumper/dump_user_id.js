"use strict";

var jsdom = require('jsdom');
var MongoClient = require('mongodb').MongoClient;
var config = require('../server/config.json');
var _ = require('underscore');

var db;

MongoClient.connect(config.mongo.uri, config.mongo.options, function (err, _db) {
    db = _db;
    db.collection('user').aggregate([{$limit: 1000}], function (err, users) {
        console.log(JSON.stringify(_.pluck(users, 'domain')));
    });
});
