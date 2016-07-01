"use strict";
var _ = require('underscore');
var ObjectID = require('mongodb').ObjectID;
var twilio = require('twilio');
var qs = require('querystring');
var web_extension = require('./web_extension');
var url_parse = require('url').parse;
var utils = require('../utils');
var errors = require('../errors');

function Context(options) {
    _.extend(this, options);
    var now = process.hrtime();
    var req = options.req;
    this.start = now[0] * 1000000000 + now[1];
    this.isCache = req.url.indexOf('/api-cache') == 0;
    var raw_url = req.url.replace(/^\/api(\-cache)?\//, '/');
    // console.log('URL', raw_url);
    req.url = this.parseURL(raw_url);
    this.params = req.url.query;
    // req.cookies = qs.parse(req.headers.cookie, /;\s+/);
    req.cookies = {};
    if ('string' == typeof req.headers.cookie) {
        req.headers.cookie.split(/;\s+/).forEach(function (item) {
            var parts = item.split('=');
            req.cookies[parts[0].trim()] = parts[1].trim();
        });
    }

    if (req.url.query.auth) {
        req.auth = req.url.query.auth;
        delete req.url.query.auth;
    }
    else if (req.cookies.auth) {
        req.auth = req.cookies.auth;
    }

    if (req.cookies.last) {
        var last = parseInt(req.cookies.last);
        if (!isNaN(last)) {
            req.last = new Date(last);
        }
    }

    var since = req.headers['if-modified-since'];
    if (since) {
        since = new Date(since);
        if (isNaN(since)) {
            this.invalid('if-modified-since');
        }
        else {
            req.since = since;
        }
    }

    var geo = req.headers.geo || this.param('geo', false);
    if (geo) {
        try {
            req.geo = JSON.parse(geo);
        }
        catch (ex) {
            this.invalid('geo');
        }
    }

    for (var i in this) {
        var f = this[i];
        if ('function' == typeof f) {
            this[i] = f.bind(this);
        }
    }
}

Context.prototype = {
    twilio: new twilio.RestClient(config.sms.sid, config.sms.token),

    sendSMS: function (phone, text, cb) {
        this.twilio.sms.messages.create({
            to: '+' + phone,
            from: '+' + config.sms.phone,
            body: text
        }, this.wrap(cb))
    },

    invalid: function invalid(name, value) {
        if (!value) {
            value = 'invalid';
        }
        var obj = {};
        obj[name] = value;
        throw new errors.BadRequest(obj);
    },

    wrap: function (call) {
        var self = this;
        return function (err, result) {
            if (err) {
                if (err instanceof mongoose.Error.ValidationError) {
                    self.send(code.BAD_REQUEST, {
                        invalid: err.errors
                    });
                }
                else {
                    self.send(code.INTERNAL_SERVER_ERROR, {
                        error: err
                    });
                }
            }
            else {
                call(result);
            }
        }
    },

    wrapArray: function (cb) {
        var self = this;
        return self.wrap(function (reader) {
            reader.toArray(self.wrap(cb))
        })
    },

    answer: function (err, result) {
        if (err) {
            this.send(code.INTERNAL_SERVER_ERROR, {
                error: err.message
            });
        }
        else {
            this.send(result);
            if (result.close instanceof Function) {
                result.close();
            }
        }
    },

    success: function (err, result) {
        if (err) {
            if (err instanceof mongoose.Error.ValidationError) {
                this.send(code.BAD_REQUEST, {
                    invalid: err.errors
                });
            }
            else {
                this.send(code.INTERNAL_SERVER_ERROR, {
                    error: err
                });
            }
        }
        else {
            this.send({success: !!result});
        }
    },
    
    notifyOne: function (user_id, message) {
        return this.server.webSocketServer.notifyOne(user_id, message);
    },

    getSubscribers: function (user_id) {
        return this.server.webSocketServer.getSubscribers(user_id);
    },

    sendStatus: function (code, message, headers) {
        this.res.writeHead(code, message, headers);
        this.res.end();
    },

    _param: function (object, name, defaultValue) {
        if (name in object) {
            var value = object[name];
            if (name.length >= 2 && (name.indexOf('id') === name.length - 2)) {
                if (!/[\da-f]{24}/i.test(value)) {
                    this.invalid(name, 'ObjectID');
                }
                value = ObjectID(value);
            }
            if (defaultValue instanceof Array && 'string' === typeof value) {
                value = value.split('.');
            }
            return value;
        }
        if (undefined !== defaultValue) {
            return defaultValue
        }
        this.invalid(name, 'required');
    },

    param: function (name, defaultValue) {
        return this._param(this.params, name, defaultValue);
    },

    get: function (name, defaultValue) {
        return this._param(this.req.url.query, name, defaultValue);
    },

    post: function (name) {
        return this._param(this.body, name);
    },

    has: function (name, isGet) {
        var params = isGet ? this.req.url.query : this.params;
        if (name in params) {
            var value = params[name];
            if (value instanceof Array) {
                return value.length > 0;
            }
            return true;
        }
        return false;
    },

    hasAny: function (array) {
        for (var i = 0; i < array.length; i++) {
            if (this.has(array[i])) {
                return true;
            }
        }
        return false;
    },

    paramsObject: function (array) {
        var params = {};
        for (var i = 0; i < array.length; i++) {
            var name = array[i];
            if (this.has(name)) {
                params[name] = this.param(name);
            }
        }
        if (params.id) {
            params._id = params.id;
            delete params.id
        }
        return params;
    },

    ids: function () {
        return $.param('ids').split('.').map(function (id) {
            return ObjectID(id)
        });
    },

    merge: function () {
        var o = {};
        for (var i = 0; i < arguments.length; i++) {
            var a = arguments[i];
            for (var j in a) {
                o[j] = a[j];
            }
        }
        return o;
    },

    validate: function (object) {
        return true; // schema_validator.validate(object, old_schema);
    },

    getUserAgent: function () {
        var agent = {
            ip: this.req.connection.remoteAddress
        };
        if (this.req.headers['user-agent']) {
            agent.agent = this.req.headers['user-agent'];
        }
        if (this.req.geo) {
            agent.geo = this.req.geo;
        }
        return agent;
    },

    setCookie: function (name, value, age, path) {
        var cookie = name + '=' + value;
        cookie += '; path=' + (path || '/');
        if (age) {
            if (true === age) {
                age = new Date();
                age.setYear(age.getYear() + 10);
            }
            if (age instanceof Date) {
                age = age.toUTCString();
            }
            if (!isNaN(age)) {
                age = new Date(Date.now() + age).toUTCString();
            }
            cookie += '; expires=' + age;
        }
        if (this.res.headersSent) {
            console.error(`Setting cookie when headers sent ${name}=${value}`);
        }
        else {
            this.res.setHeader('set-cookie', cookie);
        }
        // console.log(cookie);
    },

    allowFields: function (user_fields, admin_fields) {
        var data = {};
        for (var key in this.body) {
            if (('admin' == this.user.type && admin_fields.indexOf(key) >= 0) || user_fields.indexOf(key) >= 0) {
                data[key] = this.body[key];
            }
        }
        return data;
    },

    get spend() {
        var now = process.hrtime();
        now = now[0] * 1000000000 + now[1];
        return (now - this.start) / 1000000;
    },

    send: function () {
        var self = this;
        var object;
        var status = code.OK;
        if (1 == arguments.length) {
            object = arguments[0];
        }
        else if (2 == arguments.length) {
            status = arguments[0];
            object = arguments[1];
        }

        if (this.socket) {
            this.socket.send(JSON.stringify(object));
            return;
        }

        if (this.res.finished) {
            console.error('Response already send ', this.req.url.original, object);
        }
        else {
            if ('GET' != this.req.method && 'boolean' == typeof object.success) {
                if (!object.ip) {
                    object.ip = this.req.headers.ip;
                }
                object.spend = this.spend;
            }

            let data = JSON.stringify(object);
            let jsonp = config.client.jsonp.enabled && this.get('callback', false);
            let headers = jsonp
                ? {
                'content-type': 'application/javascript; charset=utf-8',
                'access-control-allow-origin': '*'
            }
                : {'content-type': 'application/json; charset=utf-8'};
            if (jsonp) {
                data = [jsonp, '(', data, ')'].join('');
            }
            if (code.OK !== status) {
                this.res.writeHead(status, headers);
            }
            else {
                _.each(headers, function (value, name) {
                    self.res.setHeader(name, value);
                });
            }
            this.res.end(data);
        }

        if ('GET' != this.req.method) {
            var record = {
                client_id: this.req.client_id,
                route: this.req.url.route.length > 1 ? this.req.url.route : this.req.url.route[0],
                method: this.req.method,
                code: status,
                time: Date.now()
            };
            if (object) {
                record.result = object.result;
            }
            if (this.user) {
                record.user_id = this.user._id;
            }
            if (!_.isEmpty(this.req.url.query)) {
                record.params = this.req.url.query;
            }
            if (!_.isEmpty(this.body)) {
                record.body = this.body;
            }
            this.collection('log').insert(record);
        }
    },

    authorize: function (cb) {
        var self = this;

        function agent_not_found() {
            self.send(code.UNAUTHORIZED, {
                success: false,
                ip: self.req.headers.ip,
                error: {
                    code: 'AGENT_NOT_FOUND',
                    message: 'User agent is not registered'
                }
            });
        }

        if (this.req.auth) {
            Agent.findOne({auth: this.req.auth}).populate('user').exec(this.wrap(function (agent) {
                if (agent) {
                    self.agent = agent;
                    cb.call(this, agent);
                }
                else {
                    agent_not_found();
                }
            }));
        }
        else {
            agent_not_found();
        }
    },

    get id() {
        if (!('id' in this.req) && this.req.url.query.id) {
            try {
                this.req.id = ObjectID(this.req.url.query.id);
            }
            catch (ex) {
                this.req.id = this.req.url.query.id;
            }
        }
        return this.req.id;
    },

    get user() {
        return this.agent ? this.agent.user : null;
    },

    get db() {
        return this.server.mongoose.connection;
    },

    get skip() {
        var value = 0;
        if (this.has('skip')) {
            value = this.get('skip');
            if (value < 0) {
                value = 0;
            }
        }
        return value;
    },

    get limit() {
        var value = 96;
        if (this.has('limit')) {
            value = this.get('limit');
            if (value > 100 || value <= 0) {
                value = 96;
            }
        }
        return value;
    },

    get order() {
        if (this.has('sort') && this.get('sort')) {
            var sort = this.get('sort').split('.');
            var _order = {};
            if (this.has('order')) {
                _order[sort] = 'a' == this.get('order')[0] ? 1 : -1;
            }
            else {
                sort.forEach(function (field) {
                    var direction = 1;
                    if ('-' == field[0]) {
                        field = field.slice(1);
                        direction = -1;
                    }
                    _order[field] = direction;
                })
            }
            return _order;
        }
        return false;
    },

    get search() {
        if (this.has('q')) {
            var q = this.get('q');
            q = q ? q.toString().trim().replace(/[\+\s]+/g, '.*').toLowerCase() : '';
            return q ? new RegExp(`.*${q}.*`, 'i') : false;
        }
        return false;
    },

    select: function (array, allow, objectify) {
        if (!array) {
            array = [];
        }
        if (this.has('select')) {
            let param = this.get('select').split('.').sort();
            if (allow) {
                let allowed_fields = [];
                allow.forEach(function (field) {
                    if (param.indexOf(field) >= 0) {
                        allowed_fields.push(field);
                    }
                });
                array = array.concat(allowed_fields);
            }
            else {
                array = array.concat(param);
            }
        }
        array.push('time');
        array = _.uniq(array);
        if (objectify) {
            let object = {};
            array.forEach(function (name) {
                object[name] = 1;
            });
            return object;
        }
        else {
            return array;
        }
    },

    model: function () {
        this.server.mongoose.apply(this.mongoose, arguments);
    },

    get bodySize() {
        var size = this.req.headers ? this.req.headers['content-length'] : 0;
        return size > 0 ? size : 0;
    },

    maxBody: function (maxLength) {
        if (this.bodySize > maxLength) {
            throw new errors.EntityTooLarge(maxLength);
        }
    },

    get isUpdate() {
        var m = this.req.method;
        return 'POST' == m || 'PUT' == m || 'PATCH' == m;
    },

    collection: function (name) {
        return this.db.collection(name);
    },

    parseURL: function (url) {
        var a = url_parse(url);
        a.original = url;
        if (a.query) {
            a.query = qs.parse(a.query);
            for (var i in a.query) {
                var value = a.query[i];
                if (!value) {
                    delete a.query[i];
                }
                else if (24 != value.length && /^\-?\d+$/.test(value)) {
                    a.query[i] = parseFloat(value);
                }
            }
        }
        else {
            a.query = {};
        }
        a.route = a.pathname.split('/').slice(1);
        return a;
    }
};

_.extend(Context.prototype, web_extension);

module.exports = {
    Context: Context
};
