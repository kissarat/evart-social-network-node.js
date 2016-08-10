'use strict';

const bandom = require('bandom');
const mongoose = require('mongoose');
const ObjectID = require('mongodb').ObjectID;
const utils = require('../utils');
const _ = require('underscore');

const T = mongoose.Schema.Types;

const _schema = {
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
        'enum': ['user', 'group', 'admin'],
        'default': 'user',
        index: {
            unique: false
        }
    },

    lang: {
        type: String,
        'enum': ['en', 'ru']
    },

    sex: {
        type: String,
        'enum': ['male', 'female'],
        'default': 'male'
    },

    avatar: {
        type: T.ObjectId,
        ref: 'File'
    },

    online: {
        type: Date,
        'default': Date.now
    },

    background: {
        type: T.ObjectId,
        ref: 'File'
    },

    tiles: {
        0: {type: T.ObjectId, ref: 'File', default: ObjectID('050000000000000000000000')},
        1: {type: T.ObjectId, ref: 'File', default: ObjectID('050000000000000000000001')},
        2: {type: T.ObjectId, ref: 'File', default: ObjectID('050000000000000000000002')},
        3: {type: T.ObjectId, ref: 'File', default: ObjectID('050000000000000000000003')},
        4: {type: T.ObjectId, ref: 'File', default: ObjectID('050000000000000000000004')},
        5: {type: T.ObjectId, ref: 'File', default: ObjectID('050000000000000000000005')},
        6: {type: T.ObjectId, ref: 'File', default: ObjectID('050000000000000000000006')}
    },

    created: {
        type: Date,
        'default': Date.now
    },

    time: {
        type: Date,
        'default': Date.now
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
        'enum': ['AF', 'AL', 'DZ', 'AD', 'AO', 'AI', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BA', 'BW', 'BR', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA', 'CV', 'KY', 'CF', 'TD', 'CL', 'CN', 'CO', 'KM', 'CK', 'CR', 'HR', 'CU', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'ET', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY', 'HT', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KW', 'KG', 'LV', 'LB', 'LS', 'LR', 'LI', 'LT', 'LU', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'MX', 'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE', 'NG', 'NU', 'NF', 'MP', 'NO', 'OM', 'PK', 'PW', 'PA', 'PG', 'PY', 'PE', 'PH', 'PL', 'PT', 'PR', 'QA', 'RO', 'RU', 'RW', 'RE', 'WS', 'SM', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SK', 'SI', 'SB', 'SO', 'ZA', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SZ', 'SE', 'CH', 'TJ', 'TH', 'TG', 'TK', 'TO', 'TT', 'TN', 'TR', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'UY', 'UZ', 'VU', 'WF', 'YE', 'ZM', 'ZW'],
        'default': 'RU'
    },

    relationship: {
        type: String,
        'enum': [null, 'single', 'in', 'engaged', 'married', 'love', 'complex', 'search']
    },

    code: {
        type: Number
    },

    forename: utils.StringType(48),
    surname: utils.StringType(48),

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
    ],

    agents: [
        {
            type: T.ObjectId,
            ref: 'Agent'
        }
    ]
};

const _schema_options = utils.merge(config.mongoose.schema.options, {
    collection: 'user',
    createAt: 'created'
});

global.schema.User = new mongoose.Schema(_schema, _schema_options);

schema.User.statics.fields = {
    select: {
        user: ['online', 'domain', 'type', 'name', 'surname', 'forename',
            'city', 'city_id', 'country', 'address', 'phone', 'avatar', 'birthday', 'languages',
            'relationship', 'tiles', 'lang', 'avatar', 'background', 'admin']
    },

    update: {
        user: ['online', 'name', 'surname', 'forename', 'city', 'city_id', 'country',
            'address', 'phone', 'password', 'avatar', 'name', 'birthday', 'languages', 'relationship',
            'lang', 'background', 'tiles'],
        group: ['domain', 'name', 'about', 'avatar'],
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

schema.User.statics.generateCode = function () {
    return bandom.digits(6);
};

schema.User.statics.search = function search($) {
    const ANDs = [];
    if ($.has('q')) {
        var ORs = [];
        var q = $.search;
        ['domain', 'surname', 'forename'].forEach(function (param) {
            const d = {};
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

schema.User.statics.filter = function ($, aggregate) {
    if ($.has('q')) {
        var ORs = [];
        var q = $.search;
        ['domain', 'surname', 'forename'].forEach(function (param) {
            var d = {};
            d[param] = {
                $regex: q
            };
            ORs.push(d);
        });
        if (ORs.length > 0) {
            aggregate.push({
                $match: {
                    $or: ORs
                }
            });
        }
    }
};

function responseSMS(cb) {
    return function (response) {
        var result = {
            success: !!response.sid,
            status: response.status
        };
        if (result.success) {
            result.sid = response.sid;
            result.time = response.dateUpdated;
            cb(result);
        }
        else {
            cb(result);
        }
    };
}

module.exports = {
    _meta: {
        schema: _schema
    },

    _before: function ($) {
        var last = _.last($.req.url.route);
        if ('POST' != $.req.method && $.isUpdate && !_.contains(['exists', 'phone', 'code', 'personal', 'login', 'password'], last)) {
            return $.has('id') ? $.canManage($.get('id')) : true;
        }
        return true;
    },

    GET: function ($) {
        var params = ['id', 'domain'];
        var r = {select: $.select(User.fields.select.user)};
        if ($.hasAny(params)) {
            const object = $.paramsObject(params);
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

    PUT: function ($) {
        var data = $.allowFields(User.fields.update.user, User.fields.update.admin);
        return User.update({_id: $.get('id')}, {$set: data});
    },

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
                    });
                });
            }
            else {
                const changes = {time: Date.now()};
                const a = ['avatar', 'background'];
                for (let i = 0; i < a.length; i++) {
                    const p = a[i];
                    const p_id = p + '_id';
                    if ($.has(p_id)) {
                        changes[p] = $.param(p_id);
                        User.update(where_me, {$set: changes}).then(resolve, reject);
                        return;
                    }
                }
                const fields = a.concat(['tile']).join(', ');
                reject(code.BAD_REQUEST, {
                    message: `You can update ${fields} only`
                });
            }
        });
    },

    DELETE: function ($) {
        if ($.isAdmin) {
            return User.remove({_id: $.get('id')});
        }
    },

    sample: function ($) {
        var ag = [
            {
                $match: {
                    type: $.get('type', 'user')
                }
            },
            {
                $sample: {size: $.get('size', 1)}
            },
            {
                $project: {
                    _id: 1,
                    domain: 1
                }
            }
        ];
        User.aggregate(ag).exec($.wrap(function (users) {
            $.send(users);
        }));
    },

    informer: function ($) {
        var id = $.get('id', $.user._id);
        var object = {
            follows: {
                single: true,
                get: 'follow',
                select: {follow: 1},
                query: {_id: id}
            },
            groups: {
                pluck: '_id',
                select: {follow: 1},
                query: function (bundle) {
                    bundle.follows = _.isEmpty(bundle.follows) ? [] : bundle.follows;
                    return {
                        type: 'group',
                        _id: {$in: bundle.follows}
                    };
                }
            },
            followers: {
                pluck: '_id',
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
        if (_.contains(select, 'friends')) {
            select.push('followers');
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
            ['follows', 'followers', 'friends', 'groups'].forEach(function (name) {
                if (bundle[name] instanceof Array) {
                    bundle[name] = bundle[name].map(id => id.toString());
                }
            });
            if (bundle.follows instanceof Array) {
                if (bundle.groups) {
                    bundle.follows = _.difference(bundle.follows, bundle.groups);
                }
                if (bundle.followers) {
                    bundle.friends = _.intersection(bundle.follows, bundle.followers);
                }
            }
            ['follows', 'followers', 'friends', 'groups'].forEach(function (name) {
                if (bundle[name] instanceof Array) {
                    bundle[name] = bundle[name].length;
                }
            });
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
                            $.send(Agent.extract(result));
                        }
                        else {
                            $.sendStatus(code.NOT_FOUND);
                        }
                    }));
                } else {
                    $.send(code.UNAUTHORIZED, {
                        success: false,
                        condition: conditions
                    });
                }
            }));
        }
    },

    logout: function ($) {
        const conditions = {auth: $.req.auth};
        const changes = {$unset: {user: 1}};
        Agent.findOneAndUpdate(conditions, changes, $.wrap(function (result) {
            if (result) {
                $.send(Agent.extract(result));
            }
            else {
                $.sendStatus(code.NOT_FOUND);
            }
        }));
    },

    info: function ($) {
        const conditions = {
            auth: $.req.auth
        };
        Agent.findOne(conditions).populate('user').exec($.wrap(function (agent) {
            const result = {
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
        const status = $.param('status')
            .replace(/\s+/g, ' ')
            .trim();
        return User.update({
            _id: $.id
        }, {
            $set: {
                status: status
            }
        });
    },

    exists: function ($) {
        const conditions = {};
        const keys = ['domain', 'phone', 'email'];
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
            $.agent.code = User.generateCode();
        }
        User.findOne({phone: $.agent.phone}, $.wrap(function (user) {
            function save(response) {
                $.agent.save($.success, $.wrap(function () {
                    $.send(code.OK, response);
                }));
            }

            if (user) {
                $.send({error: {message: 'The phone number already registered'}});
            } else {
                if (config.sms.enabled) {
                    $.server.sendSMS($.agent.phone, 'Code: ' + $.agent.code, $.wrap(responseSMS(save)));
                } else {
                    save();
                }
            }
        }));
    },

    code: function ($) {
        if ($.isAdmin) {
            return Agent.find({code: {$exists: true}}, {user: 1, agent: 1})
                .populate('user', 'domain');
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
    },

    recover: function ($) {
        if ('GET' === $.req.method) {
            return code.METHOD_NOT_ALLOWED;
        }
        else if ($.isAuthenticated()) {
            $.send(code.FORBIDDEN, {
                error: {
                    message: 'User is authenticated'
                }
            });
            return;
        }
        const phone = $.param('phone');
        User.findOne({phone: phone.replace(/[^\d]/g, '')}).exec($.wrap(function (user) {
            var result = {
                auth: $.agent.auth
            };
            if (user) {
                if (Date.now() > user.time.getTime() + config.sms.interval * 1000) {
                    user.code = User.generateCode();
                    $.server.sendSMS(phone, 'Code: ' + user.code, $.wrap(responseSMS(function (response) {
                        _.defaults(result, response);
                        user.time = new Date(result.time);
                        result.expires = new Date(user.time.getTime() + config.sms.interval * 1000).toISOString();
                        user.save($.wrap(function () {
                            $.send(result);
                        }));
                    })));
                }
                else {
                    result.status = 'SENDING';
                    $.send(code.FORBIDDEN, {
                        expires: new Date(user.time.getTime() + config.sms.interval * 1000).toISOString()
                    });
                }
            }
            else {
                $.sendStatus(code.NOT_FOUND);
            }
        }));
    },

    password: function ($) {
        var id = $.get('id');
        if ($.user._id != id.toString()) {
            return code.FORBIDDEN;
        }
        function invalid(name) {
            $.send(code.BAD_REQUEST, {
                invalid: {
                    [name]: 'invalid'
                }
            });
        }

        User.findOne({_id: id}, {hash: 1, code: 1}).exec($.wrap(function (user) {
            if (user) {
                if ($.has('old_password')) {
                    if (utils.hash($.param('old_password')) == user.hash) {
                        user.hash = utils.hash($.param('password'));
                        user.save($.success);
                    }
                    else {
                        invalid('old_password');
                    }
                }
                else if ($.has('code')) {
                    if (user.code && 6 === user.code.length && $.param('code') == user.code) {
                        user.code = null;
                        user.save($.success);
                    }
                    else {
                        invalid('code');
                    }
                }
                else {
                    $.sendStatus(code.BAD_REQUEST);
                }
            }
            else {
                $.sendStatus(code.NOT_FOUND);
            }
        }));
    }
};
