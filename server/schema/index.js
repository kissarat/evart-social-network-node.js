db.messages.createIndex({source: 1}, {unique: false});
db.messages.createIndex({target: 1}, {unique: false});