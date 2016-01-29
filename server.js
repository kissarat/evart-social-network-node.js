var MongoClient = require('mongodb').MongoClient;
var http = require('http');
var url_parse = require('url').parse;
var querystring_parse = require('querystring').parse;
var controllers = {
    user: require('./user.js'),
    fake: require('./fake.js')
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
        call(JSON.parse(data.join('')));
    });
}


function Context(req, res) {
    this.req = req;
    this.res = res;
    this.db = db;
}

var server = http.createServer(function (req, res) {
    var url = parse(req.url);
    if ('OPTIONS' == req.method) {
        res.writeHead(200, {
            'Allow': 'GET, POST, PUT, PATCH, DELETE',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    if (url.query.auth) {
        req.auth = url.query.auth;
        delete url.query.auth;
    }
    //    res.send({
    //        method: req.method,
    //        headers: req.headers,
    //        url: url
    //    });
    //receive.call(req, function(data) {
    //    res.send({
    //        method: req.method,
    //        url: url,
    //        body: data
    //    });
    //});
    //return;

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

    if ('entity' == url.route[0]) {
        var collectionName = url.route[1];
        switch (req.method) {
            case 'GET':
                console.log(url.query);
                db.collection(collectionName).find(url.query).toArray(answer);
                break;
            case 'PUT':
                receive.call(req, function (data) {
                    data._id = Date.now();
                    db.collection(collectionName).insertOne(data, answer);
                });
                break;
            case 'PATCH':
                receive.call(req, function (data) {
                    db.collection(collectionName).updateOne(url.query, {$set: data}, answer);
                });
                break;
            case 'DELETE':
                db.collection(collectionName).deleteOne(url.query, answer);
                break;
            default:
                res.writeHead(405);
                res.end();
                break;
        }
    }
    else {
        req.url = url;
        var context = new Context(req, res);
        context.answer = answer;
        context.wrap = wrap;
        var action;
        if (url.route.length >= 2) {
            action = controllers[url.route[0]][url.route[1]];
        }
        if (!action) {
            res.send(404, url);
        }
        else {
            if (req.auth) {
                db.collection('user').find({auth: req.auth}, wrap(function (user) {
                    if (user) {
                        context.user = user;
                    }
                    exec(action, context);
                }));
            }
            else {
                exec(action, context);
            }
        }
    }
});

function exec(action, _) {
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

server.listen(8080);
