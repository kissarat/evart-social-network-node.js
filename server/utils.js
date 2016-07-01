'use strict';
var ObjectID = require('mongodb').ObjectID;
var ObjectIdSchema = require('mongoose').Schema.Types.ObjectId;
var crc = require('crc');
var crypto = require('crypto');
var config = require('./config.json');
var code = require('../client/code.json');
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

var entities = ['User', 'Agent', 'Record', 'Message', 'File', 'Stream', 'Video', 'Stat'];

function id12(name) {
    var now = process.hrtime();
    var number = entities.indexOf(name);
    if (number < 0) {
        number = crc.crc8(name).toString(16);
    }
    else {
        number += 1;
    }
    var first = ('00' + number).slice(-2);
    var time = (start_second + now[0]) * 1000000000 + now[1];
    var third = time.toString(16);
    var forth = Math.round(Math.random() * 0xFFFFFF).toString(16);
    third = ('00000000' + third).slice(-16);
    forth = ('000000' + forth).slice(-6);
    var object_id = ObjectID(first + third + forth);
    object_id.time = time;
    return object_id;
}

function idType(name) {
    return {
        type: ObjectIdSchema,
        default: function () {
            return id12(name);
        }
    };
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

function subscribe(prefix, source, target) {
    if (undefined === target) {
        target = this;
    }
    if (undefined === source) {
        source = this;
    }
    prefix = 'on' + prefix;
    // console.log(Object.keys(target.constructor.prototype));
    // console.log((target.__proto__.constructor.name));
    // console.log((target.__proto__.__proto__.constructor.name));
    for(var name in target) {
        let handler = target[name];
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

module.exports = {Iterator, fields, merge, nano100time, id12, idType, hash, s, StringType, subscribe, receive, equals};
