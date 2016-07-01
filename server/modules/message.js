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

var _schema = {
    _id: utils.idType('Message'),

    type: {
        type: String,
        enum: _.values(MessageType),
        index: {
            unique: false
        }
    },

    source: {
        type: T.ObjectId,
        ref: 'User',
        required: true,
        index: {
            sparse: true,
            unique: false
        }
    },

    target: {
        type: T.ObjectId,
        ref: 'User',
        index: {
            sparse: true,
            unique: false
        }
    },

    owner: {
        type: T.ObjectId,
        ref: 'User',
        index: {
            sparse: true,
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
        "default": Date.now,
        index: {
            unique: false
        }
    },

    unread: {
        type: Number,
        "default": 1,
        index: {
            unique: false,
            partialFilterExpression: {unread: 1}
        }
    },

    text: utils.StringType(2048),

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
};

global.schema.Message = mongoose.Schema(_schema, utils.merge(config.mongoose.schema.options, {
    collection: 'message'
}));

schema.Message.statics.Type = MessageType;
schema.Message.statics.fields = {
    select: {
        user: ['type', 'source', 'target', 'owner', 'like', 'hate',
            'file', 'files', 'video', 'videos', 'text', 'repost']
    }
};

module.exports = {
    _meta: {
        schema: _schema
    },

    read, dialogs,

    GET: function ($) {
        var where = [];
        if ($.has('type')) {
            where.push({type: $.get('type')})
        }
        var project = $.select(['time', 'text'], Message.fields.select.user);
        var me = $.user._id;
        switch ($.get('type', true)) {
            case Message.Type.DIALOG:
                var id = $.get('id');
                where.push({
                    $or: [{
                        source: me,
                        target: id
                    }, {
                        source: id,
                        target: me
                    }]
                });
                if ($.has('since')) {
                    where.push({
                        time: {$gte: new Date($.get('since')).toISOString()}
                    });
                }
                break;

            case Message.Type.WALL:
                where.push({owner: $.get('owner_id', me)});
                break;

            case 'feed':
                where.push({
                    type: Message.Type.WALL,
                    owner: {$in: $.user.follow.map(id => ObjectID(id))}
                });
                break;

            default:
                if ($.has('unread') && $.get('unread')) {
                    where.push({unread: $.get('unread')});
                }
                where.push({
                    $or: [
                        {owner: $.get('owner_id', me)},
                        {source: me},
                        {target: me}
                    ]
                });
                break;
        }

        var aggregate = [
            {
                $match: {
                    $and: where
                }
            }
        ];
        var _project = {};

        var user_fields = $.get('user', []);

        user_fields.forEach(function (name) {
            aggregate.push({
                $lookup: {
                    'as': name,
                    localField: name,
                    from: 'user',
                    foreignField: '_id'
                }
            });
            aggregate.push({
                $unwind: {
                    path: '$' + name
                }
            });
            _project[name] = User.fields.project
        });

        project.forEach(function (name) {
            _project[name] = 1;
        });

        aggregate.push({
            $project: _project
        });

        return {
            query: aggregate
        };
    },

    POST: function ($) {
        var message = $.allowFields(Message.fields.select.user);
        message.source = $.user._id;
        var targets = [];
        ['target', 'owner'].forEach(function (name) {
            var id = message[name];
            if (id) {
                targets.push(id)
            }
        });
        message = new Message(message);
        message.save($.wrap(function () {
            if ($.has('parent_id')) {
                Message.update({_id: $.param('parent_id')}, {$push: {children: message._id}});
            }
            $.send(message);
            _.uniq(targets).forEach(id => $.notifyOne(id, message));
        }));
    },

    DELETE: function ($) {
        return Message.remove({
            _id: $.id
        });
    }
};

function read($) {
    if ($.has('id') && $.has('unread')) {
        return Message.update({_id: $.param('id')}, {$set: {unread: $.param('unread')}});
    }
    if ($.has('target_id')) {
        let you = $.param('target_id');
        let where = {
            unread: 1,
            source: you,
            target: $.user._id
        };
        return [{
            name: 'messages',
            query: where,
            select: ['_id']
        }, {
            query: where,
            $set: {unread: 0}
        },
            function (result, bundle) {
                result = $.merge(result.result, {
                    success: !!result.result.ok,
                    type: 'read',
                    dialog_id: where.source,
                    ids: _.pluck(bundle.messages, '_id')
                });
                $.send(result);
                $.notifyOne(you, result);
            }
        ]
    }
    else {
        return {
            select: true,
            query: {
                unread: 1
            }
        };
    }
}

function dialogs($) {
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
            $sort: {
                time: -1
            }
        },
        {
            $lookup: {
                'as': 'peer',
                localField: '_id',
                from: 'user',
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
        peer: User.fields.project
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
    return {
        query: where
    };
}
