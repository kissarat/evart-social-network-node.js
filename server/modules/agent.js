'use strict';

const client = require('../client.json');
const mongoose = require('mongoose');
const randomstring = require('randomstring');
const utils = require('../utils');
const _ = require('underscore');

global.schema.Agent = new mongoose.Schema({
    _id: utils.idType('Agent'),
    auth: {
        type: String,
        required: true,
        match: /^\w{40}$/,
        // minlength: 10,
        // maxlength: 90,
        index: {
            unique: true
        },
        trim: true,
        'default': function () {
            return randomstring.generate({
                length: 40,
                charset: 'alphanumeric'
            });
        }
    },

    start: CreationDateType,
    time: CreationDateType,

    code: {
        type: String,
        match: /^\d{6}$/,
        trim: true
    },

    phone: {
        type: String,
        trim: true,
        match: /^\d{9,15}$/
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    os: {
        name: utils.StringType(32, 3),
        device: utils.StringType(64, 3),
        version: utils.StringType(16, 1)
    },

    client: {
        name: utils.StringType(32, 3),
        version: utils.StringType(16, 1)
    },

    ip: {
        type: String,
        match: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    }
}, {
    collection: 'agent',
    versionKey: false
});

schema.Agent.statics.extract = function extract(agent, headers) {
    var result = {
        success: true,
        _id: agent._id,
        ip: agent.ip,
        auth: agent.auth
    };
    if (agent.user) {
        result.user = {
            _id: agent.user._id,
            domain: agent.user.domain,
            type: agent.user.type,
            follow: agent.user.follow,
            admin: agent.user.admin,
            lang: agent.user.lang,
            css: agent.user.css
        };
        if (agent.user.css) {
            result.user.css = agent.user.css;
        }
    }
    if (headers) {
        result.headers = headers;
    }
    return result;
};

module.exports = {
    POST: function ($) {
        function update(agent) {
            if (!agent) {
                agent = new Agent();
                if ($.req.auth) {
                    agent.auth = $.req.auth;
                }
            }

            if ($.body.agent instanceof Object) {
                agent.client = $.body.agent.client;
                agent.os = $.body.agent.os;
                agent.ip = $.req.headers.ip;
                agent.save($.wrap(function () {
                    if (!$.req.auth) {
                        $.setCookie('auth', agent.auth, true);
                        $.setCookie('cid', agent._id, true);
                    }
                    agent = Agent.extract(agent, $.req.headers);
                    agent.config = client;
                    agent.success = true;
                    $.send(agent);
                }));
            }
            else {
                $.invalid('agent');
            }
        }

        if ($.req.auth) {
            Agent.findOne({
                auth: $.req.auth
            }).populate('user').exec($.wrap(update));
        } else {
            update();
        }
    },

    GET: function ($) {
        Agent.find({auth: $.req.auth}).populate('user').exec(function (err, agent) {
            if (err) {
                $.send(code.INTERNAL_SERVER_ERROR, err);
            }
            else if (agent) {
                $.send(Agent.extract(agent));
            }
            else {
                $.sendStatus(code.NOT_FOUND, agent);
            }
        });
    },

    DELETE: function ($) {
        var agent = $.agent;
        if (agent) {
            agent.remove($.answer);
        }
        else {
            $.sendStatus(code.NOT_FOUND, agent);
        }
    },

    online: function ($) {
        let till = $.param('till');
        till = +till;
        if (isNaN(till)) {
            $.invalid('online', 'Is not number');
        }
        var now = Date.now();
        if (till <= 0) {
            till = now - till;
        }

        $.agent.time = now;
        $.agent.ip = $.req.headers.ip;
        $.agent.save($.wrap(function () {
            $.user.online = till;
            $.user.save($.wrap(function () {
                $.send({
                    success: true,
                    time: now,
                    till: till,
                    ip: $.agent.ip
                });
            }));
        }));
    },

    stat: function ($) {
        var data = $.body;
        data.agent = $.agent._id;
        data.ip = $.req.headers.ip;
        data._id = utils.id12('Stat');
        if ($.user) {
            data.user = $.user._id;
        }
        $.collection('stat').insert(data, $.wrap(function (r) {
            var response = {
                success: r.result.n > 0,
                time: data._id.time
            };
            if (response.success) {
                response._id = data._id;
            }
            $.send(code.CREATED, response);
        }));
    },

    teapot: function ($) {
        $.sendStatus(418);
    },

    trace: function ($) {
        var status = $.has('status') ? +$.param('status') : code.OK;
        var data = {
            method: $.req.method,
            url: $.req.url.original,
            headers: $.req.headers
        };
        if ($.body) {
            data.data = $.body;
        }
        $.send(status, data);
    },

    sockets: {
        GET: function ($) {
            if ($.isAdmin) {
                const sockets = $.server.webSocketServer.getList();
                $.send({
                    users: _.size(sockets),
                    count: _.size($.server.webSocketServer.subscribers),
                    sockets: sockets
                });
            }
            else {
                return code.FORBIDDEN;
            }
        },

        close: function ($) {
            if ($.isAdmin) {
                var sockets = 0;
                var users = [];
                _.each($.server.webSocketServer.subscribers, function (subscriber, user_id) {
                    sockets += _.size(subscriber);
                    users.push(_.find(subscriber).user.domain);
                    $.server.webSocketServer.unsubscribe(user_id);
                });
                $.send({
                    sockets: sockets,
                    users: users
                });
            }
            else {
                return code.FORBIDDEN;
            }
        }
    },

    clear: function ($) {
        if ($.isAdmin) {
            return Agent.remove({});
        }
        else {
            return code.FORBIDDEN;
        }
    },

    clients: function ($) {
        if ($.isAdmin) {
            return {
                query: [
                    {
                        $match: {
                            user: {
                                $exists: true
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'user',
                            localField: 'user',
                            foreignField: '_id',
                            as: 'user'
                        }
                    },
                    {
                        $unwind: {
                            path: '$user'
                        }
                    },
                    {
                        $project: {
                            time: 1,
                            start: 1,
                            ip: 1,
                            user: {
                                domain: 1,
                                forename: 1,
                                surname: 1
                            }
                        }
                    },
                    {
                        $sort: {
                            time: -1
                        }
                    }
                ]
            };
        }
        else {
            return code.FORBIDDEN;
        }
    }
};
