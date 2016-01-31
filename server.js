"use strict";

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var http = require('http');
var fs = require('fs');
var url_parse = require('url').parse;
var querystring_parse = require('querystring').parse;
var controllers = {
    user: require('./user.js'),
    fake: require('./fake.js'),
    message: require('./message.js')
};


var db;

MongoClient.connect('mongodb://localhost:27017/socex', function (err, _db) {
    db = _db;
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


function Context(req, res) {
    this.req = req;
    this.res = res;
    this.db = db;
}


var server = http.createServer(function (req, res) {
    req.url = req.url.replace(/^\/api\//, '/');
    var url = parse(req.url);

    var auth;
    if (url.query.auth) {
        req.auth = url.query.auth;
        delete url.query.auth;
    }
    else if (req.headers.authorization) {
        req.auth = req.headers.authorization;
    }
    else if (req.headers && req.headers.cookie && (auth = /auth=(\w+)/.exec(req.headers.cookie))) {
        req.auth = auth[1];
    }
    //res.send({
    //    method: req.method,
    //    headers: req.headers,
    //    url: url
    //});
    //receive.call(req, function(data) {
    //    res.send({
    //        method: req.method,
    //        url: url,
    //        body: data
    //    });
    //});
    //return;

    function authorize(call) {
        db.collection('user').findOne({auth: req.auth}, wrap(call));
    }

    function answer(err, result) {
        if (err) {
            res.send(500, {
                error: err
            });
        }
        else {
            res.send(result);
        }
    }

    function wrap(call) {
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
    }

    var id;
    if (url.query.id) {
        id = ObjectID(url.query.id);
    }

    switch (url.route[0]) {
        case 'pool':
            authorize(function (user) {
                switch (req.method) {
                    case 'GET':
                        if (!(user._id in subscribers)) {
                            subscribers[user._id] = res;
                            req.on('close', function () {
                                delete subscribers[user._id];
                            });
                            res.on('finish', function () {
                                delete subscribers[user._id];
                            });
                        }
                        break;
                    case 'POST':
                        break;
                }
            });
            return;

        case 'entity':
            var collectionName = url.route[1];
            switch (req.method) {
                case 'GET':
                    if (id) {
                        db.collection(collectionName).findOne(id, answer);
                    }
                    else {
                        db.collection(collectionName).find(url.query).toArray(answer);
                    }
                    break;
                case 'PUT':
                    receive.call(req, function (data) {
                        db.collection(collectionName).insertOne(data, answer);
                    });
                    break;
                case 'PATCH':
                    receive.call(req, function (data) {
                        db.collection(collectionName).updateOne(id, {$set: data}, answer);
                    });
                    break;
                case 'DELETE':
                    db.collection(collectionName).deleteOne({_id: id}, answer);
                    break;
                default:
                    res.writeHead(405);
                    res.end();
                    break;
            }
            return;
    }

    req.url = url;
    var context = new Context(req, res);
    context.answer = answer;
    context.wrap = wrap;
    context.send = send;
    context.subscribers = subscribers;
    var action;
    if (url.route.length >= 1) {
        action = controllers[url.route[0]][url.route.length >= 2 ? url.route[1] : req.method];
    }
    if (!action) {
        res.send(404, url);
    }
    else {
        if (req.auth) {
            authorize(function (user) {
                if (user) {
                    context.user = user;
                    //user._id = ObjectID(user._id);
                }
                exec(context, action);
            });
        }
        else {
            exec(context, action);
        }
    }
});

function exec(_, action) {
    if (_.user || /^.(fake|user.(login|signup))/.test(_.req.url.original)) {
        if ('POST' == _.req.method) {
            receive.call(_.req, function (data) {
                _.body = data;
                action(_);
            });
        }
        else {
            action(_);
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

function send(target_id, data) {
    var subscriber = subscribers[target_id];
    if (subscriber) {
        subscriber.send(data);
    }
}

var subscribers = {};

var sources = {};

server.listen(8080);

console.log(new Date());
