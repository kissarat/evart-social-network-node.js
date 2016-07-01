"use strict";

var _ = require('underscore');
var ws = require('ws');
var utils = require('./utils');

function WebSocketServer(options) {
    _.extend(this, options);
    this.socketServer = new ws.Server(this.config);
    utils.subscribe('server', this.socketServer, this);
    this.subscribers = {};
}

WebSocketServer.prototype = {
    onConnection: function (socket) {
        var context = this.server.createContext({
            type: 'websocket',
            socket: new WebSocket({
                // server: this.server,
                socket: socket
            }),
            req: this.socketServer.upgradeReq
        });
        context.authorize(this.authorize)
    },

    authorize: function (agent) {
        var context = this;
        if (agent.user) {
            this.subscribe(context);
            context.socket.on('close', function () {
                delete subscriber[cid];
                if (_.isEmpty(subscriber)) {
                    delete subscribers[uid];
                }
            });
            subscriber[cid] = context;
        }
        else {
            context.socket.close();
        }
    },

    subscribe: function (context) {
        let user_id = context.user._id.toString();
        let agent_id = context.agent._id.toString();
        let subscriber = context.getSubscribers(user_id);
        if (!subscriber) {
            subscribers[user_id] = subscriber = {};
        }
        else if (agent_id in subscriber) {
            this.unsubscribe(user_id, agent_id);
        }
        utils.subscribe('socket', context.socket, subscriber);
    },

    onMessage: function (message) {
        message = JSON.parse(message);
        console.log('SOCKET', message);
        if (message.target_id) {
            this.notifyOne(message.target_id, message);
        }
        else {
            console.warn('NO_TARGET', message.target_id);
        }
    },

    onClose: function () {

    },

    getSubscribers: function (user_id) {
        if (!user_id) {
            throw new Error('Invalid user_id', user_id);
        }
        return this.subscribers[user_id.toString()];
    },

    unsubscribe: function (user_id, agent_id) {
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
    },

    notifyOne: function (user_id, message) {
        _.each(this.getSubscribers(target_id), function (context) {
            context.socket.send(message)
        });
    }
};

function WebSocket(options) {
    _.extend(this, options);
}

WebSocket.prototype = {
    send: function (message) {
        if (!message.time) {
            message.time = new Date().toISOString();
        }
        this.socket.send(JSON.stringify(message));
    },

    close: function () {
        var isOpen = true;
        if (isOpen) {
            this.socket.close();
        }
        return isOpen;
    }
};

module.exports = {
    WebSocketServer,
    WebSocket
};
