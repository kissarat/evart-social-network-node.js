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
        // console.log('SUBSCRIPTION', $.user.domain, $.agent._id, Object.keys(subscriber));
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
        if (user_id instanceof ObjectID) {
            user_id = user_id.toString();
        }
        if (agent_id instanceof ObjectID) {
            agent_id = agent_id.toString();
        }
        const subscribers = this.getSubscribers(user_id);
        if ('string' === typeof agent_id) {
            if (subscribers) {
                const subscriber = subscribers[agent_id];
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
            context.socket.send(message);
        });
    }
}

module.exports = {
    WebSocketServer,
    WebSocket
};
