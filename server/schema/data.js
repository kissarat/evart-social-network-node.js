var config = require(__dirname + '/../config.json');
var MongoClient = require('mongodb').MongoClient;
var utils = require('../utils');

var docs = [
    ["users", {
        "domain": "admin",
        "type": "admin",
        "phone": "380671541943",
        "email": "kissarat@gmail.com",
        "password": "1"
    }]
];

var ids = {
    "users": ["domain"]
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
