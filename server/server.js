'use strict';

require('colors');
var _ = require('underscore');
var fs = require('fs');
var http = require('http');
var mongoose = require('mongoose');
var qs = require('querystring');

global.config = require('./config.json');
global.config.client = require('./client.json');
global.code = require('../client/code.json');
global.constants = require('../client/js/data.js');
var web = require('./web');
var socket = require('./socket');
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
    global[name] = mongoose.model(name, current);
});

var server;
var start;

function Server() {
    this.mongoose = mongoose.connect(config.mongo.uri, 'freebsd' == process.platform ? {} : config.mongo.options);
    this.subscribe('mongoose', this.mongoose);
    this.subscribers = {};
}

Server.prototype = {
    subscribe: utils.subscribe,
    
    onMongooseError: function (err) {
        console.log(err);
    },

    onMongooseOpen: function () {
        this.httpServer = http.createServer(function (req, res) {
            try {
                var $ = new web.Context({
                    server: this,
                    req: req,
                    res: res
                });
                if ('/agent' === req.url.original) {
                    serve($)
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
        
        this.subscribe('http', this.httpServer);
        this.httpServer.listen(config.file);
    },

    onHttpListening: function () {
        fs.chmodSync(config.file, parseInt('777', 8));
        this.webSocketServer = socket.WebSocketServer({
            config: config.socket
        });
        
        server.callModulesMethod('_boot', {
            server: server,
            socketServer: socketServer
        });

        this.start = new Date();

        var startMessage = 'Started:\t' + start;
        console.log(startMessage.bgBlue.black);
    },
    
    createContext: function (options) {
        options.server = this;
    },

    onWebSocketConnection: function (socket) {
        // console.log('SOCKET_CONNECTION');
        var $ = new web.Context(god, socket.upgradeReq);
        $.socket = socket;
        $.authorize(function (agent) {
            
        });
    },

    callModulesMethod: function (name, $) {
        for (var i in modules) {
            var module = modules[i];
            if (module && name in module && module[name] instanceof Function) {
                module[name]($);
            }
        }
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
        var schema = {};
        _.each(modules, function (module, name) {
            if (module._meta) {
                var meta = module._meta;
                _.each(meta.schema, function (field, key) {
                    if (field.constructor === Function) {
                        field = {
                            type: field
                        };
                        meta[key] = field;
                    }
                    if (field instanceof Array) {
                        field = field[0]
                    }
                    field.type = field.type.name;
                    if (field.match) {
                        field.match = field.match.toString()
                    }
                });
                schema[name] = meta.schema;
            }
        });
        return $.send({
            api: 'socex',
            v: 0.5,
            schema: schema
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
            if (Object === result.constructor) {
                let collection = $.collection(result.collection || $.req.url.route[0]);
                if (true === result.select) {
                    result.select = $.select(false, false, true);
                }
                else if (result.select instanceof Array) {
                    result.select = $.select([], result.select, true);
                }
                if (!(result.query instanceof Array)) {
                    result.query = result.query ? [{$match: result.query}] : [];
                }
                if (result.select) {
                    result.query.push({$project: result.select});
                }
                console.log(result.query);
                result.query.push({$skip: $.skip});
                result.query.push({$limit: $.limit});
                collection.aggregate(result.query, $.answer);
            }
            else if (result instanceof mongoose.Query || result instanceof mongoose.Aggregate) {
                if ('find' == result.op || result instanceof mongoose.Aggregate) {
                    var order = $.order;
                    if (order) {
                        result.sort(order);
                    }
                    result.skip($.skip);
                    result.limit($.limit);
                }
                result = result.exec();
            }
            else if ('Promise' == result.constructor.name) {
                result
                    .then(function (c, r) {
                        if ('number' != typeof c) {
                            r = c;
                            c = code.OK;
                        }
                        else if (!r) {
                            return $.sendStatus(c);
                        }
                        if (r) {
                            if ('GET' !== $.req.method) {
                                var success = [
                                    code.OK,
                                    code.CREATED,
                                    code.ACCEPTED
                                ];
                                if (undefined === r.success && success.indexOf(c) >= 0) {
                                    r.success = true;
                                }
                            }
                            else if ($.req.since && r.time && new Date(r.time).getTime() <= $.req.since.getTime()) {
                                return $.sendStatus(code.NOT_MODIFIED);
                            }

                            $.send(r);
                        }
                        else if (arguments.length > 0) {
                            console.error('Undefined promise result', $.req.method, $.req.url.original);
                        }
                        else {
                            $.sendStatus(code.NOT_FOUND);
                        }
                    })
                    .catch(function (r) {
                        if ('number' == typeof r) {
                            $.sendStatus(r)
                        }
                        else {
                            $.send(code.INTERNAL_SERVER_ERROR, {
                                error: {
                                    class: r.constructor.name,
                                    message: r.toString()
                                }
                            })
                        }
                    });
            }
            else if (null === result) {
                $.sendStatus(code.NOT_FOUND);
            }
            break;
        case 'boolean':
            $.send({success: result});
            break;
        case 'number':
            $.res.writeHead(result);
            break;
        case 'string':
            $.send(code.BAD_REQUEST, {
                success: false,
                error: {
                    message: result
                }
            });
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
        if (config.dev) {
            return action($);
        }
        else {
            try {
                return action($);
            }
            catch (ex) {
                if (ex.invalid) {
                    $.send(code.BAD_REQUEST, ex);
                }
                else if (ex instanceof errors.Response) {
                    $.send(ex.code, ex.data);
                }
                else {
                    var error = {
                        message: ex.message
                    };
                    if (ex.code) {
                        error.code = ex.code;
                    }
                    if (ex.stack) {
                        error.stack = ex.stack.split(/\s*\n\s*at\s*/).map(function (trace) {
                            return trace.replace(/[\/\w]+socex\/server\//, '/');
                        });
                    }
                    $.send(code.INTERNAL_SERVER_ERROR, {error: error});
                }
            }
        }
    }

    var is_unauthoried_route = /^.(agent|user.(login|phone|code|personal|exists|avatar))/.test($.req.url.original);
    var must_upload_route = /^.(photo|file)/.test($.req.url.original);

    if ($.user || is_unauthoried_route || ('GET' == $.req.method && $.isCache)) {
        if ($.isUpdate) {
            var mime_name = $.req.headers['content-type'];
            mime_name = mime_name.split(';')[0];
            var mime = constants.mimes[mime_name];
            if (!mime) {
                $.sendStatus(code.UNSUPPORTED_MEDIA_TYPE, {
                    mime: mime_name
                });
                return;
            }
        }
        var size = $.bodySize;
        if (size > 0) {
            if (size > mime.size) {
                $.sendStatus(code.REQUEST_TOO_LONG, {
                    max: mime.size,
                    size: size,
                    mime: mime_name
                });
                return;
            }
            if (!must_upload_route) {
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
                        console.error('UNPROCESSED_DATA', data);
                    }
                    return call_action();
                });
            }
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
