'use strict';

require('colors');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var http = require('http');
var fs = require('fs');
var config = require(__dirname + '/config.json');
var schema = require(__dirname + '/../app/schema.json');
var schema_validator = require('jsonschema');
var url_parse = require('url').parse;
var qs = require('querystring');
var controllers_dir = fs.readdirSync(__dirname + '/controllers');
var controllers = {};

controllers_dir.forEach(function (file) {
    var match = /^(\w+)\.js$/.exec(file);
    if (match) {
        controllers[match[1]] = require(__dirname + '/controllers/' + match[0]);
    }
});

var db;
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
        service(req, res);
        //}
        //catch (ex) {
        //    if (ex.invalid) {
        //        res.writeHead(400);
        //        res.end(JSON.stringify(ex));
        //    }
        //    throw ex;
        //}
    });

    server.listen(config.port, config.host, function () {
        call_controllers_method('_boot', {
            server: server
        });
    });
    start = new Date();
    var startMessage = 'Started:\t' + start;
    console.log(startMessage.bgBlue.black);
});

function call_controllers_method(name, $) {
    for (var i in controllers) {
        var controller = controllers[i];
        if (name in controller && controller[name] instanceof Function) {
            controller[name]($);
        }
    }
}

function service(req, res) {
    var raw_url = req.url.replace(/^\/api\//, '/');
    req.url = parse(raw_url);

    function invalid(name, value) {
        if (!value) {
            value = 'invalid';
        }
        var obj = {};
        obj[name] = value;
        throw {
            invalid: obj
        };
    }

    function _get(object, name) {
        if (name in object) {
            var value = object[name];
            if (name.length >= 2 && (name.indexOf('id') === name.length - 2)) {
                if (!/[0-9a-z]{24}/.test(value)) {
                    invalid(name, 'ObjectID');
                }
                value = ObjectID(value);
            }
            return value;
        }
        invalid(name, 'required');
    }

    var $ = function (name) {
        return _get($.params, name);
    };

    function insertOne(entity, mods, cb) {
        db.collection(entity).insertOne(mods, resolve_callback(cb));
    }

    $.__proto__ = {
        req: req,
        res: res,
        subscribers: subscribers,
        COOKIE_AGE_FOREVER: 1000 * 3600 * 24 * 365 * 10,

        wrap: function (call) {
            return function (err, result) {
                if (err) {
                    $.send(500, {
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
                $.send(500, {
                    error: err.message
                });
            }
            else {
                $.send(result);
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
                    o.send(data);
                }
            } : Function();
            if (Number.isFinite(data.end) && data.end < data.time) {
                sendSubscribers();
            }
            else {
                insertOne('queue', data, sendSubscribers);
            }
        },

        sendStatus: function (code) {
            res.writeHead(code);
            res.end();
        },

        get: function (name) {
            return _get(req.url.query, name);
        },

        post: function (name) {
            return _get(req.body, name);
        },

        has: function (name) {
            if (name in $.params) {
                var value = $.params[name];
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
            return schema_validator.validate(object, schema);
        },

        invalid: invalid,
        db: db,
        params: req.url.query,

        data: function (name) {
            return db.collection(name);
        },

        getUserAgent: function () {
            var agent = {
                ip: req.connection.remoteAddress
            };
            if (req.headers['user-agent']) {
                agent.agent = req.headers['user-agent'];
            }
            if (req.geo) {
                agent.geo = req.geo;
            }
            return agent;
        },

        setCookie: function (name, value, age, path) {
            var cookie = name + '=' + value;
            cookie += '; path=' + (path || '/');
            if (age) {
                cookie += '; expires=' + new Date(Date.now() + age).toUTCString();
            }
            res.setHeader('set-cookie', cookie);
        },

        send: function () {
            var object;
            var code = 200;
            if (1 == arguments.length) {
                object = arguments[0];
            }
            else if (2 == arguments.length) {
                code = arguments[0];
                object = arguments[1];
            }

            if (!$.res.finished) {
                if (2 == arguments.length) {
                    res.writeHead(code, {
                        'content-type': 'text/json'
                        //'Access-Control-Allow-Origin': '*'
                    });
                }
                else {
                    res.setHeader('content-type', 'text/json');
                }
                res.end(JSON.stringify(object));
            }

            if ('GET' != req.method || ('poll' == req.url.route[0] && code < 400)) {
                var record = {
                    client_id: req.client_id,
                    route: req.url.route.length > 1 ? req.url.route : req.url.route[0],
                    method: req.method,
                    code: code,
                    result: object.result,
                    time: Date.now()
                };
                if ($.user) {
                    record.user_id = $.user._id;
                }
                for (var i in req.url.query) {
                    record.params = req.url.query;
                    break;
                }
                if ($.body) {
                    record.body = $.body;
                }
                db.collection('log').insertOne(record, Function());
            }
        }
    };

    function resolve_callback(cb) {
        if (cb) {
            return $.wrap(result => {
                if (result) {
                    cb(result)
                }
                else {
                    $.sendStatus(404);
                }
            })
        }
        else {
            return $.answer;
        }
    }

    $.data.updateOne = function (entity, id, mods, cb) {
        db.collection(entity).updateOne({_id: id}, mods, resolve_callback(cb));
    };

    $.data.find = function (entity, match, cb) {
        var aggr = [
            {$sort: {time: -1}}
        ];
        if (match instanceof Array) {
            aggr = match.concat(aggr);
        }
        else {
            aggr.unshift({$match: match});
        }
        db.collection(entity).aggregate(aggr)
            .toArray(resolve_callback(cb));
    };

    $.data.findOne = function (entity, id, cb) {
        if (!id) {
            id = $('id');
        }
        if (id instanceof ObjectID) {
            id = {_id: id};
        }
        cb = resolve_callback(cb);
        db.collection(entity).findOne(id, cb);
    };

    $.data.deleteOne = function (entity, id, cb) {
        if (!id) {
            id = $('id');
        }
        cb = resolve_callback(cb);
        db.collection(entity).deleteOne({_id: id}, cb);
    };

    $.data.insertOne = insertOne;

    req.cookies = qs.parse(req.headers.cookie, /;\s+/);
    //console.log(req.cookies);

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
            invalid('if-modified-since');
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
        invalid('geo');
    }

    if (req.auth) {
        db.collection('user').findOne({auth: req.auth}, $.wrap(function (user) {
            $.user = user;
            process($);
        }));
    }
    else {
        process($);
    }
}

// -------------------------------------------------------------------------------

function process($) {
    Object.defineProperty($, 'id', {
        get: function () {
            return ObjectID($.req.url.query.id);
        }
    });

    if ('' == $.req.url.route[0]) {
        return $.send({
            type: 'api',
            name: 'socex',
            version: 0.1,
            dir: Object.keys(controllers)
        });
    }

    switch ($.req.url.route[0]) {
        case 'entity':
            var collectionName = $.req.url.route[1];
            switch ($.req.method) {
                case 'GET':
                    if ($.req.url.query.id) {
                        db.collection(collectionName).findOne($.id, $.answer);
                    }
                    else {
                        db.collection(collectionName).find($.req.url.query).toArray($.answer);
                    }
                    break;
                case 'PUT':
                    throw {};
                    //receive.call($.req, function (data) {
                    //    db.collection(collectionName).insertOne(data, $.answer);
                    //});
                    break;
                case 'PATCH':
                    throw {};
                    //receive.call($.req, function (data) {
                    //    db.collection(collectionName).updateOne({_id: $.id}, {$set: data}, $.answer);
                    //});
                    break;
                case 'DELETE':
                    db.collection(collectionName).deleteOne({_id: $.id}, $.answer);
                    break;
                default:
                    $.res.writeHead(405);
                    $.res.end();
                    break;
            }
            return;
    }

    var action;
    if ($.req.url.route.length >= 1) {
        action = controllers[$.req.url.route[0]];
        if (!action) {
            return $.send(404, {
                error: 'Route not found'
            });
        }
        action = action[$.req.url.route.length < 2 ? $.req.method : $.req.url.route[1]];
        if (!(action && action instanceof Function)) {
            return $.send(404, {
                error: 'Route not found'
            });
        }
    }
    if (!action) {
        $.send(404, $.req.url);
    }
    else {
        if ($.req.client_id || 'poll' == $.req.url.route[0]) {
            exec($, action);
        }
        else {
            var agent = $.getUserAgent();
            $.data.insertOne('client', agent, function (result) {
                //if (result.insertedCount > 0) {
                $.req.client_id = agent._id;
                $.setCookie('cid', agent._id, $.COOKIE_AGE_FOREVER);
                exec($, action);
                //}
            });
        }
    }
}

// -------------------------------------------------------------------------------

function exec(_, action) {
    function call_action() {
        try {
            var valid = _.validate(_.req.params);
            if (valid) {
                action(_);
            }
            else {
                _.send(400, {
                    invalid: valid
                });
            }
        }
        catch (ex) {
            if (ex.invalid) {
                _.send(400, ex);
            }
            else {
                throw ex;
            }
        }
    }

    if (_.user || /^.(pong|fake|user.(login|signup))/.test(_.req.url.original)) {
        if (_.req.headers['content-length']) {
            receive(_.req, function (data) {
                if (_.req.headers['content-type'].indexOf('json') > 0) {
                    try {
                        _.body = JSON.parse(data.toString(''));
                        _.params = _.merge(_.params, _.body);
                        call_action();
                    }
                    catch (ex) {
                        _.send(400, {
                            error: 'Invalid JSON format'
                        })
                    }
                }
                else {
                    _.data = data;
                    call_action();
                }
            });
        }
        else {
            call_action();
        }
    }
    else {
        _.send(401, {
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
