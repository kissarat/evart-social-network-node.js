'use strict';

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var http = require('http');
var fs = require('fs');
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


function receive_buffer(req, call) {
    var data = [];
    req.on('data', function (chunk) {
        data.push(chunk);
    });
    req.on('end', function () {
        data = Buffer.concat(data);
        call(data);
    });
}

function process(_) {
    Object.defineProperty(_, 'id', {
        get: function() {
            return ObjectID(_.req.url.query.id);
        }
    });

    switch (_.req.url.route[0]) {
        case 'poll':
            if (!user) {
                return _.res.send(401, {error: {auth: 'required'}});
            }
            var target_id = _.req.url.query.target_id || _.req.url.route[1];
            switch (_.req.method) {
                case 'GET':
                    var subscriber = subscribers[_.user._id];
                    if (subscriber && 'queue' == subscriber.type) {
                        delete subscribers[_.user._id];
                        _.res.send(subscriber);
                    }
                    else {
                        if (subscriber) {
                            subscriber.end();
                        }
                        subscribers[_.user._id] = _.res;
                        var close = function () {
                            delete subscribers[_.user._id];
                        };
                        _.req.on('close', close);
                        _.res.on('finish', close);
                    }
                    break;
                case 'POST':
                    receive.call(_.req, function (data) {
                        data.source_id = _.user._id;
                        send(target_id, data);
                        _.res.end();
                    });
                    break;
            }
            return;

        case 'entity':
            var collectionName = _.req.url.route[1];
            switch (_.req.method) {
                case 'GET':
                    if (id) {
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

    var _ = {
        req: req,
        res: res,

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
            var subscriber = subscribers[target_id];
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
                subscribers[target_id] = subscriber;
            }
        },

        db: db
    };

    var auth;
    if (req.url.query.auth) {
        req.auth = req.url.query.auth;
        delete req.url.query.auth;
    }
    else if (req.headers.authorization) {
        req.auth = req.headers.authorization;
    }
    else if (req.headers && req.headers.cookie && (auth = /auth=(\w+)/.exec(req.headers.cookie))) {
        req.auth = auth[1];
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
    if (_.user || /^.(fake|user.(login|signup))/.test(_.req.url.original)) {
        if (_.req.headers['content-type'] && _.req.headers['content-type'].indexOf('json') >= 0) {
            receive.call(_.req, function (data) {
                _.body = data;
                //try {
                action(_);
                //}
                //catch (ex) {
                //    _.res.send(500, {error: ex})
                //}
            });
        }
        else
        //try {
            action(_);
        //}
        //catch (ex) {
        //    _.res.send(500, {error: ex})
        //}
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
