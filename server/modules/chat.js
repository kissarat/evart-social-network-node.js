"use strict";

const ObjectID = require('mongodb').ObjectID;
const mongoose = require('mongoose');
const utils = require('../utils');

const schema = {
    _id: utils.idType('Chat'),

    time: {
        type: Date,
        required: true,
        "default": Date.now
    },

    created: {
        type: Date,
        required: true,
        "default": Date.now
    },

    name: utils.StringType(3, 128),

    admin: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],

    follow: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }]
};

global.schema.Chat = new mongoose.Schema(schema, utils.merge(config.mongoose.schema.options, {
    collection: 'chat',
    createAt: 'created'
}));

global.schema.Chat.statics.fields = {
    select: {
        user: ['admin']
    },
    update: {
        user: ['name', 'admin', 'follow']
    }
};

module.exports = {
    _meta: {
        schema: schema
    },

    GET: function ($) {
        var aggregate;
        var single = false;
        if ($.has('id')) {
            single = true;
            aggregate = [{
                $match: {
                    _id: $.get('id')
                }
            }, {
                $lookup: {
                    as: 'follow',
                    localField: 'follow',
                    from: 'user',
                    foreignField: '_id'
                }
            }, {
                $project: {
                    name: 1,
                    admin: 1,
                    follow: 1
                }
            }];
        }
        else if ($.has('member_id')) {
            let id = $.get('member_id');
            aggregate = [{
                $match: {
                    $or: [
                        {admin: id},
                        {follow: id}
                    ]
                }
            }];
        }
        else if ($.has('admin_id')) {
            aggregate = [{
                $match: {
                    admin: $.get('admin_id')
                }
            }];
        }
        else {
            aggregate = [];
        }
        return {
            single: single,
            collection: 'chat',
            query: aggregate
        }
    },

    POST: function ($) {
        var chat = $.allowFields(Chat.fields.update.user);
        if (!chat.admin) {
            chat.admin = [$.user._id];
        }
        chat = new Chat(chat);
        return chat.save();
    },

    PATCH: function ($) {
        return code.METHOD_NOT_ALLOWED;
    },

    DELETE: function ($) {
        var id = $.get('id');
        if ($.isAdmin) {
            Message.remove({chat: id}).exec($.answer);
        }
        else {
            return code.FORBIDDEN;
        }
    }
};
