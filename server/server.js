'use strict';

const start = Date.now();

require('colors');
const _ = require('underscore');
const fs = require('fs');
const http = require('http');
const mongoose = require('mongoose');
const mongodb = require('mongodb');
const twilio = require('twilio');

process.chdir(__dirname);

global.config = require('./config.json');
global.config.client = require('./client.json');
global.code = require('../client/code.json');
global.constants = require('../client/js/data.js');
const web = require('./labiak/web');
const socket = require('./labiak/socket');
const code = require('./code');
const modules = {};
const socketFileNames = [config.file];
global.CreationDateType = {
    type: Date,
    required: true,
    'default': Date.now,
    min: new Date(config.client.birthday),
    max: new Date(config.client.death)
};

process.argv.forEach(function (arg) {
    switch (arg) {
        case '--dev':
            config.dev = true;
            break;
    }
});

function cleanupSocket() {
    const filename = socketFileNames.pop();
    if (filename) {
        fs.access(filename, function (err) {
            if (!err) {
                fs.unlinkSync(filename);
            }
            cleanupSocket();
        });
    }
}

cleanupSocket();

global.schema = {};
// Creating models from schemas
fs.readdirSync(__dirname + '/modules').forEach(function (file) {
    const match = /^(\w+)\.js$/.exec(file);
    if (match) {
        const module = match[1];
        modules[module] = false === config.modules[module]
            ? false
            : require(__dirname + '/modules/' + match[0]);
    }
});

Object.keys(schema).forEach(function (name) {
    const current = schema[name];
    current.plugin(require('mongoose-unique-validator'));
    global[name] = mongoose.model(name, current);
});

// @prevent
// (node:8031) DeprecationWarning: Mongoose: mpromise (mongoose's default promise library) is deprecated,
// plug in your own promise library instead: http://mongoosejs.com/docs/promises.html
mongoose.Promise = Promise;

class Server extends require('events') {
    start() {
        this.start = start;
        fs.access(config.mongo.file, fs.R_OK, (err) => {
            const url = err ? config.mongo.uri : config.mongo.file;
            mongodb.MongoClient.connect(url, config.mongo.options, (err, db) => {
                this.db = db;
                this.mongoose = mongoose.connect(url, config.mongo.options);
                this.mongoose.connection.on('error', Server.onMongoError.bind(this));
                this.mongoose.connection.on('open', this.onMongoOpen.bind(this));
                this.twilio = new twilio.RestClient(config.sms.sid, config.sms.token);
            });
        });
    }

    static onMongoError(err) {
        console.log(err);
    }

    address() {
        return {
            port: 8091
        };
    }

    log(type, message) {
        const spend = Date.now() - this.start;
        console.log(message.blue, spend);
    }

    onMongoOpen() {
        this.log('info', 'MongoDB connection opened');
        this.httpServer = http.createServer((req, res) => {
            try {
                const $ = this.createContext({req: req, res: res});
                if (config.request.methods.indexOf(req.method) < 0) {
                    $.send(code.METHOD_NOT_ALLOWED, {
                        success: false,
                        error: {
                            message: config.request.methods.join(', ') + ' allowed'
                        }
                    });
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
        const server = new socket.WebSocketServer({
            config: config.socket,
            server: this
        });
        // server.on('connection', this.onWebSocketConnection.bind(this, server));
        this.onWebSocketConnection(server);
    }

    callModulesMethod(name) {
        for (const i in modules) {
            const module = modules[i];
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
        this.emit('start');
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
        }, cb);
    }

    getDescription(user) {
        const meta = {
            api: config.client.api.name,
            v: config.client.api.version
        };

        const types = {
            ObjectID: mongoose.Schema.Types.ObjectId,
            String: String,
            Number: Number,
            Boolean: Boolean,
            Date: Date
        };

        meta.schema = {};
        _.each(modules, function (module, name) {
            function normalize(field) {
                if (field instanceof Array) {
                    field = field[0];
                }
                for(const key in types) {
                    if (types[key] === field.type) {
                        field.type = key;
                        break;
                    }
                }
                if ('string' !== typeof field.type) {
                    return _.each(field, normalize);
                }
                if (!field.type) {
                    throw new Error('Unknown type');
                }
                if (field.match instanceof RegExp) {
                    field.match = field.match.toString().slice(1, -1);
                }
            }
            if (module._meta && module._meta.schema && ('admin' === user.type ? true : config.meta.schema)) {
                normalize(module._meta.schema);
                meta.schema[name] = module._meta;
            }
        });
        return meta;
    }
}

global.server = new Server(config);

if (module === require.main) {
    server.start();
}