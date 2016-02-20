'use strict';

var MongoClient = require('mongodb').MongoClient;

function wrap(cb) {
    return function (err, result) {
        if (err) {
            console.error(err);
            return process.exit();
        }
        cb(result);
    }
}

MongoClient.connect('mongodb://localhost:27017/socex', function (err, db, done) {
    if (err) {
        console.error(err);
        return process.exit();
    }
    db.collection('user').createIndex({surname: 'text', forename: 'text'}, wrap(result => {
        console.log(result);
        process.exit();
    }));
});
