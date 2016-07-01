'use strict';

require('colors');
var _ = require('underscore');
var fs = require('fs');
var http = require('http');
var mongoose = require('mongoose');

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
    this.mongoose = mongoose.connect(config.mongo.uri, 'freebsd' == process.platform ? {} : config.mongo.options);
    utils.subscribe('mongoose', this.mongoose, this);
}

Server.prototype = {
    onMongooseError: function (err) {
        console.log(err);
    },

    onMongooseOpen: function () {
        this.httpServer = http.createServer(function (req, res) {
            try {
                var $ = this.createContext({req: req, res: res});
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
        return new Context(options);
    },

    onWebSocketConnection: function (socket) {
        // console.log('SOCKET_CONNECTION');
        var $ = new web.Context(god, socket.upgradeReq);
        $.socket = socket;
        $.authorize(function (agent) {

        });
    },

    callModulesMethod: function (name) {
        for (var i in modules) {
            var module = modules[i];
            if (module && name in module && module[name] instanceof Function) {
                module[name](this);
            }
        }
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
