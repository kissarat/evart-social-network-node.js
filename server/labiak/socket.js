'use strict';

const _ = require('underscore');
const ws = require('ws');
const EventEmitter = require('events');
const ObjectID = require('mongodb').ObjectID;

class WebSocket {
    constructor(options) {
        _.extend(this, options);
    }

    send(message) {
        this.socket.send(JSON.stringify(message));
    }

    close(message) {
        const isOpen = this.socket.OPEN === this.socket.readyState;
        if (!message) {
            message = {
                code: code.OK,
                status: 'OK'
            };
        }
        if (isOpen) {
            this.socket.close(message.code, JSON.stringify(message));
        }
        return isOpen;
    }
}

class WebSocketServer extends EventEmitter {
    constructor(options) {
        super();
        _.extend(this, options);
        this.socketServer = new ws.Server(this.config);
        this.subscribers = {};
        this.socketServer.on('connection', this.onConnection.bind(this));
        setInterval(function (subscribers) {
            _.each(subscribers, function (subscriber, user_id) {
                if (_.isEmpty(subscriber)) {
                    delete subscribers[user_id];
                }
            });
        }, 60 * 10, this.subscribers);
    }

    onConnection(socket) {
        const $ = this.server.createContext({
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
                // console.log('SOCKET_CONNECTION', $.user.domain, $.agent._id);
                this.emit('connection', $);
            }
            else {
                socket.close();
            }
        });
    }

    subscribe($) {
        const user_id = $.user._id.toString();
        const agent_id = $.agent._id.toString();
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
        // console.log('SUBSCRIPTION', $.user.domain, $.agent._id, this.getList());
        return subscriber;
    }

    getList() {
        const sockets = {};
        _.each(this.subscribers, function (subscriber, user_id) {
            if (_.isEmpty(subscriber)) {
                console.error('No sockets found', user_id);
            }
            else {
                sockets[_.find(subscriber).user.domain] = Object.keys(subscriber);
            }
        });
        return sockets;
    }

    onMessage(message) {
        message = JSON.parse(message);
        // console.log('SOCKET', message);
        if (message.target_id) {
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
        // this.server.log('warn', 'CLOSE WebSocket ' + this.user.domain + ' ' + this.agent._id);
    }

    getSubscribers(user_id) {
        if (!user_id) {
            throw new Error('Invalid user_id', user_id);
        }
        return this.subscribers[user_id];
    }

    unsubscribe(user_id, agent_id, message) {
        if (_.isObject(agent_id)) {
            message = agent_id;
            agent_id = null;
        }
        else if (agent_id instanceof ObjectID) {
            agent_id = agent_id.toString();
        }
        if (user_id instanceof ObjectID) {
            user_id = user_id.toString();
        }
        const userSubscribers = this.getSubscribers(user_id);
        const subscribers = agent_id ? _.pick(userSubscribers, agent_id) : userSubscribers;
        _.each(subscribers, function (subscriber, agent_id) {
            delete userSubscribers[agent_id];
            subscriber.close(message);
        });
        // console.log('#### SUBSCRIPTION', agent_id, message);
        // if (_.isEmpty(userSubscribers)) {
        //     return delete this.subscribers[user_id];
        // }
        return false;
    }

    notifyOne(user_id, message) {
        const sockets = this.getSubscribers(user_id.toString());
        _.each(sockets, function (context) {
            context.socket.send(message);
        });
        return sockets;
    }
}

module.exports = {
    WebSocketServer,
    WebSocket
};
