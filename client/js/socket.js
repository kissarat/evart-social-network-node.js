"use strict";

function Socket(options) {
    _.extend(this, Backbone.Events);
    this.address = options.address;
    this.pull = this.pull.bind(this);
    this.push = this.push.bind(this);
}

Socket.prototype = {
    pull: function () {
        if (this.socket && WebSocket.OPEN === this.socket.readyState) {
            return;
        }
        this.socket = new WebSocket(this.address);
        var self = this;
        register(this.socket, {
            message: function (e) {
                App.debug.push('socket_pull', e.data);
                try {
                    var message = JSON.parse(e.data);
                } catch (ex) {
                    console.error('INVALID_JSON', e.data);
                }
                if (message.type) {
                    self.trigger(message.type, message);
                } else {
                    console.error('UNKNOWN_MESSAGE', message);
                }
            },
            close: function () {
                if (App.user) {
                    return setTimeout(self.pull.bind(App), App.config.socket.wait);
                }
            }
        });
    },

    push: function (message) {
        if ('string' !== typeof message) {
            message.source_id = App.user._id;
            message = JSON.stringify(message);
        }
        App.debug.push('socket_push', message);
        return this.socket.send(message);
    },

    close: function () {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        else {
            console.error('WebSocket does not exists');
        }
    }
};


App.notify = function (options) {
    if (App.features.notification.available) {
        Notification.requestPermission(function (permission) {
            if ('granted' === permission) {
                App.notify = function (options) {
                    if ('string' == typeof options) {
                        options = {title: options};
                    }
                    var n = new Notification(options.title, options);
                    if (!isNaN(options.timeout) && options.timeout > 0) {
                        setTimeout(function () {
                            n.close();
                        }, options.timeout);
                    }
                    App.local.add('notification', options);
                };
                App.notify(options);
            }
        });
    }
};

App.socket = new Socket((self.App && App.config ? App.config : self.defaultConfig).socket);

App.pull = deprecated;
App.push = deprecated;

register(App, {
    login: function () {
        this.socket.pull();
    },
    
    logout: function () {
        this.socket.close();
    }
});
