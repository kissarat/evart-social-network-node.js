'use strict';
var ObjectID = require('mongodb').ObjectID;
var ObjectIdSchema = require('mongoose').Schema.Types.ObjectId;
var crc = require('crc');
var crypto = require('crypto');
var config = require('./config.json');

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
    var object = {};
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        for (var key in arg) {
            object[key] = arg[key];
        }
    }
    return object;
}

var start_second = Math.round(Date.now() / 1000) - process.hrtime()[0];
var start = (Date.now() - process.hrtime()[0] * 1000) * 1000 * 1000;

function nano100time() {
    var now = process.hrtime();
    return (start + (now[0] * 1000000000 + now[1])) / 100;
}

var entities = ['Agent', 'User', 'Message'];

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
    var second = ('00' + config.machine_id.toString(16)).slice(-2);
    var third = ((start_second + now[0]) * 1000000000 + now[1]).toString(16);
    var forth = Math.round(Math.random() * 0xFFFFFFF).toString(16);
    third = ('00000000' + third).slice(-16);
    forth =  ('0000' + forth).slice(-4);
    return  first + second + third + forth;
}

function idType(name) {
    return {
        type: ObjectIdSchema,
        default: function () {
            return new ObjectID(id12(name));
        }
    };
}

function hash(data) {
    var algorithm = crypto.createHash('sha256');
    data += config.salt;
    algorithm.update(data);
    return algorithm.digest('base64')
}

var exports = {
    export: function (classes) {
        var exports = {};
        for (var i = 0; i < classes.length; i++) {
            var clazz = classes[i];
            exports[clazz.name] = clazz
        }
        return exports;
    }
};

module.exports = merge(exports, exports.export(
    [Iterator, fields, merge, nano100time, id12, idType, hash]
));
