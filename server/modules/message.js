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
        message.ip = $.req.connection.remoteAddress;
        if (message.target) {
            $.notifyOne(message.target, $.merge(message.toJSON(), {
                type: 'message'
            }));
        }
        if ($.has('parent_id')) {
            return message.save(function () {
                var cnd = {_id: $.param('parent_id')};
                var push = {$push: {children: message._id}};
                return $.collection('messages').update(cnd, push);
            });
        } else {
            if ($.has('repost_id')) {
                var repost_id = $.param('repost_id');
                Message.findOne(repost_id).then(function (repost) {
                    message.repost = repost.repost ? repost.repost : repost._id;
                    message.owner = message.source;
                });
            }
            return message.save();
        }
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
        }
        return Message.find(where).sort('-time');
    },

    DELETE: function ($) {
        return Message.remove({
            _id: $.id
        });
    },

    read: function ($) {
        var conditions;
        if ($.has('id')) {
            Message.update({
                _id: $.param('id')
            }, {
                $set: {
                    unread: 0
                }
            });
        }
        if ($.has('target_id')) {
            conditions = {
                target: $.user._id,
                source: $.param('target_id')
            };
            $.notifyOne(conditions.source, {
                type: 'read',
                target_id: conditions.source
            });
            return Message.update(conditions, {
                $set: {
                    unread: 0
                }
            }, {
                multi: true
            });
        } else {
            return false;
        }
    },

    feed: function ($) {
        var follows;
        follows = $.user.follow.map(function (f) {
            return ObjectID(f);
        });
        return Message.find({
            owner: {
                $in: follows
            }
        });
    },

    dialogs: function ($) {
        var me;
        me = $.user._id;
        Message.aggregate(dialogs_condition(me), $.wrap(function (result) {
            var dialog, dialog_id, dialogs, i, len, user_ids;
            if (result.length <= 0) {
                $.send([]);
            }
            user_ids = [];
            dialogs = [];
            for (i = 0, len = result.length; i < len; i++) {
                dialog = result[i];
                if (dialog._id.source.toString() !== me.toString()) {
                    dialog_id = dialog._id.source;
                } else {
                    dialog_id = dialog._id.target;
                }
                if (!_.some(user_ids, function (user_id) {
                        return user_id.toString() === dialog_id.toString();
                    })) {
                    dialog.dialog_id = dialog_id;
                    dialogs.push(dialog);
                    user_ids.push(dialog_id);
                }
            }
            user_ids.push(me);
            return $.collection('users').find({
                _id: {
                    $in: user_ids
                }
            }, {
                _id: 1,
                domain: 1
            }, $.wrap(function (reader) {
                return reader.toArray($.wrap(function (users) {
                    var j, len1;
                    for (j = 0, len1 = dialogs.length; j < len1; j++) {
                        dialog = dialogs[j];
                        console.log(dialog);
                        dialog.target = _.find(users, function (u) {
                            return u._id.toString() === dialog._id.target.toString();
                        });
                        dialog.source = _.find(users, function (u) {
                            return u._id.toString() === dialog._id.source.toString();
                        });
                        delete dialog._id;
                    }
                    return $.send(dialogs);
                }));
            }));
        }));
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

function dialogs_condition(me) {
    return [
        {
            $match: {
                target: {
                    $exists: true
                }
            }
        },
        {
            $match: {
                $or: [
                    {
                        source: me
                    }, {
                        target: me
                    }
                ]
            }
        },
        {
            $sort: {
                time: -1
            }
        },
        {
            $group: {
                _id: {
                    source: '$source',
                    target: '$target'
                },
                message_id: {
                    $first: '$_id'
                },
                unread: {
                    $sum: '$unread'
                },
                count: {
                    $sum: 1
                },
                time: {
                    $first: '$time'
                },
                text: {
                    $first: '$text'
                }
            }
        }
    ];
}
