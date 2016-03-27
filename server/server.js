'use strict';

require('colors');
var MongoClient = require('mongodb').MongoClient;
var god = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var http = require('http');
var ws = require('ws');
var fs = require('fs');
var config = require(__dirname + '/config.json');
var old_schema = require(__dirname + '/../app-old/schema.json');
var schema_validator = require('jsonschema');
var url_parse = require('url').parse;
var qs = require('querystring');
var code = require(__dirname + '/../../client/code.json')
var modules_dir = fs.readdirSync(__dirname + '/modules');
var modules = {};

global.schema = {};

modules_dir.forEach(function (file) {
    var match = /^(\w+)\.js$/.exec(file);
    if (match) {
        var module_name = match[1]
        modules[module_name] = false === config.modules[module_name]
            ? false
            : require(__dirname + '/modules/' + match[0]);
    }
});

Object.keys(schema).forEach(function (name) {
    console.log(name);
    global[name] = god.model(name, schema[name])
});

var db;
var o = god.createConnection(config.mongo);
var subscribers = {};
var server;
var start;

MongoClient.connect(config.mongo, function (err, _db) {
    if (err) {
        console.error(err);
        process.exit();
    }
    db = _db;

    server = http.createServer(function (req, res) {
        //try {
        var $ = new Context(req, _db);

        $.res = res;
        $.subscribers = subscribers;
        $.COOKIE_AGE_FOREVER = config.forever;

        $.authorize(function (user) {
            $.user = user;
            serve($);
        });
        //}
        //catch (ex) {
        //    if (ex.invalid) {
        //        res.writeHead(code.BAD_REQUEST);
        //        res.end(JSON.stringify(ex));
        //    }
        //    throw ex;
        //}
    });

    server.listen(config.port, config.host, function () {
        var socketServer = new ws.Server(config.socket);
        socketServer.on('connection', function (socket) {
            var $ = new Context(socket.upgradeReq, _db);
            $.socket = socket;
            $.authorize(function (user) {
                $.user = user;
                if (user) {
                    var uid = user._id.toString();
                    var cid = $.req.client_id;
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
                    });
                    subscriber[cid] = $;

                    socket.on('message', function (message) {
                        message = JSON.parse(message);
                        if (!message.target_id) {
                            return;
                        }
                        message.source_id = user._id;
                        $.notify(message.target_id, message);
                        console.log(message);
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

function Context(req, db) {
    this.config = config;
    this.db = db;
    this.o = o;
    this.model = o.model.bind(o);
    var raw_url = req.url.replace(/^\/api\//, '/');
    req.url = parse(raw_url);
    this.params = req.url.query;
    req.cookies = qs.parse(req.headers.cookie, /;\s+/);

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
        return function (err, result) {
            if (err) {
                this.send(code.INTERNAL_SERVER_ERROR, {
                    error: err
                });
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
                if (!/[0-9a-z]{24}/.test(value)) {
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
        return this._param(this.req.body, name);
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
        return schema_validator.validate(object, old_schema);
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
        this.res.setHeader('set-cookie', cookie);
    },

    send: function () {
        var object;
        var code = code.OK;
        if (1 == arguments.length) {
            object = arguments[0];
        }
        else if (2 == arguments.length) {
            code = arguments[0];
            object = arguments[1];
        }
        var data = JSON.stringify(object);
        if (this.socket) {
            this.socket.send(data);
            return;
        }

        if (!this.res.finished) {
            if (2 == arguments.length) {
                this.res.writeHead(code, {
                    'content-type': 'text/json'
                    //'Access-Control-Allow-Origin': '*'
                });
            }
            else {
                this.res.setHeader('content-type', 'text/json');
            }
            this.res.end(data);
        }

        if ('GET' != this.req.method) {
            var record = {
                client_id: this.req.client_id,
                route: this.req.url.route.length > 1 ? this.req.url.route : this.req.url.route[0],
                method: this.req.method,
                code: code,
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
        if (this.req.auth) {
            this.data.findOne('user', {auth: this.req.auth}, cb);
        }
        else {
            cb();
        }
    },

    get id() {
        return ObjectID(this.req.url.query.id);
    }
};

// -------------------------------------------------------------------------------

function serve($) {
    if ('' == $.req.url.route[0]) {
        return $.send({
            type: 'api',
            name: 'socex',
            version: 0.1,
            dir: Object.keys(modules)
        });
    }

    var action;
    if ($.req.url.route.length >= 1) {
        action = modules[$.req.url.route[0]];
        if (false === action) {
            return $.send(code.METHOD_NOT_ALLOWED, {
                error: 'Module disabled'
            });
        }
        else if (!action) {
            return $.send(code.NOT_FOUND, {
                error: 'Route not found'
            });
        }
        action = action[$.req.url.route.length < 2 ? $.req.method : $.req.url.route[1]];
        if (!(action && action instanceof Function)) {
            return $.send(code.NOT_FOUND, {
                error: 'Route not found'
            });
        }
    }
    if (!action) {
        $.send(code.NOT_FOUND, $.req.url);
    }
    else {
        if ($.req.client_id || 'poll' == $.req.url.route[0]) {
            exec($, action);
        }
        else {
            var agent = $.getUserAgent();
            $.data.insertOne('client', agent, function (result) {
                $.req.client_id = agent._id;
                $.setCookie('cid', agent._id, $.COOKIE_AGE_FOREVER);
                exec($, action);
            });
        }
    }
}

// -------------------------------------------------------------------------------

function exec(_, action) {
    function call_action() {
        try {
            var valid = _.validate(_.params);
            if (valid) {
                action(_);
            }
            else {
                _.send(code.BAD_REQUEST, {
                    invalid: valid
                });
            }
        }
        catch (ex) {
            if (ex.invalid) {
                _.send(code.BAD_REQUEST, ex);
            }
            else {
                throw ex;
            }
        }
    }

    if (_.user || /^.(agent|pong|fake|user.(agent|login|signup))/.test(_.req.url.original)) {
        if (_.req.headers['content-length']) {
            receive(_.req, function (data) {
                if (_.req.headers['content-type'].indexOf('json') > 0) {
                    try {
                        _.body = JSON.parse(data.toString('utf8'));
                        _.params = _.merge(_.params, _.body);
                    }
                    catch (ex) {
                        _.send(code.BAD_REQUEST, {
                            error: ex.getMessage()
                        })
                    }
                }
                else {
                    _.data = data;
                }
                call_action();
            });
        }
        else {
            call_action();
        }
    }
    else {
        _.send(code.UNAUTHORIZED, {
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
            if (/^\d+$/.test(a.query[i])) {
                a.query[i] = parseFloat(a.query[i]);
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
        if (cb) {
            return $.wrap(result => {
                if (result) {
                    cb(result)
                }
                else {
                    $.sendStatus(code.NOT_FOUND);
                }
            })
        }
        else {
            return $.answer;
        }
    }

    $.data = {
        updateOne: function (entity, id, mods, cb) {
            $.collection(entity).updateOne({_id: id}, mods, resolve_callback(cb));
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
                id = $('id');
            }
            if (id instanceof ObjectID) {
                id = {_id: id};
            }
            $.collection(entity).findOne(id, resolve_callback(cb));
        },

        insertOne: function (entity, mods, cb) {
            $.collection(entity).insertOne(mods, resolve_callback(cb));
        }
    };
}

function receive(readable, call) {
    var chunks = [];
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
        call(data);
    });
}
