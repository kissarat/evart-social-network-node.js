"use strict";

var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var utils = require('../utils');
var errors = require('../errors');
var _ = require('underscore');

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
}, {
    versionKey: false
});

module.exports = {
    GET: function ($) {
        var where = buildGet($);
        if ($.has('type')) {
            var type = $.param('type');
            where.type = type.indexOf('.') > 0 ? {$in: type.split('.')} : type;
        }
        var populate = $.select(['domain'], User.select.user).join();
        return Record.find(where, {type: 1, source: 1, target: 1, status: 1, time: 1})
            .populate('source', populate)
            .populate('target', populate);
    },

    PUT: function ($) {
        var data = {
            source: $.user._id,
            target: $.param('target_id'),
            type: $.param('type')
        };
        return new Promise(function (resolve, reject) {
            Record.findOne(data).catch(reject).then(function (record) {
                var result = {found: !!record};
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
        var where = {
            _id: $.id,
            target: $.user._id
        };
        return new Promise(function (resolve, reject) {
            Record.findOne(where).catch(reject).then(function (record) {
                if (record) {
                    var changes = _.omit($.body, ['_id', 'target', 'source', '__v']);
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
    var where = {};
    var me = $.user._id;
    if ($.has('source_id')) {
        where.source = $.get('source_id');
    }
    if ($.has('target_id')) {
        where.target = $.get('target_id');
    }
    if (!where.source && !where.target) {
        where.$or = [
            {source: me},
            {target: me}
        ];
    }
    if (where.source && where.target && !me.equals(where.source) && !me.equals(where.target)) {
        throw new errors.Forbidden();
    }
    console.log(where);
    if ($.has('id')) {
        where._id = $.get('_id');
    }
    return where;
}
