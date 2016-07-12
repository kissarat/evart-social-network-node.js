"use strict";

var _ = require('underscore');
var ws = require('ws');
var utils = require('../utils');
var EventEmitter = require('events');

class WebSocketServer extends EventEmitter {
    constructor(options) {
        super();
        _.extend(this, options);
        this.socketServer = new ws.Server(this.config);
        utils.subscribe('server', this.socketServer, this);
        this.subscribers = {};
    }

    onConnection(socket) {
        var self = this;
        var $ = this.server.createContext({
            type: 'websocket',
            socket: new WebSocket({
                // server: this.server,
                socket: socket
            }),
            req: this.socketServer.upgradeReq
        });
        $.authorize(function (agent) {
            if (agent.user) {
                self.subscribe($);
                $.socket.on('close', function () {
                    delete subscriber[cid];
                    if (_.isEmpty(subscriber)) {
                        delete subscribers[uid];
                    }
                });
                subscriber[cid] = $;
            }
            else {
                $.socket.close();
            }
        });
        this.trigger('connection', this);
    }

    subscribe($) {
        let user_id = $.user._id.toString();
        let agent_id = $.agent._id.toString();
        let subscriber = $.getSubscribers(user_id);
        if (!subscriber) {
            subscribers[user_id] = subscriber = {};
        }
        else if (agent_id in subscriber) {
            this.unsubscribe(user_id, agent_id);
        }
        utils.subscribe('socket', $.socket, subscriber);
    }

    onMessage(message) {
        message = JSON.parse(message);
        console.log('SOCKET', message);
        if (message.target_id) {
            this.notifyOne(message.target_id, message);
        }
        else {
            console.warn('NO_TARGET', message.target_id);
        }
    }

    onClose() {
        this.server.log('warn', 'WebSocket server closed');
    }

    getSubscribers(user_id) {
        if (!user_id) {
            throw new Error('Invalid user_id', user_id);
        }
        return this.subscribers[user_id.toString()];
    }

    unsubscribe(user_id, agent_id) {
        var subscribers = this.getSubscribers(user_id);
        if (agent_id) {
            if (subscribers) {
                let subscriber = subscribers[agent_id];
                if (subscriber) {
                    subscriber.socket.close();
                    delete subscribers[agent_id];
                    if (_.isEmpty(subscribers)) {
                        delete this.subscribers[user_id];
                    }
                    return subscriber;
                }
            }
        }
        else {
            _.each(subscribers, function (subscriber) {
                subscriber.socket.close();
            });
            delete this.subscribers[user_id];
            return _.isEmpty(subscribers) ? false : subscribers;
        }
        return false;
    }

    notifyOne(user_id, message) {
        _.each(this.getSubscribers(user_id.toString()), function (context) {
            context.socket.send(message)
        });
    }
}

class WebSocket {
    constructor() {
        _.extend(this, options);
    }

    send(message) {
        if (!message.time) {
            message.time = new Date().toISOString();
        }
        this.socket.send(JSON.stringify(message));
    }

    close() {
        var isOpen = true;
        if (isOpen) {
            this.socket.close();
        }
        return isOpen;
    }
}

module.exports = {
    WebSocketServer,
    WebSocket
};
