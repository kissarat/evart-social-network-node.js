"use strict";

var client = require('../client.json');
var mongoose = require('mongoose');
var rs = require('randomstring');
var utils = require('../utils');

global.schema.Agent = new mongoose.Schema({
    _id: utils.idType('Agent'),
    auth: {
        type: String,
        required: true,
        match: /^\w{40}$/,
        index: {
            unique: true
        },
        trim: true,
        "default": function () {
            return rs.generate(40);
        }
    },

    start: {
        type: Date,
        required: true,
        "default": Date.now,
        min: new Date('2016-01-01'),
        max: new Date('2020-01-01')
    },

    time: {
        type: Date,
        required: true,
        "default": Date.now,
        min: new Date('2016-01-01'),
        max: new Date('2020-01-01')
    },

    about: {
        os: {
            name: utils.StringType(32),
            version: Number,
            device: utils.StringType(32),
            vendor: utils.StringType(32)
        },
        name: utils.StringType(32),
        version: Number
    },

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

    ip: utils.StringType()
}, {
    versionKey: false
});

module.exports = {
    POST: function ($) {
        function update(agent) {
            if (!agent) {
                agent = new Agent({
                    about: $.body
                });
                if ($.req.auth) {
                    agent.auth = $.req.auth;
                }
            }

            agent.time = Date.now();
            agent.ip = $.req.headers.ip;
            agent.save($.wrap(function () {
                // if ((Math.random() > (1 - config.auth_generation))) {}
                if (!$.req.auth) {
                    $.setCookie('auth', agent.auth, true);
                }
                agent = extract(agent, $.req.headers);
                agent.config = client;
                agent.success = true;
                $.send(agent);
            }));
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
        var agent = $.agent;
        if (agent) {
            agent = extract(agent);
            if (agent.user) {
                $.send(agent);
            }
            else {
                $.send(code.UNAUTHORIZED, agent);
            }
        }
        else {
            $.sendStatus(code.NOT_FOUND, agent);
        }
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
            }))
        }))
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
    }
};

function extract(agent, headers) {
    var result = {
        _id: agent._id,
        ip: agent.ip,
        auth: agent.auth
    };
    if (agent.user) {
        result.user = {
            _id: agent.user._id,
            domain: agent.user.domain,
            type: agent.user.type,
            follow: agent.user.follow
        };
    }
    if (headers) {
        result.headers = headers;
    }
    return result;
}
