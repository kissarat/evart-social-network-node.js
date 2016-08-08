'use strict';

var ObjectID = require('mongodb').ObjectID;
var ObjectIdSchema = require('mongoose').Schema.Types.ObjectId;
var crypto = require('crypto');
var config = require('./config.json');
var code = require('../client/code.json');
var bandom = require('bandom');
var _ = require('underscore');

class Iterator {
    constructor(array) {
        if (!array) {
            array = [];
        }
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

    get can() {
        return this.i < this.array.length - 1;
    }
}

function fields(array) {
    var object = {};
    for (var i = 0; i < array.length; i++) {
        var field = array[i];
        object[field.name] = field.value;
    }
    return object;
}

function merge() {
    if (arguments.length <= 1) {
        return arguments[0] || {};
    }
    else {
        var result = {};
        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
            if (arg) {
                for (var j in arg) {
                    result[j] = arg[j];
                }
            }
        }
        return result;
    }
}

var start_second = Math.round(Date.now() / 1000) - process.hrtime()[0];
var start = (Date.now() - process.hrtime()[0] * 1000) * 1000 * 1000;

function nano100time() {
    var now = process.hrtime();
    return (start + (now[0] * 1000000000 + now[1])) / 100;
}

var entities = ['User', 'Message', 'Agent', 'File', 'Record', 'Video', 'Chat', 'Stream', 'Stat', 'Album'];

function id12(name) {
    var number = entities.indexOf(name);
    if (number < 0) {
        throw new Error();
    }
    var now = process.hrtime();
    var buffer = new Buffer(12);
    buffer.writeUInt8(number + 1, 0);
    buffer.writeUInt32BE(now[0] + start_second, 1);
    buffer.writeUInt32BE(now[1], 5);
    bandom.copy(buffer, 9, 3);
    return new ObjectID(buffer);
}

function idType(name) {
    return {
        type: ObjectIdSchema,
        default: function () {
            return id12(name);
        }
    };
}

function idTime() {
    var now = process.hrtime();
    return Math.round((start_second + now[0]) * 1000000 + now[1] / 1000);
}

function StringType(max, min) {
    return {
        type: String,
        min: min || 2,
        max: max || 64,
        trim: true,
        set: function (value) {
            if (value) {
                value = value.replace(/[\s\xA0]/g, ' ');
            }
            if (!value) {
                value = null
            }
            return value;
        }
    }
}

function hash(data) {
    var algorithm = crypto.createHash('sha256');
    data += config.salt;
    algorithm.update(data);
    return algorithm.digest('base64')
}

function s(array) {
    return array.map(function (o) {
        return o.toString();
    })
}

function subscribe(prefix, source, target, proto) {
    if (undefined === target) {
        target = this;
    }
    if (undefined === source) {
        source = this;
    }
    if (undefined === proto) {
        proto = target;
    }
    prefix = 'on' + prefix;
    for (var name in proto) {
        let handler = proto[name];
        name = name.toLowerCase();
        if (0 === name.indexOf(prefix)) {
            name = name.replace(prefix, '');
            source.on(name, function () {
                handler.apply(target, arguments);
            })
        }
    }
}

function receive(readable, call) {
    var chunks = [];
    return new Promise(function (resolve, reject) {
        readable.on('data', function (chunk) {
            chunks.push(chunk);
        });
        readable.on('end', function () {
            var data;
            if (0 == chunks.length) {
                data = new Buffer();
            }
            else if (1 == chunks.length) {
                data = chunks[0];
            }
            else {
                data = Buffer.concat(chunks);
            }
            if (call) {
                resolve(call(data));
            }
            else {
                resolve(data)
            }
        });
        readable.on('error', reject)
    })
}

function equals(a, b) {
    return a.equals(b);
}

function associate(key, value) {
    var object = {};
    object[key] = value;
    return object
}

function dumpQuery(q, tab) {
    console.log(JSON.stringify(q, null, tab)
        .replace(/("[0-9a-f]{24}")/g, 'ObjectId($1)')
        .replace(/"([\$\w]+)":/g, '$1:'));
}

module.exports = {
    Iterator, fields, merge, nano100time, id12, idType, hash, s,
    StringType, subscribe, receive, equals, associate, dumpQuery
};
