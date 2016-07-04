"use strict";
const utils = require('../utils');
const mongoose = require('mongoose');

const schema = {
    _id: utils.idType('Album'),

    time: {
        type: Date,
        required: true,
        "default": Date.now
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: {
            unique: false
        }
    },

    name: {
        type: String
    }
};

global.schema.Album = new mongoose.Schema(schema, utils.merge(config.mongoose.schema.options, {
    collection: 'album'
}))
    .index({
        owner: 1,
        name: 1
    }, {
        unique: true
    });

module.exports = {
    _meta: {
        schema: schema
    },

    _before: function ($) {
        var owner_id = $.get('owner_id', $.user._id);
        return $.isModify ? $.canManage(owner_id) : $.accessUser(owner_id);
    },

    GET: function ($) {
        return {
            query: {owner: $.get('owner_id', $.user._id)}
        };
    },

    POST: function ($) {
        var data = $.body;
        data.owner = $.get('owner_id', $.user._id);
        return new Album(data).save();
    },

    DELETE: function ($) {
        var owner_id = $.get('owner_id', $.user._id);
        return Album.remove({_id: $.get('id'), owner: owner_id});
    }
};
