'use strict';

require('colors');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var http = require('http');
var fs = require('fs');
var schema = require('../app/schema.json');
var schema_validator = require('jsonschema');
var url_parse = require('url').parse;
var querystring_parse = require('querystring').parse;
var controllers_dir = fs.readdirSync('controllers');
var controllers = {};
controllers_dir.forEach(function (file) {
    var match = /^(\w+)\.js$/.exec(file);
    if (match) {
        controllers[match[1]] = require('./controllers/' + match[0]);
    }
});

var db;
var subscribers = {};
var server;
var start;

MongoClient.connect('mongodb://localhost:27017/socex', function (err, _db) {
    if (err) {
        console.error(err);
        process.exit();
    }
    db = _db;

    server = http.createServer(function(req, res) {
        try {
            service(req, res);
        }
        catch (ex) {
            if (ex.invalid) {
                res.writeHead(400);
                res.end(JSON.stringify(ex));
            }
            throw ex;
        }
    });

    server.listen(8080);
    start = new Date();
    var startMessage = 'Started:\t' + start;
    console.log(startMessage.bgBlue.black);
});


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
            if (name.indexOf('id') === name.length - 2) {
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

        wrap: function (call) {
            return function (err, result) {
                if (err) {
                    _.send(500, {
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
            data.target_id = target_id;
            if (data._id) {
                data.object_id = data._id;
                delete data._id;
            }
            if (!data.time) {
                data.time = Date.now();
            }
            var subscriber = subscribers[target_id];
            if (subscriber) {
                for (var cid in subscriber) {
                    subscriber[cid].send(data);
                }
            }
            insertOne('queue', data, Function());
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

        getUserAgent: function() {
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

        setCookie: function(name, value, age, path) {
            if (!path) {
                path = '/';
            }
            res.setHeader('set-cookie', name + '=' + value + '; path=' + path + '; expires='
            + new Date(Date.now() + age).toUTCString());
        },

        send: function() {
            var object;
            var code = 200;
            if (1 == arguments.length) {
                object = arguments[0];
            }
            else if (2 == arguments.length) {
                code = arguments[0];
                object = arguments[1];
            }
            res.writeHead(code, {
                'Content-Type': 'text/json',
                'Access-Control-Allow-Origin': '*'
            });

            function log() {
                var record = {
                    client_id: req.client_id,
                    user_id: $.user._id,
                    route: req.url.route.length > 1 ? req.url.route : req.url.route[0],
                    method: req.method,
                    code: code,
                    result: object.result,
                    time: Date.now()
                };
                for(var i in req.url.query) {
                    record.params = req.url.query;
                    break;
                }
                if ($.body) {
                    record.body = $.body;
                }
                db.collection('log').insertOne(record, Function());
            }

            res.end(JSON.stringify(object));
            if ('GET' != req.method || ('poll' == req.url.route[0] && code < 400)) {
                log();
            }
        }
    };

    function resolve_callback(cb) {
        return cb ? $.wrap(cb) : $.answer;
    }

    $.data.updateOne = function (entity, id, mods, cb) {
        db.collection(entity).updateOne({_id: id}, mods, resolve_callback(cb));
    };

    $.data.find = function (entity, match, cb) {
        var aggr = [
            {$sort: {time: -1}}
        ];
        if (match instanceof Array) {
            aggr = $.merge(match, aggr)
        }
        else {
            aggr.unshift({$match: match});
        }
        db.collection(entity).aggregate(aggr)
            .toArray(resolve_callback(cb));
    };

    $.data.insertOne = insertOne;

    req.cookies = querystring_parse(req.headers.cookie, /;\s+/);

    if (req.url.query.auth) {
        req.auth = req.url.query.auth;
        delete req.url.query.auth;
    }
    else if (req.cookies.auth) {
        req.auth = req.cookies.auth;
    }

    if (req.cookies.cid) {
        req.client_id = ObjectID(req.cookies.cid);
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

function process(_) {
    Object.defineProperty(_, 'id', {
        get: function () {
            return ObjectID(_.req.url.query.id);
        }
    });

    switch (_.req.url.route[0]) {
        case 'entity':
            var collectionName = _.req.url.route[1];
            switch (_.req.method) {
                case 'GET':
                    if (_.req.url.query.id) {
                        db.collection(collectionName).findOne(_.id, _.answer);
                    }
                    else {
                        db.collection(collectionName).find(_.req.url.query).toArray(_.answer);
                    }
                    break;
                case 'PUT':
                    receive.call(_.req, function (data) {
                        db.collection(collectionName).insertOne(data, _.answer);
                    });
                    break;
                case 'PATCH':
                    receive.call(_.req, function (data) {
                        db.collection(collectionName).updateOne({_id: _.id}, {$set: data}, _.answer);
                    });
                    break;
                case 'DELETE':
                    db.collection(collectionName).deleteOne({_id: _.id}, _.answer);
                    break;
                default:
                    _.res.writeHead(405);
                    _.res.end();
                    break;
            }
            return;
    }

    var action;
    if (_.req.url.route.length >= 1) {
        action = controllers[_.req.url.route[0]][_.req.url.route.length < 2 ? _.req.method : _.req.url.route[1]];
    }
    if (!action) {
        $.send(404, _.req.url);
    }
    else {
        if (_.req.client_id || 'poll' == _.req.url.route[0]) {
            exec(_, action);
        }
        else {
            var agent = _.getUserAgent();
            _.data.insertOne('client', agent, function(result) {
                //if (result.insertedCount > 0) {
                    _.req.client_id = agent._id;
                    _.setCookie('cid', agent._id, 1000 * 3600 * 24 * 365 * 10);
                    exec(_, action);
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

    if (_.user || /^.(fake|user.(login|signup))/.test(_.req.url.original)) {
        if (_.req.headers['content-type'] && _.req.headers['content-type'].indexOf('json') >= 0) {
            receive.call(_.req, function (data) {
                _.body = data;
                _.params = _.merge(_.params, data);
                //console.log(_.params);
                call_action();
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
        a.query = querystring_parse(a.query);
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

function receive(call) {
    var data = [];
    this.on('data', function (chunk) {
        data.push(chunk);
    });
    this.on('end', function () {
        data = data.join('');
        try {
            data = JSON.parse(data);
        }
        catch (ex) {
        }
        call(data);
    });
}
