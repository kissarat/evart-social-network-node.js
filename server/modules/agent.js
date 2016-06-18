"use strict";

var client = require('../client.json');
var code = require('../../client/code.json');
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
        "default": Date.now
    },
    time: {
        type: Date,
        required: true,
        "default": Date.now
    },
    about: {
        os: {
            name: String,
            version: Number,
            device: String,
            vendor: String
        },
        name: String,
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
    }
});

module.exports = {
    POST: function ($) {
        function update (agent) {
            if (!agent) {
                agent = new Agent({
                    about: $.body
                });
                if ($.req.auth) {
                    agent.auth = $.req.auth;
                }
            }

            agent.time = Date.now();
            agent.save($.wrap(function () {
                // if ((Math.random() > (1 - config.auth_generation))) {}
                if (!$.req.auth) {
                    $.setCookie('auth', agent.auth, config.forever);
                }
                agent = extract(agent);
                agent.config = client;
                $.send(agent);
            }));
        };
        if ($.req.auth) {
            Agent.findOne({
                auth: $.req.auth
            }).populate('user').exec($.wrap(update));
        } else {
            update();
        }
    },
    GET: function ($) {
        return $.send(extract($.agent));
    }
};

function extract(agent) {
    var result;
    if ('function' === typeof agent.toObject) {
        agent = agent.toObject();
    }
    result = {
        _id: agent._id,
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
    return result;
};
