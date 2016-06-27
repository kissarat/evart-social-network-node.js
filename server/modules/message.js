'use strict';

var _ = require('underscore');
var code = require(__dirname + '/../../client/code.json');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var utils = require('../utils');

var T = mongoose.Schema.Types;

var MessageType = {
    DIALOG: 'dialog',
    WALL: 'wall',
    PHOTO: 'photo',
    VIDEO: 'video'
};

global.schema.Message = mongoose.Schema({
    _id: utils.idType('Message'),

    type: {
        type: String,
        enum: _.values(MessageType)
    },

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
        ref: 'File'
    },

    files: [
        {
            type: T.ObjectId,
            ref: 'File',
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
    /*
     ip: {
     type: String
     },

     geo: {
     type: Array
     },
     */
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

schema.Message.statics.Type = MessageType;

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
            let you = $.param('dialog_id');
            let where = {
                unread: 1,
                source: you,
                target: $.user._id
            };
            return new Promise(function (resolve, reject) {
                Message.find(where).select('_id').catch(reject).then(function (messages) {
                    Message.update(where, {$set: {unread: 0}}, {multi: true}).catch(reject).then(function (result) {
                        if (messages.length == result.nModified) {
                            var ids = _.pluck(messages, '_id'); 
                            resolve(ids);
                            $.notifyOne(you, {
                                type: 'read',
                                dialog_id: where.source,
                                ids: ids
                            });
                        }
                        else {
                            reject(result);
                        }
                    });
                })
            });

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
        var match = [
            {type: Message.Type.DIALOG},
            {
                $or: [
                    {source: $.user._id},
                    {target: $.user._id}
                ]
            }
        ];
        if ($.has('unread') && $.param('unread')) {
            match.push({unread: 1});
        }
        if ($.has('since')) {
            match.push({time: {$gt: $.param('since')}});
        }
        var where = [
            {
                $match: {$and: match}
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: {$eq: ['$source', $.user._id]},
                            then: '$target',
                            else: '$source'
                        }
                    },
                    last_id: {$last: '$_id'},
                    unread: {
                        $sum: {
                            $cond: {
                                if: {$eq: ['$target', $.user._id]},
                                then: '$unread',
                                else: 0
                            }
                        }
                    },
                    count: {$sum: 1},
                    time: {$last: '$time'},
                    text: {$last: '$text'}
                }
            },
            {
                $lookup: {
                    'as': 'peer',
                    localField: '_id',
                    from: 'users',
                    foreignField: '_id'
                }
            },
            {
                $unwind: {
                    path: '$peer'
                }
            }
        ];
        var project = {
            _id: 1,
            time: 1,
            count: 1,
            unread: 1,
            text: 1,
            peer: {
                _id: 1,
                domain: 1,
                online: 1,
                surname: 1,
                forename: 1,
                avatar: 1
            }
        };
        if ($.has('cut')) {
            var cut = +$.param('cut');
            if (cut > 0) {
                project.text = {$substr: ['$text', 0, $.param('cut')]};
            }
            else {
                $.invalid('cut', 'Must be positive');
            }
        }
        where.push({$project: project});
        return Message.aggregate(where);
    }
};

var user_fields = ['type', 'source', 'target', 'owner', 'like', 'hake',
    'photo', 'photos', 'video', 'videos', 'text', 'repost'];
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
