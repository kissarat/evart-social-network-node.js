'use strict';

var start = Date.now();

require('colors');
var _ = require('underscore');
var fs = require('fs');
var http = require('http');
var mongoose = require('mongoose');
var utils = require('./utils');

global.config = require('./config.json');
global.config.client = require('./client.json');
global.code = require('../client/code.json');
global.constants = require('../client/js/data.js');
var web = require('./labiak/web');
var socket = require('./labiak/socket');
var code = require('./code');
var errors = require('./errors');

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

fs.readdirSync(__dirname + '/modules').forEach(function (file) {
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

function Server() {
    this.start = start;
    this.mongoose = mongoose.connect(config.mongo.uri, 'freebsd' == process.platform ? {} : config.mongo.options);
    utils.subscribe('mongo', this.mongoose.connection, this);
}

Server.prototype = {
    onMongoError: function (err) {
        console.log(err);
    },

    log: function (type, message) {
        var spend = Date.now() - this.start;
        console.log(message.blue, spend);
    },

    onMongoOpen: function () {
        var self = this;
        this.log('info', 'MongoDB connection opened');
        this.httpServer = http.createServer(function (req, res) {
            try {
                var $ = self.createContext({req: req, res: res});
                if ('/agent' === req.url.original) {
                    $.serve();
                }
                else {
                    $.authorize(() => $.serve());
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

        utils.subscribe('http', this.httpServer, this);
        this.httpServer.listen(config.file);
    },

    onHttpClose: function () {
        this.log('info', 'HTTP server close');
    },

    onHttpListening: function () {
        this.log('info', 'HTTP server connection opened');
        fs.chmodSync(config.file, parseInt('777', 8));
        var server = new socket.WebSocketServer({
            config: config.socket
        });
        utils.subscribe('websocket', server, this);
        this.onWebSocketConnection(server);
    },

    callModulesMethod: function (name) {
        for (var i in modules) {
            var module = modules[i];
            if (module && name in module && module[name] instanceof Function) {
                module[name](this);
            }
        }
    },

    onWebSocketConnection: function (webSocketServer) {
        this.log('info', 'WebSocket server connection opened');
        this.webSocketServer = webSocketServer;
        this.modules = modules;
        this.callModulesMethod('_boot', this);
        this.onModulesLoaded();
    },

    onModulesLoaded: function () {
        this.log('info', 'Modules loaded');
        this.start = new Date();
    },

    createContext: function (options) {
        options.server = this;
        return new web.Context(options);
    },

    getDescription: function () {
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
        return {
            api: 'socex',
            v: 0.5,
            schema: schema
        };
    }
};

var server = new Server();
