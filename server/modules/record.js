"use strict";

var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var utils = require('../utils');

global.schema.Record = new mongoose.Schema({
    _id: utils.idType('User'),
    
    type: {
        type: String,
        enum: ['follow'],
        required: true,
        index: {
            unique: false
        }
    },
    
    status: {
        type: String
    },
    
    source: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    target: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    time: {
        type: Date,
        required: true,
        "default": Date.now
    }
});

module.exports = {
    GET: function ($) {
        var where = buildGet($);
        if ($.has('type')) {
            var type = $.param('type');
            where.type = type.indexOf('.') > 0 ? {$in: type.split('.')} : type;
        }
        var populate = $.select(['domain'], schema.User.user_public_fields);
        return Record.find(where, {type: 1, source: 1, target: 1, status: 1})
            .populate('source', populate)
            .populate('target', populate);
    },

    PUT: function ($) {
        var data = {};
        data.source = $.user._id;
        data.target = $.param('target_id');
        data.type = $.param('type');
        return new Promise(function (resolve, reject) {
            Record.findOne(data).catch(reject).then(function (record) {
                var result = {
                    success: true,
                    found: !!record
                };
                if (record) {
                    record.time = Date.now();
                }
                else {
                    record = new Record(data);
                }
                return record.save().catch(reject).then(function (record) {
                    result.result = record;
                    resolve(result);
                })
            })
        })
    },

    POST: function ($) {
        var where = build($);
        return new Promise(function (resolve, reject) {
            Record.findOne(where).catch(reject).then(function (record) {
                if (record) {
                    var changes = $.req.body;
                    except(changes);
                    if (_.isEmpty(changes)) {
                        resolve(code.NOT_MODIFIED);
                    }
                    else {
                        for (var name in changes) {
                            record[name] = changes[name];
                        }
                        record.save().then(resolve, reject);
                    }
                }
                else {
                    resolve(code.NOT_FOUND);
                }
            });
        });
    },
    
    DELETE: function ($) {
        return Record.remove(buildGet($));
    }
};

function buildGet($) {
    var where = $.req.query;
    var me = $.user._id.toString();
    if ($.has('source_id') && $.get('source_id').toString() == me) {
        where.target = me;
    }
    if ($.has('target_id') && $.get('target_id').toString() == me) {
        where.source = me;
    }
    if ($.has('id')) {
        where._id = $.get('_id');
    }
    return where;
}

function build($) {
    var where = {
        target_id: $.user._id
    };
    ['id', 'source_id', 'type'].forEach(function (name) {
        if ($.has(name, true)) {
            where[name.replace('_id', '')] = $.get(name);
        }
    });
    return where;
}

function except(changes) {
    for(var name in changes) {
        if (['_id', 'target', 'source', '__v'].indexOf(name)) {
            delete changes[name];
        }
    }
}
