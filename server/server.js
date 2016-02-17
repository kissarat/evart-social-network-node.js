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

    function authorize(call) {
        db.collection('user').findOne({auth: req.auth}, wrap(call));
    }

    function answer(err, result) {
        if (err) {
            res.send(500, {
                error: err.message
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

    req.url = url;

    function create_context() {
        var context = new Context(req, res);
        context.answer = answer;
        context.wrap = wrap;
        context.send = send;
        context.subscribers = subscribers;
        return context;
    }

    var context;

    switch (url.route[0]) {
        case 'photo':
            if ('POST' == req.method) {
                return controllers.photo.POST(create_context());
            }
            break;
        case 'video':
            if ('POST' == req.method) {
                return controllers.video.upload(create_context());
            }
            break;

        case 'poll':
            authorize(function (user) {
                if (!user) {
                    return res.send(401, {error: {auth: 'required'}});
                }
                var target_id = url.query.target_id || url.route[1];
                switch (req.method) {
                    case 'GET':
                        var subscriber = subscribers[user._id];
                        if (subscriber && 'queue' == subscriber.type) {
                            delete subscribers[user._id];
                            res.send(subscriber);
                        }
                        else {
                            if (subscriber) {
                                subscriber.end();
                            }
                            subscribers[user._id] = res;
                            var close = function () {
                                delete subscribers[user._id];
                            };
                            req.on('close', close);
                            res.on('finish', close);
                        }
                        break;
                    case 'POST':
                        receive.call(req, function (data) {
                            data.source_id = user._id;
                            send(target_id, data);
                            res.end();
                        });
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
                        db.collection(collectionName).updateOne({_id: id}, {$set: data}, answer);
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

    context = create_context();

    var action;
    if (url.route.length >= 1) {
        if (url.route.length < 2) {
            url.route[1] = req.method;
        }
        action = controllers[url.route[0]][url.route[1]];
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
        if ('PUT' == _.req.method || 'POST' == _.req.method) {
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

function send(target_id, data) {
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
}

var subscribers = {};

console.log(new Date());
