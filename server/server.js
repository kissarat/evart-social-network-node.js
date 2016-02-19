'use strict';

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

MongoClient.connect('mongodb://localhost:27017/socex', function (err, _db) {
    db = _db;
    server.listen(8080);
});

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

http.ServerResponse.prototype.send = function () {
    var object;
    var code = 200;
    if (1 == arguments.length) {
        object = arguments[0];
    }
    else if (2 == arguments.length) {
        code = arguments[0];
        object = arguments[1];
    }
    this.writeHead(code, {
        'Content-Type': 'text/json',
        'Access-Control-Allow-Origin': '*'
    });
    this.end(JSON.stringify(object));
};

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
        if (_.req.url.route.length < 2) {
            _.req.url.route[1] = _.req.method;
        }
        action = controllers[_.req.url.route[0]][_.req.url.route[1]];
    }
    if (!action) {
        _.res.send(404, _.req.url);
    }
    else {
        exec(_, action);
    }
}

// -------------------------------------------------------------------------------

var server = http.createServer(function (req, res) {
    var raw_url = req.url.replace(/^\/api\//, '/');
    req.url = parse(raw_url);

    function invalid(name, value) {
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

    var _ = function(name) {
        return _get(_.params, name);
    };

    _.__proto__ = {
        req: req,
        res: res,
        subscribers: subscribers,

        wrap: function (call) {
            return function (err, result) {
                if (err) {
                    res.send(500, {
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
                res.send(500, {
                    error: err.message
                });
            }
            else {
                res.send(result);
            }
        },

        send: function (target_id, data) {
            var cid = _.req.client_id;
            var subscriber = subscribers[target_id];
            if (subscriber) {
                subscriber = subscriber[cid];
            }
            if (subscriber) {
                if ('queue' == subscriber.type) {
                    subscriber.queue.push(data);
                }
                else {
                    subscriber.send(data);
                }
            }
            else {
                subscriber = {
                    type: 'queue',
                    queue: [data]
                };
                if (!subscriber[target_id]) {
                    subscriber[target_id] = {};
                }
                subscribers[target_id][cid] = subscriber;
            }
        },

        sendStatus: function (code) {
            res.writeHead(code);
            res.end();
        },

        get: function(name) {
            return _get(req.url.query, name);
        },

        post: function(name) {
            return _get(req.body, name);
        },

        has: function (name) {
            return name in req.params;
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

        validate: function(object) {
            return schema_validator.validate(object, schema);
        },

        invalid: invalid,
        db: db,
        params: req.url.query,

        data: function(name) {
            return db.collection(name);
        }
    };

    function resolve_callback(cb) {
        return cb ? _.wrap(cb) : _.answer;
    }

    _.data.updateOne = function(entity, id, mods, cb) {
        db.collection(entity).updateOne({_id: id}, mods, resolve_callback(cb));
    };

    _.data.find = function(entity, match, cb) {
        db.collection(entity).aggregate(
            {$match: match},
            {$sort: {time: 1}}
        )
            .toArray(resolve_callback(cb));
    };

    req.cookies = querystring_parse(req.headers.cookie, /;\s+/);

    if (req.url.query.auth) {
        req.auth = req.url.query.auth;
        delete req.url.query.auth;
    }
    else if (req.cookies.auth) {
        req.auth = req.cookies.auth;
    }

    if (req.cookies.cid) {
        req.client_id = req.cookies.cid;
    }

    if (req.auth) {
        db.collection('user').findOne({auth: req.auth}, _.wrap(function (user) {
            _.user = user;
            process(_);
        }));
    }
    else {
        process(_);
    }
});

function exec(_, action) {
    function call_action() {
        try {
            var valid = _.validate(_.req.params);
            if (valid) {
                action(_);
            }
            else {
                _.res.send(400, {
                    invalid: valid
                });
            }
        }
        catch (ex) {
            if (ex.invalid) {
                _.res.send(400, ex);
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
        _.res.send(401, {
            error: {
                auth: 'required'
            }
        });
    }
}

var subscribers = {};

console.log(new Date());
