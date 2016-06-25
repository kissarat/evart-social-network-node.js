var rs = require('randomstring');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var utils = require('../utils');
var _ = require('underscore');

var code = utils.code;

var T = mongoose.Schema.Types;

global.schema.User = new mongoose.Schema({
    _id: utils.idType('User'),

    phone: {
        type: String,
        trim: true,
        match: /^\d{9,15}$/
    },

    hash: {
        type: String
        // match: /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{4})$/
    },

    domain: {
        type: String,
        required: true,
        match: /^[\w\._\-]{4,23}$/,
        lowercase: true,
        trim: true,
        index: {
            unique: true
        }
    },

    status: {
        type: String
    },

    type: {
        type: String,
        "enum": ['user', 'group', 'admin'],
        index: {
            unique: false
        }
    },

    lang: {
        type: String,
        "enum": ['en', 'ru']
    },

    avatar: {
        type: T.ObjectId,
        ref: 'Photo'
    },

    online: {
        type: Date,
        "default": function () {
            return Date.now() + 5 * 60000;
        }

    },

    background: {
        type: T.ObjectId,
        ref: 'File'
    },

    tiles: {
        type: T.Mixed,
        'default': {}
    },

    created: {
        type: Date,
        "default": Date.now
    },

    time: {
        type: Date,
        "default": Date.now
    },

    skype: {
        type: String,
        match: /^[a-zA-Z][a-zA-Z0-9\.,\-_]{5,31}$/
    },
    email: {
        type: String,
        match: /^.*@.*\..*$/
    },
    country: {
        type: String
    },
    city_id: {
        type: Number
    },
    city: {
        type: String
    },
    address: {
        type: String
    },
    name: {
        type: String
    },
    birthday: {
        type: Date
    },
    relationship: {
        type: Number
    },
    languages: {
        type: String,
        match: /^\w{2}$/
    },
    about: {
        type: String
    },
    verified: {
        type: Boolean,
        get: function () {
            return !this.code;
        }
    },
    follow: [
        {
            type: T.ObjectId,
            ref: 'User'
        }
    ],
    request: [
        {
            type: T.ObjectId,
            ref: 'User'
        }
    ],
    deny: [
        {
            type: T.ObjectId,
            ref: 'User'
        }
    ]
});

module.exports = {
    GET: function ($) {
        var params = ['id', 'domain'];
        var fields = schema.User.user_public_fields.join(' ');
        if ($.hasAny(params) && !$.has('list')) {
            return User.findOne($.paramsObject(params)).select(fields);
        } else if ($.has('ids')) {
            return User.find({
                _id: {
                    $in: $.ids('ids')
                }
            }).select(fields);
        } else {
            if ($.has('domain') && $.has('list')) {
                var list_name = $.param('list');
                if (list_name !== 'follow' && list_name !== 'deny') {
                    $.invalid('list', 'is not follow or deny');
                }
                User.findOne({
                    domain: $.param('domain')
                }).select(list_name).then(function (user) {
                    return search($, user[list_name]);
                });
            } else {
                return search($);
            }
        }
    },

    POST: function ($) {
        var data = $.allowFields(group_fields, admin_fields);
        data.type = 'group';
        var user = new User(data);
        user.save($.wrap(function () {
            return $.send(code.CREATED, {
                success: true,
                _id: user._id,
                domain: user.domain,
                type: user.type
            });
        }));
    },

    PUT: function ($) {
        var data = $.allowFields(user_fields, admin_fields);
        data.time = Date.now();
        return User.update({_id: $.id}, {
            $set: data
        }, {
            "new": true
        });
    },

    PATCH: function ($) {
        return new Promise(function (resolve, reject) {
            var where_me = {_id: $.user._id};
            if ($.has('online')) {
                var online = $.param('online');
                if (isNaN(online)) {
                    reject(code.BAD_REQUEST);
                }
                online = +online;
                var now = Date.now();
                var delta = (15 * 60 + 10) * 1000;
                if (online < 0) {
                    online = now - online;
                }
                if (online < now + delta) {
                    User.update(where_me, {$set: {online: online}}).then(resolve, reject);
                }
                else {
                    reject(code.BAD_REQUEST);
                }
            }
            else if ($.has('tile') && $.has('file_id')) {
                User.findOne(where_me, {tiles: 1}).catch(reject).then(function (user) {
                    user.tiles[$.param('tile')] = $.param('file_id');
                    user.markModified('tiles');
                    user.save().catch(reject).then(function () {
                        resolve({
                            tiles: user.tiles
                        });
                    })
                });
            }
            else {
                reject(code.BAD_REQUEST);
            }
        });
    },

    informer: function ($) {
        var id = $.id || $.user._id;
        var result = {};
        return new Promise(function (resolve, reject) {
            User.findOne({_id: id}, {follow: 1}).catch(reject).then(function (user) {
                result._id = user._id;
                var follows = utils.s(user.follow);
                User.find({_id: {$in: id}}, {_id: 1}).catch(reject).then(function (followers) {
                    result.followers = utils.s(_.pluck(followers, '_id'));
                    return Video.count({owner: id});
                })
                    .catch(reject)
                    .then(function (count) {
                        result.video = count;
                        return File.count({type: 'audio'});
                    })
                    .catch(reject)
                    .then(function (count) {
                        result.audio = count;
                        return User.find({_id: {$in: user.follow}, type: 'group'}, {_id: 1})
                    })
                    .catch(reject)
                    .then(function (groups) {
                        groups = utils.s(_.pluck(groups, '_id'));
                        follows = _.difference(follows, groups);
                        var friends = _.intersection(follows, result.followers);
                        result.follows = follows.length;
                        result.followers = result.followers.length;
                        result.groups = groups.length;
                        result.friends = friends.length;
                        resolve(result);
                    });
            });
        })
    },

    login: function ($) {
        if ($.user) {
            return $.sendStatus(code.FORBIDDEN, 'User is authorized');
        } else {
            var conditions = {
                hash: utils.hash($.post('password'))
            };
            var login = $.post('login').replace(/[\(\)\s]/, '');
            if (login.indexOf('@') >= 0) {
                conditions.email = login;
            } else if (/^[\d\-]+$/.exec(login)) {
                login = login.replace('-', '');
            } else if (/^[0-9a-z]{24}$/i.exec(login)) {
                conditions._id = ObjectID(login);
            } else {
                conditions.domain = login;
            }
            User.findOne(conditions, $.wrap(function (user) {
                if (user) {
                    conditions = {
                        auth: $.req.auth
                    };
                    var changeset = {
                        $set: {
                            user: user._id,
                            time: Date.now()
                        }
                    };
                    return Agent.update(conditions, changeset, $.wrap(function (result) {
                        if (result.nModified > 0) {
                            return $.send(extract(result));
                        } else {
                            return $.send(code.INTERNAL_SERVER_ERROR, {
                                error: {
                                    message: 'Unregistered agent'
                                }
                            });
                        }
                    }));
                } else {
                    return $.sendStatus(code.UNAUTHORIZED);
                }
            }));
        }
    },

    logout: function ($) {
        var conditions = {
            user: {
                $exists: true
            },
            auth: $.req.auth
        };
        var change = {
            $unset: {
                user: ''
            }
        };
        return Agent.update(conditions, change);
    },

    info: function ($) {
        var conditions = {
            auth: $.req.auth
        };
        Agent.findOne(conditions).populate('user').exec($.wrap(function (agent) {
            var result;
            result = {
                found: false
            };
            if (agent) {
                result.agent_id = agent._id;
                if (agent.user) {
                    result.user_id = agent.user._id;
                    result.domain = agent.user.domain;
                    result.phone = agent.user.phone;
                    result.found = true;
                }
            }
            return $.send(result);
        }));
    },

    status: function ($) {
        var status = $.param('status');
        status = status.trim().replace(/\s+/g, ' ');
        return User.update({
            _id: $.id
        }, {
            $set: {
                status: status
            }
        });
    },

    exists: {
        GET: function ($) {
            var conditions = {};
            var keys = ['domain', 'phone', 'email'];
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if ($.has(key)) {
                    var value = conditions[key] = $.get(key);
                    break;
                }
            }
            if (key && value) {
                User.find(conditions, conditions).count($.wrap(function (result) {
                    return $.send({
                        success: true,
                        exists: result > 0,
                        key: key,
                        value: value
                    });
                }));
            } else {
                $.sendStatus(code.BAD_REQUEST);
            }
        }
    },

    phone: function ($) {
        if ($.user) {
            return $.sendStatus(code.FORBIDDEN, 'User is authorized');
        }
        $.agent.phone = $.param('phone');
        if (config.sms.enabled) {
            $.agent.code = rs.generate({
                length: 6,
                charset: 'numeric'
            });
        }
        User.findOne({
            phone: $.agent.phone
        }, $.wrap(function (user) {
            var save;
            if (user) {
                return $.send({
                    error: {
                        message: 'The phone number already registered'
                    }
                });
            } else {
                save = function () {
                    return $.agent.save($.success);
                };
                if (config.sms.enabled) {
                    return $.sendSMS($.agent.phone, 'Code: ' + $.agent.code, save);
                } else {
                    return save();
                }
            }
        }));
    },

    code: function ($) {
        if ($.user) {
            return $.sendStatus(code.FORBIDDEN, 'User is authorized');
        }
        if ($.param('code') === $.agent.code) {
            $.agent.code = null;
            $.agent.save($.success);
        } else {
            return {
                success: false
            };
        }
    },

    personal: function ($) {
        if ($.user) {
            return $.sendStatus(code.FORBIDDEN, 'User is authorized');
        }
        var user = new User({
            phone: $.agent.phone,
            domain: $.param('domain'),
            email: $.param('email'),
            forename: $.param('surname'),
            surname: $.param('surname'),
            hash: utils.hash($.param('password'))
        });
        user.save($.success);
    },

    change: {
        POST: function ($) {
            var field = $.param('field');
            var changes = {};
            var fields = ['avatar', 'background'];
            if (fields.indexOf(field) >= 0) {
                changes[field] = ObjectID($.param('value'));
            } else {
                $.invalid('field', field);
            }
            return User.findOneAndUpdate({
                _id: $.user._id
            }, changes).select(fields.join(' '));
        }
    },

    list: {
        GET: function ($) {
            var name = $.param('name');
            if (!list_fields.hasOwnProperty(name)) {
                $.invalid('name');
            }
            var fields = {};
            fields['friend' === name ? 'follow' : name] = 1;
            var id = $.has('id') ? $.id : $.user._id;
            User.findOne(id, fields, $.wrap(function (user) {
                if ('friend' === name) {
                    search($, {
                        _id: {
                            $in: user.follow.map(ObjectID)
                        },
                        follow: user._id
                    }, true);
                } else {
                    search($, user[name], true);
                }
            }));
        },

        POST: modify_list(true),
        DELETE: modify_list(false)
    }
};

function modify_list(add) {
    return function ($) {
        var name = $.param('name');
        var source_id = $.has('source_id') ? $.get('source_id') : $.user._id;
        var target_id = $.param('target_id');
        if (!list_fields.hasOwnProperty(name)) {
            $.invalid('name');
        }
        var result = {success: true};
        return new Promise(function (resolve, reject) {
            User.findOne(source_id, {follow: 1}).catch(reject).then(function (user) {
                var index = _.findIndex(user.follow, function (current_id) {
                    return target_id.toString() == current_id.toString();
                });
                result.found = index >= 0;
                if (result.found == add) {
                    result.success = result.found && !add;
                    resolve(result);
                }
                else {
                    result.modified = true;
                    if (add) {
                        user.follow.push(target_id);
                    }
                    else {
                        user.follow.splice(index, 1);
                    }
                    user.save().catch(reject).then(function (user) {
                        resolve(result);
                    });
                }
            })
        });
    }
}

function toggle(array, element) {
    var i = array.indexOf(element);
    if (result) {
        array.push(element);
    } else {
        array.splice(i, 1);
    }
}

var list_fields = {
    follow: 'deny',
    deny: 'follow',
    friend: null,
    request: null
};

schema.User.user_public_fields = ["online", "domain", "type", "name", "surname", "forename", "city", "city_id", "country", "address", "phone",
    "avatar", "birthday", "languages", "relationship", "tiles", "lang"];
var user_fields = ["online", "name", "surname", "forename", "city", "city_id", "country", "address", "phone", "password", "avatar",
    "name", "birthday", "languages", "relationship", "lang"];
var group_fields = ["domain", "name", "about", "avatar"];
var admin_fields = ['domain', 'type'];

function search($, where, send) {
    var isArray = where instanceof Array;
    var ands = !where || isArray ? {} : where;
    if ($.has('q')) {
        var ORs = [];
        var q = $.search;
        ['domain', 'surname'].forEach(function (param) {
            var d = {};
            d[param] = {
                $regex: q
            };
            ORs.push(d);
        });
        if (ORs.length > 0) {
            ands.$or = ORs;
        }
    }
    ['country', 'city', 'sex', 'forename', 'relationship', 'type'].forEach(function (param) {
        if ($.has(param)) {
            ands[param] = $.param(param);
        }
    });
    if (isArray) {
        ands._id = {
            $in: where.map(function (id) {
                return ObjectID(id);
            })
        };
    }
    var r = User.find(ands).select($.select(['domain'], user_fields));
    if (send) {
        r.exec($.wrap(function (users) {
            return $.send(users);
        }));
    } else {
        return r;
    }
}

function extract(user) {
    return {
        success: true,
        _id: user._id,
        domain: user.domain,
        online: user.online
    };
}
