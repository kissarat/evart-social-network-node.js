'use strict';

var _ = require('underscore');
var code = require(__dirname + '/../../client/code.json');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var utils = require('../utils');

var T = mongoose.Schema.Types;

global.schema.Message = mongoose.Schema({
    _id: utils.idType('Message'),

    source: {
        type: T.ObjectId,
        ref: 'User',
        required: true,
        index: {
            unique: false
        }
    },

    target: {
        type: T.ObjectId,
        ref: 'User',
        index: {
            unique: false
        }
    },

    owner: {
        type: T.ObjectId,
        ref: 'User',
        index: {
            unique: false
        }
    },

    like: [
        {
            type: T.ObjectId,
            ref: 'User',
            "default": null
        }
    ],

    hate: [
        {
            type: T.ObjectId,
            ref: 'User',
            "default": null
        }
    ],

    file: {
        type: T.ObjectId,
        ref: 'Photo'
    },

    files: [
        {
            type: T.ObjectId,
            ref: 'Photo',
            "default": null
        }
    ],

    time: {
        type: Date,
        required: true,
        "default": Date.now
    },

    unread: {
        type: Number,
        "default": 1
    },

    text: {
        type: String
    },

    ip: {
        type: String
    },

    geo: {
        type: Array
    },

    repost: {
        type: T.ObjectId,
        ref: 'Message'
    },

    children: [
        {
            type: T.ObjectId,
            ref: 'Message',
            "default": null
        }
    ]
}, {
    versionKey: false
});

schema.Message.statics.Type = {
    DIALOG: 1,
    WALL: 2,
    PHOTO: 3,
    VIDEO: 4
};

module.exports = {
    POST: function ($) {
        var message = new Message($.allowFields(user_fields, admin_fields));
        message.source = $.user._id;
        _.each(_.uniq(_.pick(message, 'target', 'owner')), id => $.notifyOne(id, message));
        message.save($.wrap(function () {
            if ($.has('parent_id')) {
                Message.update({_id: $.param('parent_id')}, {$push: {children: message._id}});
            }
            $.send(message);
        }));
    },

    GET: function ($) {
        var where = {$and: [{type: $.get('type')}]};
        switch ($.get('type')) {
            case Message.Type.DIALOG:
                var target_id = $.param('target_id');
                var me = $.user._id;
                where.$and.push({
                    $or: [{
                        source: me,
                        target: target_id
                    }, {
                        source: target_id,
                        target: me
                    }]
                });
                if ($.has('since')) {
                    where.$and.push({
                        time: {$gte: new Date($.get('since')).toISOString()}
                    });
                }
                break;

            case Message.Type.WALL:
                where.$and.push({
                    owner: $.param('owner_id')
                });
                break;

            default:
                $.sendStatus(code.BAD_REQUEST);
                return;
        }
        return Message.find(where).sort('-time');
    },

    DELETE: function ($) {
        return Message.remove({
            _id: $.id
        });
    },

    read: function ($) {
        if ($.has('id') && $.has('unread')) {
            return Message.update({_id: $.param('id')}, {$set: {unread: $.param('unread')}});
        }
        if ($.has('dialog_id')) {
            var me = $.user._id;
            var you = $.param('dialog_id');
            let where = {
                $and: [
                    {unread: 1},
                    {
                        $or: [
                            {target: me, source: you},
                            {target: you, source: me}
                        ]
                    }
                ]
            };
            $.notifyOne(you, {type: 'read', target_id: where.source});
            return Message.update(where, {$set: {unread: 0}}, {multi: true});
        }
        return false;
    },

    feed: function ($) {
        return Message.find({
            type: Message.Type.WALL,
            owner: {$in: $.user.follow.map(id => ObjectID(id))}
        });
    },

    dialogs: function ($) {
        Message.aggregate([
            {
                $match: {
                    $and: [
                        {type: Message.Type.DIALOG},
                        {
                            $or: [
                                {source: $.user._id},
                                {target: $.user._id}
                            ]
                        }]
                }
            },
            {
                $group: {
                    _id: {
                        source: '$source',
                        target: '$target'
                    },
                    dialog_id: {$first: '$_id'},
                    unread: {$sum: '$unread'},
                    count: {$sum: 1},
                    time: {$first: '$time'},
                    text: {$first: '$text'}
                }
            },
            {
                $lookup: {
                    'as': 'dialog',
                    localField: 'dialog_id',
                    from: 'users',
                    foreignField: '_id'
                }
            },
            {
                $project: {
                    _id: 'dialog_id',
                    time: 1,
                    count: 1,
                    unread: 1,
                    text: 1,
                    dialog: {
                        domain: 1,
                        forename: 1,
                        surname: 1,
                        avatar: 1,
                        online: 1
                    },
                    source: '_id.source'
                }
            },
            {
                $lookup: {
                    'as': 'dialog.avatar',
                    localField: 'dialog.avatar',
                    from: 'files',
                    foreignField: '_id'
                }
            }
        ]);
    }
};

var user_fields = ['source', 'target', 'owner', 'like', 'hake', 'photo', 'photos', 'video', 'videos', 'text', 'repost'];
var admin_fields = ['domain', 'type'];

function populate(r) {
    for (var collection in populate.map) {
        r.populate(collection, populate.map[collection]);
    }
    return r;
}

populate.map = {
    source: '_id domain avatar',
    target: '_id domain avatar',
    videos: '_id thumbnail_url thumbnail_width thumbnail_height',
    repost: '_id source target photos videos text',
    children: '_id source target photos videos text time'
};
