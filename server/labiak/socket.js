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
        this.subscribers = {};
        this.socketServer.on('connection', this.onConnection.bind(this));
    }

    onConnection(socket) {
        var $ = this.server.createContext({
            type: 'websocket',
            socket: new WebSocket({
                // server: this.server,
                socket: socket
            }),
            req: socket.upgradeReq
        });
        $.authorize((agent) => {
            if (agent.user) {
                this.subscribe($);
                this.emit('connection', $);
            }
            else {
                socket.close();
            }
        });
    }

    subscribe($) {
        let user_id = $.user._id.toString();
        let agent_id = $.agent._id.toString();
        let subscriber = this.getSubscribers(user_id);
        if (!subscriber) {
            this.subscribers[user_id] = subscriber = {};
        }
        else if (agent_id in subscriber) {
            this.unsubscribe(user_id, agent_id, {
                type: 'error',
                code: 409,
                status: 'CONFLICT'
            });
        }
        subscriber[agent_id] = $;
        $.socket.socket.on('close', this.onClose.bind($));
        $.socket.socket.on('message', this.onMessage.bind($));
        return subscriber;
    }

    onMessage(message) {
        message = JSON.parse(message);
        if (message.target_id) {
            console.log('SOCKET', message);
            if (!message.source_id) {
                message.source_id = this.user._id;
            }
            this.notifyOne(message.target_id, message);
        }
        else {
            console.warn('NO_TARGET', message.target_id);
        }
    }

    onClose() {
        this.server.webSocketServer.unsubscribe(this.user._id, this.agent._id);
        this.server.log('warn', 'WebSocket closed ' + this.user.domain + ' ' + this.agent._id);
    }

    getSubscribers(user_id) {
        if (!user_id) {
            throw new Error('Invalid user_id', user_id);
        }
        return this.subscribers[user_id.toString()];
    }

    unsubscribe(user_id, agent_id, message) {
        if ('string' !== user_id) {
            user_id = user_id.toString();
        }
        if ('string' !== agent_id) {
            agent_id = agent_id.toString();
        }
        var subscribers = this.getSubscribers(user_id);
        if ('string' === typeof agent_id) {
            if (subscribers) {
                let subscriber = subscribers[agent_id];
                if (subscriber) {
                    subscriber.close(message);
                    delete subscribers[agent_id];
                    if (_.isEmpty(subscribers)) {
                        delete this.subscribers[user_id];
                    }
                    return subscriber;
                }
            }
        }
        else if ('object' === typeof agent_id) {
            _.each(subscribers, function (subscriber) {
                subscriber.close(agent_id);
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
    constructor(options) {
        _.extend(this, options);
    }

    send(message) {
        if (!message.time) {
            message.time = new Date().toISOString();
        }
        this.socket.send(JSON.stringify(message));
    }

    close(message) {
        var isOpen = this.socket.OPEN === this.socket.readyState;
        if (!message) {
            message = {
                code: code.OK,
                status: 'OK'
            }
        }
        if (isOpen) {
            this.socket.close(message.code, JSON.stringify(message));
        }
        return isOpen;
    }
}

module.exports = {
    WebSocketServer,
    WebSocket
};
