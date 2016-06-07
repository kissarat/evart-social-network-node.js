"use strict";

var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var utils = require('../utils');

global.schema.Record = {
    _id: utils.idType('User'),
    
    type: {
        type: String,
        enum: ['follow'],
        required: true,
        index: {
            unique: false
        }
    },
    
    source: {
        type: ObjectID,
        required: true
    },
    
    target: {
        type: ObjectID,
        required: true
    }
};

module.exports = {
    GET: function ($) {
        var cnd = {target_id: App.user._id};
        if ($.has('type')) {
            var type = $.param('type').split('.');
            if (1 == type.length) {
                cnd.type = type[0];
            }
            else {
                cnd.type = {$in: type};
            }
        }
        return Record.find(cnd);
    },

    POST: function ($) {
        var record = new Record({
            source: App.user._id,
            target: $.param('target_id'),
            type: $.param('type')
        });
        return record.save();
    },
    
    DELETE: function ($) {
        return Record.remove({
            id: $.id,
            target_id: App.user._id,
        })
    }
};
