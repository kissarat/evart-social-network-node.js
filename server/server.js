'use strict';

require('colors');
var god = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var http = require('http');
var ws = require('ws');
var fs = require('fs');
var url_parse = require('url').parse;
var qs = require('querystring');
var _ = require('underscore');
var twilio = require('twilio');

global.config = require('./config.json');
global.code = require('../client/code.json');
var code = require('./code');
var errors = require('./errors');

var modules_dir = fs.readdirSync(__dirname + '/modules');
var modules = {};

var socket_files = [config.file];

function cleanup_socket() {
    var filename = socket_files.pop();
    if (filename) {
        fs.access(filename, function (err) {
            if (!err) {
                fs.unlinkSync(filename);
            }
            cleanup_socket();
        })
    }
}

cleanup_socket();

global.schema = {};

modules_dir.forEach(function (file) {
    var match = /^(\w+)\.js$/.exec(file);
    if (match) {
        var module_name = match[1];
        modules[module_name] = false === config.modules[module_name]
            ? false
            : require(__dirname + '/modules/' + match[0]);
    }
});

Object.keys(schema).forEach(function (name) {
    var current = schema[name];
    current.plugin(require('mongoose-unique-validator'));
    global[name] = god.model(name, current);
});

var o = god.connect(config.mongo.uri, config.mongo.options);
var subscribers = {};
var server;
var start;

o.connection.on('error', function (err) {
    console.log(err);
});

o.connection.on('open', function () {
    server = http.createServer(function (req, res) {
        try {
            var $ = new Context(req);
            $.res = res;
            $.subscribers = subscribers;
            $.COOKIE_AGE_FOREVER = config.forever;

            if (0 === req.url.original.indexOf('/headers')) {
                $.send({
                    url: req.url,
                    method: req.method,
                    headers: req.headers
                });
            }
            else {
                $.authorize(() => serve($));
            }
        }
        catch (ex) {
            if (ex.invalid) {
                res.writeHead(code.BAD_REQUEST);
                res.end(JSON.stringify(ex));
            }
            throw ex;
        }
    });

    server.listen(config.file, function () {
        fs.chmodSync(config.file, parseInt('777', 8));
        var socketServer = new ws.Server(config.socket);
        socketServer.on('connection', function (socket) {
            // console.log('SOCKET_CONNECTION');
            var $ = new Context(socket.upgradeReq, o.connection);
            $.socket = socket;
            $.authorize(function (agent) {
                if (agent.user) {
                    var uid = agent.user._id.toString();
                    var cid = agent._id.toString();
                    var subscriber = subscribers[uid];
                    if (!subscriber) {
                        subscribers[uid] = subscriber = {};
                    }
                    else if (subscriber[cid]) {
                        var client = subscriber[cid];
                        client.socket.close();
                    }
                    socket.on('close', function () {
                        delete subscriber[cid];
                        if (_.isEmpty(subscriber)) {
                            delete subscribers[uid];
                        }
                    });
                    subscriber[cid] = $;
                    // console.log('AUTHORIZE_SOCKET', subscribers);
                    socket.on('message', function (message) {
                        message = JSON.parse(message);
                        console.log('SOCKET', message);
                        if (message.target_id) {
                            $.notifyOne(message.target_id, message);
                        }
                        else {
                            console.warn('NO_TARGET', message.target_id);
                        }
                    });
                }
                else {
                    socket.close();
                }
            });
        });
        call_modules_method('_boot', {
            server: server,
            socketServer: socketServer
        });
    });

    start = new Date();

    var startMessage = 'Started:\t' + start;
    console.log(startMessage.bgBlue.black);
});

function call_modules_method(name, $) {
    for (var i in modules) {
        var module = modules[i];
        if (module && name in module && module[name] instanceof Function) {
            module[name]($);
        }
    }
}

function Context(req) {
    this.config = config;
    this.o = o;
    this.isCache = req.url.indexOf('/api-cache') == 0;
    var raw_url = req.url.replace(/^\/api(\-cache)?\//, '/');
    // console.log('URL', raw_url);
    req.url = parse(raw_url);
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

    if (req.cookies.cid && /^[0-9a-z]{24}$/.test(req.cookies.cid)) {
        req.client_id = ObjectID(req.cookies.cid);
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

    var geo = req.headers.geo;
    if (geo) try {
        req.geo = JSON.parse(geo);
    }
    catch (ex) {
        this.invalid('geo');
    }

    this.req = req;

    database(this);

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
        throw {
            invalid: obj
        };
    },

    wrap: function (call) {
        var self = this;
        return function (err, result) {
            if (err) {
                if (err instanceof god.Error.ValidationError) {
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

    answer: function (err, result) {
        if (err) {
            this.send(code.INTERNAL_SERVER_ERROR, {
                error: err.message
            });
        }
        else {
            this.send(result);
        }
    },

    success: function (err, result) {
        if (err) {
            if (err instanceof god.Error.ValidationError) {
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

    notifyOne: function (target_id, data) {
        data.time = new Date().toISOString();
        if ('string' != typeof data) {
            data = JSON.stringify(data);
        }
        var sockets = this.getSockets(target_id);
        // console.log('NOTIFY_ONE', target_id, Object.keys(sockets), data);
        for (var agent_id in sockets) {
            var $ = sockets[agent_id];
            $.socket.send(data);
        }
    },

    getSubscribers: function () {
        return subscribers;
    },

    getSockets: function (user_id) {
        if (!user_id) {
            user_id = this.user._id;
        }
        return subscribers[user_id.toString()] || {};
    },

    notify: function (target_id, event) {
        var data = {};
        for (var key in event) {
            data[key] = event[key];
        }
        if (!(target_id instanceof ObjectID)) {
            target_id = ObjectID(target_id);
        }
        data.target_id = target_id;
        if (data._id) {
            data.object_id = data._id;
            delete data._id;
        }
        if (!data.time) {
            data.time = Date.now();
        }
        var subscriber = subscribers[target_id.toString()];
        var sendSubscribers = subscriber ? function () {
            for (var cid in subscriber) {
                var o = subscriber[cid];
                if (o.socket) {
                    o.socket.send(JSON.stringify(data));
                }
                else {
                    o.send(data);
                }
            }
        } : Function();
        if (Number.isFinite(data.end) && data.end < data.time) {
            sendSubscribers();
        }
        else {
            $.data.insertOne('queue', data, sendSubscribers);
        }
    },

    sendStatus: function (code, message, headers) {
        this.res.writeHead(code, message, headers);
        this.res.end();
    },

    _param: function (object, name) {
        if (name in object) {
            var value = object[name];
            if (name.length >= 2 && (name.indexOf('id') === name.length - 2)) {
                if (!/[\da-f]{24}/i.test(value)) {
                    this.invalid(name, 'ObjectID');
                }
                value = ObjectID(value);
            }
            return value;
        }
        this.invalid(name, 'required');
    },

    param: function (name) {
        return this._param(this.params, name);
    },

    get: function (name) {
        return this._param(this.req.url.query, name);
    },

    post: function (name) {
        return this._param(this.body, name);
    },

    has: function (name) {
        if (name in this.params) {
            var value = this.params[name];
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
            cookie += '; expires=' + new Date(Date.now() + age).toUTCString();
        }
        if (this.res.headersSent) {
            console.error(`Setting cookie when headers sent ${name}=${value}`);
        }
        else {
            this.res.setHeader('set-cookie', cookie);
        }
        console.log(cookie);
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

    send: function () {
        var object;
        var status = code.OK;
        if (1 == arguments.length) {
            object = arguments[0];
        }
        else if (2 == arguments.length) {
            status = arguments[0];
            object = arguments[1];
        }
        var data = JSON.stringify(object);
        if (this.socket) {
            this.socket.send(data);
            return;
        }

        if (this.res.finished) {
            console.error('Response already send', data);
        }
        else {
            if (2 == arguments.length) {
                this.res.writeHead(status, {
                    'content-type': 'text/json; charset=utf-8'
                    //'Access-Control-Allow-Origin': '*'
                });
            }
            else {
                this.res.setHeader('content-type', 'text/json; charset=utf-8');
            }
            // console.log('SEND_DATA');
            this.res.end(data);

            // if (this.agent) {
            //     this.agent.time = Date.now();
            //     this.agent.save();
            // }
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
            for (var i in this.req.url.query) {
                record.params = this.req.url.query;
                break;
            }
            if (this.body) {
                record.body = this.body;
            }
            this.db.collection('log').insertOne(record, Function());
        }
    },

    authorize: function (cb) {
        // var constructor_name = this.socket ? 'socket' : 'http';
        if (this.req.auth) {
            var self = this;
            Agent.findOne({auth: this.req.auth}).populate('user').exec(this.wrap(function (agent) {
                if (agent) {
                    self.agent = agent;
                    // console.log('AUTHORIZE', agent.auth, constructor_name);
                }
                cb(agent);
            }));
        }
        else {
            var agent = new Agent();
            agent.save(this.wrap(function (agent) {
                cb(agent);
            }));
        }
    },

    just: function (object, keys) {
        var result = {};
        for (var key in object) {
            if (keys.indexOf(key) >= 0) {
                result[key] = object[key];
            }
        }
        return result;
    },

    get id() {
        if (!('id' in this.req) && this.req.url.query.id) {
            try {
                this.req.id = ObjectID(this.req.url.query.id);
            }
            catch (ex) {
                this.req.id = null
            }
        }
        return this.req.id;
    },

    get user() {
        return this.agent ? this.agent.user : null;
    },

    get db() {
        // console.warn('MongoDB connection usage');
        return this.o.connection;
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
        if (this.has('sort')) {
            var sort = this.get('sort');
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

    select: function (array = [], allow) {
        if (this.has('select')) {
            var param = this.get('select').split('.').sort();
            var allowed_fields = [];
            if (allow) {
                allow.forEach(function (field) {
                    if (param.indexOf(field) >= 0) {
                        allowed_fields.push(field);
                    }
                });
            }
            array = array.concat(allowed_fields);
        }
        return _.uniq(array).join(' ');
    },

    model: function () {
        this.o.apply(this.o, arguments);
    }
};

// -------------------------------------------------------------------------------

function walk($, object, path) {
    var route = path.shift() || $.req.method;
    //var methods = ["OPTIONS", "GET", "HEAD", "POST", "PUT", "DELETE", "TRACE", "CONNECT"];
    if ('_' == route[0]) {
        return false;
    }
    else if (route in object) {
        object = object[route];
        switch (typeof object) {
            case 'object':
                if (!$.module) {
                    $.module = object;
                    if ('function' == typeof $.module._before) {
                        $.module._before($);
                    }
                }
                return walk($, object, path, route);
            case 'function':
                return exec($, object);
            default:
                return object;
        }
    }
    else if ('_' in object) {
        return object._($);
    }
    else {
        return false;
    }
}

function serve($) {
    if (!$.req.url.route[0]) {
        return $.send({
            api: 'socex',
            version: 0.4,
            dir: Object.keys(modules).filter(m => modules[m])
        });
    }

    var path = $.req.url.route.slice(0);
    var last = path[path.length - 1];
    if (last && /^[a-z0-9]{24}$/.test(last)) {
        $.req.url.query.id = last;
        path.pop();
    }
    var result = walk($, modules, path);

    switch (typeof result) {
        case 'object':
            if (result instanceof god.Query || result instanceof god.Aggregate) {
                if ('find' == result.op) {
                    var order = $.order;
                    if (order) {
                        result.sort(order);
                    }
                    result.skip($.skip);
                    result.limit($.limit);
                }
                result = result.exec();
            }
            if ('Promise' == result.constructor.name) {
                result
                    .then(function (r) {
                        if (r) {
                            $.send(r.toObject ? r.toObject() : r);
                        }
                        else if (arguments.length > 0 && undefined === r) {
                            // console.error('Undefined promise result');
                        }
                        else {
                            $.sendStatus(code.NOT_FOUND);
                        }
                    })

                    .catch(function (r) {
                        $.send(code.INTERNAL_SERVER_ERROR, {
                            error: {
                                class: r.constructor.name,
                                message: r.toString()
                            }
                        })
                    });
            }
            else if (null === result) {
                $.sendStatus(code.NOT_FOUND);
            }
            break;
        case 'boolean':
            if (false === result) {
                $.sendStatus(code.METHOD_NOT_ALLOWED);
            }
            break;
        case 'number':
            $.res.writeHead(result);
            break;
        case 'string':
            $.res.end(result);
            break;
        default:
            if (undefined !== result) {
                $.send(result);
            }
    }
}

// -------------------------------------------------------------------------------

function exec($, action) {
    function call_action() {
        if ($.req.headers['user-agent'] && $.req.headers['user-agent'].indexOf('PhantomJS') > 0) {
            console.log('\t' + $.req.method + ' ' + $.req.url.original);
            if ($.body) {
                console.log($.body);
            }
        }
        try {
            // var result = $.validate($.params);
            // if ('valid' in result ? result.valid : result) {
            return action($);
            // }
            // else {
            //     $.send(code.BAD_REQUEST, {
            //         invalid: result.errors
            //     });
            // }
        }
        catch (ex) {
            if (ex.invalid) {
                $.send(code.BAD_REQUEST, ex);
            }
            else if (ex instanceof errors.Response) {
                $.send(ex.code, ex.data);
            }
            else {
                throw ex;
            }
        }
    }

    var is_unauthoried_route = /^.(agent|user.(login|phone|code|personal|exists|avatar))/.test($.req.url.original);
    var must_upload_route = /^.(photo|file)/.test($.req.url.original);

    if ($.user || is_unauthoried_route || ('GET' == $.req.method && $.isCache)) {
        var size = $.req.headers['content-length'];
        if (size && size > 0 && !must_upload_route) {
            return receive($.req, function (data) {
                if ($.req.headers['content-type'].indexOf('x-www-form-urlencoded') > 0) {
                    try {
                        $.body = qs.parse(data.toString('utf8'));
                        $.params = $.merge($.params, $.body);
                    }
                    catch (ex) {
                        $.send(code.BAD_REQUEST, {
                            error: ex.getMessage()
                        })
                    }
                }
                else if ($.req.headers['content-type'].indexOf('json') > 0 || 'test' == $.req.url.route[0]) {
                    try {
                        data = data.toString('utf8');
                        $.body = JSON.parse(data);
                        $.params = $.merge($.params, $.body);
                        for (var key in $.params) {
                            var value = $.params[key];
                            if (value.replace && /[<>"']/.test(value)) {
                                $.params[key] = value
                                    .replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;')
                                    .replace(/"([^"]+)"/g, '«$1»')
                                    .replace(/"/g, '&quot;')
                                    .replace(/'/g, '’');
                            }
                        }
                    }
                    catch (ex) {
                        console.log(ex);
                        $.send(code.BAD_REQUEST, {
                            error: ex
                        })
                    }
                }
                else {
                    throw 'data received';
                    $.data = data;
                }
                return call_action();
            });
        }
        else {
            return call_action();
        }
    }
    else {
        $.send(code.UNAUTHORIZED, {
            error: {
                auth: 'required'
            }
        });
    }
}

// -------------------------------------------------------------------------------

function morozov(err, results) {
    console.log(results);
}

function parse(url) {
    var a = url_parse(url);
    a.original = url;
    if (a.query) {
        a.query = qs.parse(a.query);
        for (var i in a.query) {
            var value = a.query[i];
            if (!value) {
                delete a.query[i];
            }
            else if (24 != value.length && /^\d+$/.test(value)) {
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

function database($) {
    $.collection = function (name) {
        return $.db.collection(name);
    };

    function resolve_callback(cb) {
        if ('function' == typeof cb) {
            return $.wrap(result => {
                if (result) {
                    cb(result)
                }
                else {
                    $.sendStatus(code.NOT_FOUND);
                }
            })
        }
        // else if (cb) {
        //     throw cb.constructor.name;
        // }
        else {
            return $.answer;
        }
    }

    $.data = {
        updateOne: function (entity, id, mods, cb) {
            return $.collection(entity).updateOne({_id: id}, mods, resolve_callback(cb));
        },

        find: function (entity, match, cb) {
            var aggr = [
                {$sort: {time: -1}}
            ];
            if (match instanceof Array) {
                aggr = match.concat(aggr);
            }
            else {
                aggr.unshift({$match: match});
            }
            $.collection(entity).aggregate(aggr)
                .toArray(resolve_callback(cb));
        },

        deleteOne: function (entity, id, cb) {
            if (!id) {
                id = $('id');
            }
            $.collection(entity).deleteOne({_id: id}, resolve_callback(cb));
        },

        findOne: function (entity, id, cb) {
            if (!id) {
                id = $.param('id');
            }
            if (id instanceof ObjectID) {
                id = {_id: id};
            }
            return $.collection(entity).findOne(id, resolve_callback(cb));
        },

        insertOne: function (entity, mods, cb) {
            $.collection(entity).insertOne(mods, resolve_callback(cb));
        }
    };
}

function receive(readable, call) {
    var chunks = [];
    return new Promise(function (resolve, reject) {
        readable.on('data', function (chunk) {
            chunks.push(chunk);
        });
        readable.on('end', function () {
            var data;
            if (0 == chunks.length) {
                data = new Buffer();
            }
            else if (1 == chunks.length) {
                data = chunks[0];
            }
            else {
                data = Buffer.concat(chunks);
            }
            if (call) {
                resolve(call(data));
            }
            else {
                resolve(data)
            }
        });
        readable.on('error', reject)
    })
}
