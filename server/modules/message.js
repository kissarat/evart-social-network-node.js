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
    VIDEO: 'video',
    COMMENT: 'comment',
    CHAT: 'chat'
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

    chat: {
        type: T.ObjectId,
        ref: 'Chat',
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

    text: utils.StringType(2048, 1),

    repost: {
        type: T.ObjectId,
        ref: 'Message'
    },

    parent: {
        type: T.ObjectId,
        ref: 'Message',
        "default": null
    }
};

global.schema.Message = mongoose.Schema(_schema, utils.merge(config.mongoose.schema.options, {
    collection: 'message'
}));

schema.Message.statics.Type = MessageType;
schema.Message.statics.fields = {
    select: {
        user: ['type', 'source', 'target', 'owner', 'attitude', 'like', 'hate', 'file', 'files',
            'video', 'videos', 'text', 'repost', 'parent']
    }
};

module.exports = {
    _meta: {
        schema: _schema
    },

    read, dialogs, chats,

    GET: function ($) {
        if ($.has('id') && !$.has('type')) {
            return {
                single: true,
                query: {
                    _id: $.get('id')
                }
            }
        }
        const ANDs = [];
        var permission;
        if ($.has('type')) {
            ANDs.push({type: $.get('type')})
        }
        const me = $.user._id;
        switch ($.get('type', true)) {
            case Message.Type.DIALOG:
                if (!$.has('id') && $.isAdmin) {
                    break;
                }
                var id = $.get('id');
                ANDs.push({
                    $or: [{
                        source: me,
                        target: id
                    }, {
                        source: id,
                        target: me
                    }]
                });
                if ($.has('since')) {
                    ANDs.push({
                        time: {$gte: new Date($.get('since')).toISOString()}
                    });
                }
                break;

            case Message.Type.WALL:
                if (!$.has('owner_id') && $.isAdmin) {
                    break;
                }
                var owner_id = $.get('owner_id', me);
                if (!owner_id.equals(me)) {
                    permission = {
                        collection: 'user',
                        deny: {
                            _id: owner_id,
                            deny: me
                        }
                    };
                }
                ANDs.push({owner: owner_id});
                if ($.has('attitude')) {
                    let attitude = $.get('attitude');
                    if (attitude) {
                        ANDs.push(utils.associate(attitude, me));
                    }
                    else {
                        ANDs.push({'like': {$ne: me}});
                        ANDs.push({'hate': {$ne: me}});
                    }
                }
                break;

            case Message.Type.COMMENT:
                ANDs.push({
                    parent: $.get('id')
                });
                break;

            case Message.Type.CHAT:
                ANDs.push({
                    chat: $.get('id')
                });
                break;

            case 'feed':
                ANDs.push({
                    type: Message.Type.WALL,
                    owner: {$in: $.user.follow.map(id => ObjectID(id))}
                });
                break;

            default:
                if ('admin' != $.user.type) {
                    return code.BAD_REQUEST;
                }
        }

        const aggregate = [];
        if (ANDs.length > 0) {
            aggregate.push({
                $match: {
                    $and: ANDs
                }
            });
        }

        const lookups = {
            user: User.fields.project,
            message: $.select([], Message.fields.select.user, true)
            // file: $.select([], File.fields.select.user, true)
        };

        var project = $.select([], Message.fields.select.user, true);
        _.each(lookups, function (_project, lookup) {
            $.get(lookup, []).forEach(function (name) {
                aggregate.push({
                    $lookup: {
                        'as': name,
                        localField: name,
                        from: lookup,
                        foreignField: '_id'
                    }
                });

                if ('file' !== name) {
                    aggregate.push({
                        $unwind: {
                            path: '$' + name
                        }
                    });
                }
                project[name] = _project;
            });
        });
        if (!_.isEmpty(project)) {
            aggregate.push({
                $project: project
            });
        }
        if (_.isEmpty(permission)) {
            return {query: aggregate};
        }
        return [
            permission,
            {
                limit: true,
                query: aggregate
            }
        ];
    },

    POST: function ($) {
        var message = $.allowFields(Message.fields.select.user);
        message.source = $.user._id;
        var targets = [];
        ['target', 'owner', 'source', 'parent', 'chat'].forEach(function (name) {
            var value = message[name];
            if (value) {
                if (_.isEmpty(value)) {
                    $.invalid(name);
                }
                if (value.attributes) {
                    value = value.attributes;
                }
                message[name] = value._id ? value._id : value;
            }
        });
        ['target', 'owner'].forEach(function (name) {
            var id = message[name];
            if (id) {
                targets.push(id)
            }
        });
        targets = _.uniq(targets);
        function post(allow) {
            if (allow) {
                if (message.files instanceof Array) {
                    message.files = message.files.map(file => ObjectID(file._id ? file._id : file))
                }
                message = new Message(message);
                message.save($.wrap(function () {
                    message = message.toObject();
                    if (message.files && !message.files.length) {
                        delete message.files;
                    }
                    switch (message.type) {
                        case Message.Type.DIALOG:
                            delete message.like;
                            delete message.hate;
                            delete message.parent;
                            break;

                        case Message.Type.WALL:
                            delete message.parent;
                            break;
                    }
                    delete message.v;
                    $.send(message);
                    targets.forEach(function (id) {
                        if (!$.user._id.equals(id)) {
                            $.notifyOne(id, message);
                        }
                    });
                }));
            }
            else {
                $.sendStatus(code.FORBIDDEN);
            }
        }

        if (0 === targets.length && ($.has('chat') || $.has('parent'))) {
            post(1);
        }
        else {
            $.accessUser(targets).then(post);
        }
    },

    DELETE: function ($) {
        if ('admin' === $.user.type) {
            return Message.remove({
                _id: $.id
            });
        }
        else {
            return code.FORBIDDEN;
        }
    }
};

function read($) {
    if ($.has('id') && $.has('unread')) {
        return [
            {query: {_id: $.param('id')}},
            {$set: {unread: $.param('unread')}}
        ];
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
        let id = $.user._id;
        let ANDs = [
            {unread: 1},
            {
                $or: [
                    {owner: id},
                    {target: id}
                ]
            }
        ];
        if ($.has('type')) {
            ANDs.push({type: $.get('type')})
        }
        return {
            select: true,
            query: {
                $and: ANDs
            }
        };
    }
}

function chats($) {
    var id = 'admin' === $.user.type ? $.get('id', $.user._id) : $.user._id;
    var aggregate = [{
        $match: {
            chat: {$exists: true}
        }
    }, {
        $lookup: {
            localField: 'chat',
            as: 'chat',
            from: 'chat',
            foreignField: '_id'
        }
    }, {
        $unwind: {
            path: '$chat',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $match: {
            $or: [
                {'chat.admin': id},
                {'chat.follow': id}
            ]
        }
    }, {
        $group: {
            _id: '$chat._id',
            chat: {
                $last: '$chat'
            }
        }
    }];

    return {
        query: aggregate
    }
}

function dialogs($) {
    // var id = $.get('id');
    // if (!$.isAdmin && !id.equals($.user._id)) {
    //     $.invalid('id', 'You can view your dialogs only');
    // }
    var id = $.user._id;
    var OR = [
        {admin: id},
        {follow: id}
    ];
    return new Promise(function (resolve, reject) {
        Chat.find({$or: OR}).catch(reject).then(function (chats) {
            chats = chats.map(chat => chat._id);
            var match = [
                {
                    $or: [
                        {type: Message.Type.DIALOG},
                        {type: Message.Type.CHAT}
                    ]
                },
                {
                    $or: [
                        {source: id},
                        {target: id},
                        {chat: {$in: chats}}
                    ]
                }
            ];
            if ($.has('unread') && $.param('unread')) {
                match.push({unread: 1});
            }
            if ($.has('since')) {
                match.push({time: {$gt: $.param('since')}});
            }
            if ($.has('type')) {
                match.push({type: $.param('type')});
            }
            var aggregate = [{
                $match: {$and: match}
            }, {
                $group: {
                    _id: {
                        $cond: {
                            if: {$eq: ['$type', 'chat']},
                            then: '$chat',
                            else: {
                                $cond: {
                                    if: {$eq: ['$source', id]},
                                    then: '$target',
                                    else: '$source'
                                }
                            }
                        }
                    },
                    source: {$last: '$source'},
                    last_id: {$last: '$_id'},
                    unread: {
                        $sum: {
                            $cond: {
                                if: {$eq: ['$source', id]},
                                then: 0,
                                else: '$unread'
                            }
                        }
                    },
                    count: {$sum: 1},
                    time: {$last: '$time'},
                    text: {$last: '$text'},
                    chat: {$last: '$chat'},
                    type: {$last: '$type'}
                }
            }, {
                $sort: $.order || {
                    time: -1
                }
            }, {
                $lookup: {
                    'as': 'peer',
                    localField: '_id',
                    from: 'user',
                    foreignField: '_id'
                }
            }, {
                $unwind: {
                    path: '$peer',
                    preserveNullAndEmptyArrays: true
                }
            }, {
                $lookup: {
                    'as': 'chat',
                    localField: '_id',
                    from: 'chat',
                    foreignField: '_id'
                }
            }, {
                $unwind: {
                    path: '$chat',
                    preserveNullAndEmptyArrays: true
                }
            }];
            var project = {
                _id: 1,
                time: 1,
                count: 1,
                unread: 1,
                text: 1,
                source: 1,
                peer: User.fields.project,
                chat: {
                    _id: 1,
                    name: 1,
                    time: 1
                },
                type: 1
            };

            if ($.has('q')) {
                let q = $.get('q');
                if (q = q.trim()) {
                    aggregate.push({
                        $match: {
                            $or: [
                                {surname: {$regex: q}},
                                {forename: {$regex: q}},
                                {domain: {$regex: q}},
                                {name: {$regex: q}}
                            ]
                        }
                    });
                }
            }

            if ($.has('cut')) {
                var cut = +$.param('cut');
                if (cut > 0) {
                    project.text = {$substr: ['$text', 0, $.param('cut')]};
                }
                else {
                    $.invalid('cut', 'Must be positive');
                }
            }
            aggregate.push({$project: project});
            aggregate.push({$limit: $.limit});
            Message
                .aggregate(aggregate)
                .then(resolve)
                .catch(reject);
        });
    });
}
