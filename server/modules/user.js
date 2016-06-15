var rs = require('randomstring');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var utils = require('../utils');

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

    avatar: {
        type: T.ObjectId,
        ref: 'Photo'
    },

    background: {
        type: T.ObjectId,
        ref: 'Photo'
    },

    created: {
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
    login: function ($) {
        var conditions, login;
        if ($.user) {
            return $.sendStatus(code.FORBIDDEN, 'User is authorized');
        } else {
            conditions = {
                hash: utils.hash($.post('password'))
            };
            login = $.post('login').replace(/[\(\)\s]/, '');
            if (indexOf.call(login, '@') >= 0) {
                conditions.email = login;
            } else if (/^[\d\-]+$/.exec(login)) {
                login = login.replace('-', '');
            } else if (/^[0-9a-z]{24}$/i.exec(login)) {
                conditions._id = ObjectID(login);
            } else {
                conditions.domain = login;
            }
            User.findOne(conditions, $.wrap(function (user) {
                var changeset;
                if (user) {
                    conditions = {
                        auth: $.req.auth
                    };
                    changeset = {
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
        var change, conditions;
        conditions = {
            user: {
                $exists: true
            },
            auth: $.req.auth
        };
        change = {
            $unset: {
                user: ''
            }
        };
        return Agent.update(conditions, change);
    },

    info: function ($) {
        var conditions;
        conditions = {
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
        var status;
        status = $.param('status');
        status = status.trim().replace(/\s+/g, ' ');
        return User.update({
            _id: $.id
        }, {
            $set: {
                status: status
            }
        });
    },

    POST: function ($) {
        var data, user;
        data = $.allowFields(group_fields, admin_fields);
        data.type = 'group';
        user = new User(data);
        user.save($.wrap(function () {
            return $.send(code.CREATED, {
                success: true,
                _id: user._id,
                domain: user.domain,
                type: user.type
            });
        }));
    },

    PATCH: function ($) {
        var data;
        data = $.allowFields(user_fields, admin_fields);
        return User.findByIdAndUpdate($.id, {
            $set: data
        }, {
            "new": true
        });
    },

    GET: function ($) {
        var fields, list_name, params;
        params = ['id', 'domain'];
        fields = 'domain status type city country address phone avatar background name birthday languages relationship';
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
                list_name = $.param('list');
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

    exists: {
        GET: function ($) {
            var conditions, j, key, len, ref, value;
            key = null;
            value = null;
            conditions = {};
            ref = ['domain', 'phone', 'email'];
            for (j = 0, len = ref.length; j < len; j++) {
                key = ref[j];
                if ($.has(key)) {
                    value = $.get(key);
                    conditions[key] = value;
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
        var user;
        if ($.user) {
            return $.sendStatus(code.FORBIDDEN, 'User is authorized');
        }
        user = new User({
            phone: $.agent.phone,
            domain: $.param('domain'),
            email: $.param('email'),
            forename: $.param('surname'),
            surname: $.param('surname'),
            hash: utils.hash($.param('password'))
        });
        user.save($.success);
    },
    avatar: {
        GET: function ($) {
            User.findOne($.id, $.wrap(function (user) {
                if (user) {
                    return $.sendStatus(code.MOVED_TEMPORARILY, 'Avatar found', {
                        location: user.avatar ? "/photo/" + user.avatar + ".jpg" : "/images/avatar.png"
                    });
                } else {
                    return $.sendStatus(code.NOT_FOUND, 'User not found');
                }
            }));
        }
    },
    change: {
        POST: function ($) {
            var changes, field, fields;
            field = $.param('field');
            changes = {};
            fields = ['avatar', 'background'];
            if (indexOf.call(fields, field) >= 0) {
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
            var fields, id, name;
            name = $.param('name');
            if (!list_fields.hasOwnProperty(name)) {
                $.invalid('name');
            }
            fields = {};
            fields['friend' === name ? 'follow' : name] = 1;
            id = $.has('id') ? $.id : $.user._id;
            return User.findOne(id, fields, $.wrap(function (user) {
                if ('friend' === name) {
                    return search($, {
                        _id: {
                            $in: user.follow
                        }
                    });
                } else {
                    return search($, user[name]);
                }
            }));
        },
        POST: function ($) {
            var id, name, opposite, target_id;
            name = $.param('name');
            if (!list_fields.hasOwnProperty(name)) {
                $.invalid('name');
            }
            target_id = $.param('target_id');
            id = $.has('id') ? $.id : $.user._id;
            return opposite = list_fields[name];
        }
    }
};

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

schema.User.user_public_fields = ["name", "surname", "forename", "city", "country", "address", "phone", "avatar", "name", "birthday", "languages", "relationship"];
var user_fields = ["name", "surname", "forename", "city", "country", "address", "phone", "password", "avatar", "name", "birthday", "languages", "relationship"];
var group_fields = ["domain", "name", "about", "avatar"];
var admin_fields = ['domain', 'type'];

function search($, cnd, send) {
    var ORs, ands, d, fields, j, k, len, len1, name, param, q, r, ref, ref1;
    if (send == null) {
        send = false;
    }
    ORs = [];
    if ($.has('q')) {
        q = $.search;
        ref = ['domain', 'surname'];
        for (j = 0, len = ref.length; j < len; j++) {
            name = ref[j];
            d = {};
            d[name] = {
                $regex: q
            };
            ORs.push(d);
        }
    }
    ands = cnd && cnd.constructor === Array ? cnd : {};
    if (ORs.length > 0) {
        ands.$or = ORs;
    }
    ref1 = ['country', 'city', 'sex', 'forename', 'relationship', 'type'];
    for (k = 0, len1 = ref1.length; k < len1; k++) {
        param = ref1[k];
        if ($.has(param)) {
            ands[param] = $.param(param);
        }
    }
    fields = '_id type forename surname domain name type city address avatar sex';
    if (cnd && cnd.constructor === Array) {
        ands._id = {
            $in: cnd.map(function (id) {
                return ObjectID(id);
            })
        };
    }
    if ($.has('type')) {
        ands.type = $.get('type');
    }
    r = User.find(ands);
    r.select(fields);
    if (send) {
        return r.exec($.wrap(function (users) {
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
        domain: user.domain
    };
};
