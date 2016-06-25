var config = require(__dirname + '/../config.json');
var MongoClient = require('mongodb').MongoClient;
var utils = require('../utils');

var docs = [
    ["users", {
        "domain": "admin",
        "type": "admin",
        "phone": "380671234567",
        "email": "kissarat@gmail.com",
        "hash": "RMlDIlc4/ChTfFO8EeUnOo1OGNu5zdWBg2OKFvI7pP8="
    }],
    ["lang", [{
        _id: 0,
        name: 'Русский'
    }, {
        _id: 3,
        name: 'English'
    }]]
];

var _docs = [];
docs.forEach(function (record) {
    var name = record[0];
    if (record[1] instanceof Array) {
        record[1].forEach(function (rd) {
            _docs.push([name, rd]);
        });
    }
    else {
        _docs.push(record);
    }
});
docs = _docs;

var ids = {
    "users": ["domain"],
    'lang': ['_id']
};

var db;

var iterator = new utils.Iterator(docs);

function remove() {
    if (iterator.can) {
        var record = iterator.next();
        var entity_ids = {};
        ids[record[0]].forEach(function (id) {
            entity_ids[id] = record[1][id];
        });
        db.collection(record[0]).remove(entity_ids, function (err, result) {
            if (err) {
                console.error(err);
            }
            remove();
        });
    }
    else {
        iterator.rewind();
        insert();
    }
}

function insert() {
    if (iterator.can) {
        var record = iterator.next();
        db.collection(record[0]).insert(record[1], function (err, result) {
            if (err) {
                console.error(err);
            }
            insert();
        });
    }
    else {
        process.exit();
    }
}

MongoClient.connect(config.mongo, function (err, _db) {
    db = _db;
    remove();
});
