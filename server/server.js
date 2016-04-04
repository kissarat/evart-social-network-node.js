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
var code = require(__dirname + '/../client/code.json')
var modules_dir = fs.readdirSync(__dirname + '/modules');
var modules = {};

/*
var mongo_errors = {
    BAD_VALUE: 2,
    UNKNOWN_ERROR: 8,
    NAMESPACE_NOT_FOUND: 26,
    EXCEEDED_TIME_LIMIT: 50,
    COMMAND_NOT_FOUND: 59,
    WRITE_CONCERN_ERROR: 64,
    NOT_MASTER: 10107,
    DUPLICATE_KEY: 11000,
    DUPLICATE_KEY_UPDATE: 11001, // legacy before 2.6
    DUPLICATE_KEY_CAPPED: 12582, // legacy before 2.6
    UNRECOGNIZED_COMMAND: 13390, // mongos error before 2.4
    NOT_MASTER_NO_SLAVE_OK: 13435,
    NOT_MASTER_OR_SECONDARY: 13436,
    CANT_OPEN_DB_IN_READ_LOCK: 15927
};
*/


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
    var current = schema[name];
    current.plugin(require('mongoose-unique-validator'));
    global[name] = god.model(name, current);
});

var o = god.connect(config.mongo);
var subscribers = {};
var server;
var start;

o.connection.on('error', function (err) {
    console.log(err);
});

o.connection.on('open', function () {
    server = http.createServer(function (req, res) {
        //try {
        var $ = new Context(req);

        $.res = res;
        $.subscribers = subscribers;
        $.COOKIE_AGE_FOREVER = config.forever;

        $.authorize(() => serve($));
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

function Context(req) {
    this.config = config;
    this.o = o;
    var raw_url = req.url.replace(/^\/api\//, '/');
    console.log(raw_url);
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
        var self = this;
        return function (err, result) {
            if (err) {
                if (err instanceof god.Error.ValidationError) {
                    self.send(code.BAD_REQUEST, {
                        invalid: err.errors
                    });
                }
                //else if (err.code && err.errmsg) {
                //    switch (err.code) {
                //        case mongo_errors.DUPLICATE_KEY:
                //            var errors = {};
                //            var field = / (\w+)_1/.exec(err.errmsg);
                //            errors[field[1]] = 'Duplicate value';
                //            self.send(code.BAD_REQUEST, {
                //                invalid: errors
                //            });
                //            break;
                //        default:
                //            self.send(code.INTERNAL_SERVER_ERROR, {
                //                error: err
                //            });
                //            break;
                //    }
                //}
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

        if (!this.res.finished) {
            if (2 == arguments.length) {
                this.res.writeHead(status, {
                    'content-type': 'text/json'
                    //'Access-Control-Allow-Origin': '*'
                });
            }
            else {
                this.res.setHeader('content-type', 'text/json');
            }
            this.res.end(data);

            if (this.agent) {
                this.agent.time = Date.now();
                this.agent.save();
            }
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
        if (this.req.auth) {
            var self = this;
            Agent.findOne({auth: this.req.auth}).populate('user').exec(this.wrap(function(agent) {
                if (agent) {
                    self.agent = agent;
                }
                cb(agent);
            }));
        }
        else {
            cb();
        }
    },

    get id() {
        return ObjectID(this.req.url.query.id);
    },

    get user() {
        return this.agent ? this.agent.user : null;
    },

    get db() {
        console.warn('MongoDB connection usage');
        return this.o.connection;
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
        object = object[route]
        switch (typeof object) {
            case 'object':
                return walk($, object, path);
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
            type: 'api',
            name: 'socex',
            version: 0.2,
            dir: Object.keys(modules)
        });
    }

    var result = walk($, modules, $.req.url.route.slice(0));

    switch (typeof result) {
        case 'object':
            if (result instanceof god.Query) {
                result = result.exec();
            }
            if (result instanceof Promise) {
                result
                    .then(function (r) {
                        $.send(r.toObject ? r.toObject() : r);
                    })
                    .catch(function (r) {
                        $.send(code.INTERNAL_SERVER_ERROR, r)
                    });
            }
            else if (null === result) {
                $.sendStatus(code.NOT_FOUND);
            }
            else {
                //$.send(result);
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
            var valid = $.validate($.params);
            if (valid) {
                return action($);
            }
            else {
                $.send(code.BAD_REQUEST, {
                    invalid: valid
                });
            }
        }
        catch (ex) {
            if (ex.invalid) {
                $.send(code.BAD_REQUEST, ex);
            }
            else {
                throw ex;
            }
        }
    }

    var is_unauthoried_route = /^.(agent|test|pong|fake|login|user)/.test($.req.url.original);
    var must_upload_route = /^.(photo)/.test($.req.url.original);

    if ($.user || is_unauthoried_route) {
        if ($.req.headers['content-length'] && !must_upload_route) {
            receive($.req, function (data) {
                if ($.req.headers['content-type'].indexOf('json') > 0) {
                    try {
                        $.body = JSON.parse(data.toString('utf8'));
                        $.params = $.merge($.params, $.body);
                    }
                    catch (ex) {
                        $.send(code.BAD_REQUEST, {
                            error: ex.getMessage()
                        })
                    }
                }
                else {
                    throw 'data received';
                    $.data = data;
                }
                call_action();
            });
        }
        else {
            call_action();
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
