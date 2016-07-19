'use strict';

var start = Date.now();

require('colors');
var _ = require('underscore');
var fs = require('fs');
var http = require('http');
var mongoose = require('mongoose');
var mongodb = require('mongodb');
var utils = require('./utils');
var twilio = require('twilio');

global.config = require('./config.json');
global.config.client = require('./client.json');
global.code = require('../client/code.json');
global.constants = require('../client/js/data.js');
var web = require('./labiak/web');
var socket = require('./labiak/socket');
var code = require('./code');
var errors = require('./errors');

process.chdir(__dirname);

process.argv.forEach(function (arg) {
    switch (arg) {
        case '--dev':
            config.dev = true;
            break;
    }
});

var modules = {};
var socketFileNames = [config.file];

function cleanupSocket() {
    var filename = socketFileNames.pop();
    if (filename) {
        fs.access(filename, function (err) {
            if (!err) {
                fs.unlinkSync(filename);
            }
            cleanupSocket();
        })
    }
}

cleanupSocket();

global.schema = {};

fs.readdirSync(__dirname + '/modules').forEach(function (file) {
    var match = /^(\w+)\.js$/.exec(file);
    if (match) {
        let module = match[1];
        modules[module] = false === config.modules[module]
            ? false
            : require(__dirname + '/modules/' + match[0]);
    }
});

Object.keys(schema).forEach(function (name) {
    var current = schema[name];
    current.plugin(require('mongoose-unique-validator'));
    global[name] = mongoose.model(name, current);
});

class Server {
    constructor(config) {
        this.start = start;
        fs.access(config.mongo.file, fs.R_OK, (err) => {
            var url = err ? config.mongo.uri : config.mongo.file;
            var options = 'linux' == process.platform ? {} : config.mongo.options || {};
            mongodb.MongoClient.connect(url, config.mongo.options, (err, db) => {
                this.db = db;
                this.mongoose = mongoose.connect(url, options);
                this.mongoose.connection.on('error', Server.onMongoError.bind(this));
                this.mongoose.connection.on('open', this.onMongoOpen.bind(this));
                this.twilio = new twilio.RestClient(config.sms.sid, config.sms.token); 
            });
        });
    }

    static onMongoError(err) {
        console.log(err);
    }

    log(type, message) {
        var spend = Date.now() - this.start;
        console.log(message.blue, spend);
    }

    onMongoOpen() {
        this.log('info', 'MongoDB connection opened');
        this.httpServer = http.createServer((req, res) => {
            try {
                //var methods = ["OPTIONS", "GET", "HEAD", "POST", "PUT", "DELETE", "TRACE", "CONNECT"];
                let $ = this.createContext({req: req, res: res});
                if (config.request.methods.indexOf(req.method) < 0) {
                    $.send(code.METHOD_NOT_ALLOWED, {
                        success: false,
                        error: {
                            message: config.request.methods.join(', ') + ' allowed'
                        }
                    })
                }
                else if ('/agent' === req.url.original) {
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

        this.httpServer.on('listening', this.onHttpListening.bind(this));
        this.httpServer.listen(config.file);
    }

    onHttpClose() {
        this.log('info', 'HTTP server close');
    }

    onHttpListening() {
        this.log('info', 'HTTP server connection opened');
        fs.chmodSync(config.file, parseInt('777', 8));
        var server = new socket.WebSocketServer({
            config: config.socket,
            server: this
        });
        // server.on('connection', this.onWebSocketConnection.bind(this, server));
        this.onWebSocketConnection(server);
    }

    callModulesMethod(name) {
        for (var i in modules) {
            var module = modules[i];
            if (module && name in module && module[name] instanceof Function) {
                module[name](this);
            }
        }
    }

    onWebSocketConnection(webSocketServer) {
        this.log('info', 'WebSocket server connection opened');
        this.webSocketServer = webSocketServer;
        this.modules = modules;
        this.callModulesMethod('_boot', this);
        this.onModulesLoaded();
    }

    onModulesLoaded() {
        this.log('info', 'Modules loaded');
        this.start = new Date();
    }

    createContext(options) {
        options.server = this;
        return new web.Context(options);
    }

    sendSMS(phone, text, cb) {
        this.twilio.sms.messages.create({
            to: '+' + phone,
            from: '+' + config.sms.phone,
            body: text
        }, cb)
    }
    
    getDescription(user) {
        var meta = {
            api: 'socex',
            v: 0.5
        };
        meta.schema = {};
        _.each(modules, function (module, name) {
            if (module._meta && module._meta.schema && ('admin' === user.type ? true : config.meta.schema)) {
                _.each(module._meta.schema, function (field, key) {
                    if (!(Object === field.constructor)) {
                        field = {
                            type: field
                        };
                        module._meta.schema[key] = field;
                    }
                    if (field instanceof Array) {
                        field = field[0]
                    }
                    if (field.type) {
                        field.type = field.type.name;
                    }
                    if (field.match) {
                        field.match = field.match.toString()
                    }
                });
                meta.schema[name] = module._meta;
            }
        });
        return meta;
    }
}

var server = new Server(config);
