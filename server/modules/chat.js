'use strict';

const mongoose = require('mongoose');
const utils = require('../utils');
const _ = require('underscore');

const schema = {
    _id: utils.idType('Chat'),

    created: CreationDateType,
    time: CreationDateType,

    name: utils.StringType(128, 3),

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
        let aggregate;
        let single = false;
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
            const id = $.get('member_id');
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
        };
    },

    POST: function ($) {
        let chat = $.allowFields(Chat.fields.update.user);
        if (!chat.admin) {
            chat.admin = [$.user._id];
        }
        chat = new Chat(chat);
        return chat.save();
    },

    PUT: function ($) {
        const name = $.param('name');
        Chat.findOne({_id: $.param('id')}, $.wrap(function (chat) {
            if (_.find(chat.admin, $.user._id, (a, b) => a.equals(b))) {
                chat.name = name;
                chat.save($.answer);
            }
            else {
                $.sendStatus(code.FORBIDDEN);
            }
        }));
    },

    DELETE: function ($) {
        const id = $.get('id');
        if ($.isAdmin) {
            Message.remove({chat: id}).exec($.answer);
        }
        else {
            return code.FORBIDDEN;
        }
    }
};
