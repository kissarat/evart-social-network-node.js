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
        var where = {target: $.user._id};
        if ($.has('type')) {
            var type = $.param('type').split('.');
            if (1 == type.length) {
                where.type = type[0];
            }
            else {
                where.type = {$in: type};
            }
        }
        return Record.find(where, {type: 1, source: 1, status: 1})
            .populate('source', $.select(['domain'], schema.User.user_public_fields));
    },

    POST: function ($) {
        var record = new Record({
            source: $.user._id,
            target: $.param('target_id'),
            type: $.param('type')
        });
        return record.save();
    },
    
    DELETE: function ($) {
        return Record.remove({
            id: $.id,
            target_id: $.user._id
        })
    }
};
