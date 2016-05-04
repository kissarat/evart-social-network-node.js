var config = require(__dirname + '/../config.json');
var MongoClient = require('mongodb').MongoClient;

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

class Iterator {
    constructor(array = []) {
        this.i = -1;
        this.array = array;
    }

    get current() {
        return this.array[this.i];
    }

    next() {
        this.i++;
        return this.current;
    }

    rewind() {
        this.i = -1;
    }

    get complete() {
        return this.i < this.array.length;
    }
}

class WrapIterator extends Iterator {
    constructor(array, wrap) {
        super(array);
        this.wrap = wrap;
    }

    get current() {
        return this.wrap(super.current);
    }
}

var iterator = new WrapIterator(docs, function (current) {
    return {
        get entity() {
            return current[0];
        },

        get doc() {
            return current[1];
        }
    }
});

function remove() {
    if (iterator.complete) {
        var record = iterator.next();
        var entity_ids = {};
        ids[record.entity].forEach(function (id) {
            entity_ids[id] = record.doc[id];
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
    if (iterator.complete) {
        var record = iterator.next();
        db.collection(record.entity).insert(record.doc, function (err, result) {
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
