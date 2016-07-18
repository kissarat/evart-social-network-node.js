'use strict';

var rs = require('randomstring');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var utils = require('../utils');
var errors = require('../errors');
var _ = require('underscore');

var T = mongoose.Schema.Types;

var _schema = {
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

    type: {
        type: String,
        "enum": ['user', 'group', 'admin'],
        "default": "user",
        index: {
            unique: false
        }
    },

    lang: {
        type: String,
        "enum": ['en', 'ru']
    },

    sex: {
        type: String,
        "enum": ["male", "female"],
        "default": "male"
    },

    avatar: {
        type: T.ObjectId,
        ref: 'File'
    },

    online: {
        type: Date,
        "default": Date.now
    },

    background: {
        type: T.ObjectId,
        ref: 'File'
    },

    tiles: {
        0: {type: T.ObjectId, ref: 'File'},
        1: {type: T.ObjectId, ref: 'File'},
        2: {type: T.ObjectId, ref: 'File'},
        3: {type: T.ObjectId, ref: 'File'},
        4: {type: T.ObjectId, ref: 'File'},
        5: {type: T.ObjectId, ref: 'File'},
        6: {type: T.ObjectId, ref: 'File'}
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
        type: String,
        "enum": ["AF", "AL", "DZ", "AD", "AO", "AI", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BA", "BW", "BR", "BG", "BF", "BI", "KH", "CM", "CA", "CV", "KY", "CF", "TD", "CL", "CN", "CO", "KM", "CK", "CR", "HR", "CU", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "ET", "FO", "FJ", "FI", "FR", "GF", "PF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HN", "HK", "HU", "IS", "IN", "ID", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KW", "KG", "LV", "LB", "LS", "LR", "LI", "LT", "LU", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "MX", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MP", "NO", "OM", "PK", "PW", "PA", "PG", "PY", "PE", "PH", "PL", "PT", "PR", "QA", "RO", "RU", "RW", "RE", "WS", "SM", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "ES", "LK", "SD", "SR", "SJ", "SZ", "SE", "CH", "TJ", "TH", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "UY", "UZ", "VU", "WF", "YE", "ZM", "ZW"],
        "default": "RU"
    },

    relationship: {
        type: String,
        "enum": [null, "single", "in", "engaged", "married", "love", "complex", "search"]
    },

    status: utils.StringType(140),
    city_id: Number,
    city: utils.StringType(),
    address: utils.StringType(128),
    name: utils.StringType(48),
    birthday: Date,
    about: utils.StringType(512),
    css: utils.StringType(512),

    languages: [{
        type: String,
        match: /^\w{2}$/
    }],

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
    ],

    admin: [
        {
            type: T.ObjectId,
            ref: 'User'
        }
    ]
};

var _schema_options = utils.merge(config.mongoose.schema.options, {
    collection: 'user',
    createAt: 'created'
});

global.schema.User = new mongoose.Schema(_schema, _schema_options);

schema.User.statics.fields = {
    select: {
        user: ["online", "domain", "type", "name", "surname", "forename",
            "city", "city_id", "country", "address", "phone", "avatar", "birthday", "languages",
            "relationship", "tiles", "lang", "avatar", "background", "admin"]
    },

    update: {
        user: ["online", "name", "surname", "forename", "city", "city_id", "country",
            "address", "phone", "password", "avatar", "name", "birthday", "languages", "relationship",
            "lang", "background"],
        group: ["domain", "name", "about", "avatar"],
        admin: ['domain', 'type']
    },

    project: {
        _id: 1,
        domain: 1,
        online: 1,
        surname: 1,
        forename: 1,
        name: 1,
        avatar: 1
    }
};

schema.User.statics.search = function search($) {
    var ANDs = [];
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
            ANDs.push({$or: ORs});
        }
    }
    ['country', 'city', 'sex', 'forename', 'relationship', 'type'].forEach(function (param) {
        if ($.has(param)) {
            ANDs[param] = $.param(param);
        }
    });
    return ANDs.length > 0 ? {$and: ANDs} : {};
};

module.exports = {
    _meta: {
        schema: _schema
    },

    _before: function ($) {
        var last = _.last($.req.url.route);
        if ('POST' != $.req.method && $.isUpdate && !_.contains(['exists', 'phone', 'code', 'personal', 'login'], last)) {
            return $.canManage($.id);
        }
        return true;
    },

    GET: function ($) {
        var params = ['id', 'domain'];
        var r = {select: $.select(User.fields.select.user)};
        if ($.hasAny(params)) {
            let object = $.paramsObject(params);
            r.single = true;
            r.query = object;
            r = [
                {
                    deny: $.merge(object, {
                        deny: $.user._id
                    })
                },
                r
            ];
        }
        else {
            r.query = User.search($);
        }
        return r;
    },

    POST: function ($) {
        var data = _.pick($.body, 'password', 'domain', 'email', 'forename', 'surname');
        data.phone = $.agent.phone;
        var user = new User(data);
        user.hash = utils.hash(data.password);
        return user.save();
    },
/*
    PUT: function ($) {
        var data = $.allowFields(User.fields.update.group, User.fields.update.admin);
        data.type = 'group';
        var user = new User(data);
        user.save($.wrap(function () {
            $.send(code.CREATED, {
                success: true,
                _id: user._id,
                domain: user.domain,
                type: user.type
            });
        }));
    },
*/
    PATCH: function ($) {
        var id = $.id || $.user._id;
        return new Promise(function (resolve, reject) {
            var where_me = {_id: id};
            if ($.has('tile') && $.has('file_id')) {
                User.findOne(where_me, {tiles: 1}).catch(reject).then(function (user) {
                    user.tiles[$.param('tile')] = $.param('file_id');
                    // user.time = Date.now();
                    user.markModified('tiles');
                    user.save().catch(reject).then(function () {
                        resolve({
                            tiles: user.tiles
                        });
                    })
                });
            }
            else {
                let changes = {time: Date.now()};
                let a = ['avatar', 'background'];
                for (let i = 0; i < a.length; i++) {
                    let p = a[i];
                    let p_id = p + '_id';
                    if ($.has(p_id)) {
                        changes[p] = $.param(p_id);
                        User.update(where_me, {$set: changes}).then(resolve, reject);
                        return;
                    }
                }
                let fields = a.concat(['tile']).join(', ');
                reject(code.BAD_REQUEST, {
                    message: `You can update ${fields} only`
                });
            }
        });
    },

    DELETE: function ($) {
        if ($.isAdmin) {
            return User.remove({_id: $.get('id')})
        }
    },

    informer: function ($) {
        var id = $.id || $.user._id;
        var object = {
            follows: {
                pick: 'follow',
                select: {follow: 1},
                query: {_id: id}
            },
            groups: {
                pick: '_id',
                select: {follow: 1},
                query: function (bundle) {
                    bundle.follows = _.isEmpty(bundle.follows) ? [] : bundle.follows;
                    return {
                        type: 'group',
                        _id: {$in: bundle.follows}
                    }
                }
            },
            followers: {
                pick: '_id',
                count: true,
                query: {follow: id}
            },
            video: {
                collection: 'video',
                count: true,
                query: {owner: id}
            },
            audio: {
                collection: 'file',
                count: true,
                query: {
                    type: 'audio',
                    owner: id
                }
            },
            photo: {
                collection: 'file',
                count: true,
                query: {
                    type: 'photo',
                    owner: id
                }
            },
            files: {
                collection: 'file',
                count: true,
                query: {
                    type: {$nin: ['photo', 'audio']},
                    owner: id
                }
            }
        };

        var queries = [];
        var select = $.select();
        var showFriends = _.contains(select, 'friends');
        if (showFriends) {
            select.push('followers')
        }
        if (_.intersection(select, ['groups', 'followers']).length > 0) {
            select.push('follows');
        }
        _.each(object, function (field, name) {
            if (_.contains(select, name)) {
                field.name = name;
                queries.push(field);
            }
        });

        queries.push(function (result, bundle) {
            bundle._id = id;
            if (bundle.follows) {
                if (bundle.groups) {
                    bundle.follows = _.difference(bundle.follows, bundle.groups, utils.equals);
                    bundle.groups = bundle.groups.length;
                }
                if (showFriends && bundle.followers) {
                    bundle.friends = _.intersection(bundle.follows, bundle.followers, utils.equals);
                    bundle.friends = bundle.friends.length;
                }
                bundle.follows = bundle.follows.length;
            }
            $.send(bundle);
        });
        return queries;
    },

    login: function ($) {
        if ($.user) {
            $.send(Agent.extract($.agent));
        } else {
            var conditions = {hash: utils.hash($.post('password'))};
            var login = $.post('login').replace(/[\(\)\s]/, '');
            if (login.indexOf('@') >= 0) {
                conditions.email = login;
            }
            else if (/^[\d\-]+$/.exec(login)) {
                login = login.replace('-', '');
            }
            else if (/^[0-9a-z]{24}$/i.exec(login)) {
                conditions._id = ObjectID(login);
            }
            else {
                conditions.domain = login;
            }
            User.findOne(conditions, $.wrap(function (user) {
                if (user) {
                    conditions = {
                        auth: $.req.auth
                    };
                    var changes = {
                        $set: {
                            user: user._id,
                            time: Date.now()
                        }
                    };
                    Agent.findOneAndUpdate(conditions, changes, $.wrap(function (result) {
                        if (result) {
                            result.user = user;
                            $.send(Agent.extract(result))
                        }
                        else {
                            $.sendStatus(code.NOT_FOUND);
                        }
                    }));
                } else {
                    $.sendStatus(code.UNAUTHORIZED);
                }
            }));
        }
    },

    logout: function ($) {
        var conditions = {auth: $.req.auth};
        var changes = {$unset: {user: 1}};
        Agent.findOneAndUpdate(conditions, changes, $.wrap(function (result) {
            if (result) {
                $.send(Agent.extract(result))
            }
            else {
                $.sendStatus(code.NOT_FOUND);
            }
        }));
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
            $.send(result);
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

    exists: function ($) {
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
                $.send({
                    success: true,
                    exists: result > 0,
                    key: key,
                    value: value
                });
            }));
        } else {
            $.sendStatus(code.BAD_REQUEST);
        }
    },

    phone: function ($) {
        if ($.isAuthenticated) {
            $.sendStatus(code.FORBIDDEN, 'User is authorized');
            return;
        }
        $.agent.phone = $.param('phone');
        if (config.sms.enabled) {
            $.agent.code = rs.generate({
                length: 6,
                charset: 'numeric'
            });
        }
        User.findOne({phone: $.agent.phone}, $.wrap(function (user) {
            function save() {
                $.agent.save($.success, $.wrap(function () {
                    $.sendStatus(code.OK);
                }));
            }

            if (user) {
                $.send({error: {message: 'The phone number already registered'}});
            } else {
                if (config.sms.enabled) {
                    $.server.sendSMS($.agent.phone, 'Code: ' + $.agent.code, $.wrap(save));
                } else {
                    save();
                }
            }
        }));
    },

    code: function ($) {
        if ($.isAdmin) {
            return Agent.find({code: {$exists: true}}, {user: 1, agent: 1})
                .populate('user', 'domain')
        }
        else if ($.isAuthenticated) {
            $.sendStatus(code.FORBIDDEN, 'User is authorized');
            return;
        }
        if ($.param('code') === $.agent.code) {
            $.agent.code = null;
            $.agent.save($.success);
        }
        else {
            return {success: false};
        }
    }
};
