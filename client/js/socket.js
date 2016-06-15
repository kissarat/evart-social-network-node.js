"use strict";

function Socket(options) {
    this.address = options.address;
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
                    return console.error('INVALID_JSON', e.data);
                }
                if (message.type) {
                    return App.trigger(message.type, message);
                } else {
                    return console.error('UNKNOWN_MESSAGE', message);
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

var notification_not_available = function() {
    App.features.notification.enabled = false;
    return console.warn('Notification not available');
};

/*
if (App.features.notification.available && App.features.notification.enabled) {
    Notification.requestPermission(function (permission) {
        if ('granted' === permission) {
            return App.notify = function (title, options) {
                return new Notification(title, options);
            };
        } else {
            return notification_not_available();
        }
    });
} else {
    notification_not_available();
}
*/

App.notify = function (title, options) {
    options.title = title;
    return {
        options: options,
        addEventListener: function (event, cb) {
            return console.warn("LISTENER REGISTER");
        }
    };
};

App.socket = new Socket((self.App && App.config ? App.config : self.defaultConfig).socket);

App.pull = deprecated;
App.push = deprecated;

register(App, {
    login: function () {
        App.socket.pull();
    },
    logout: function () {
        if (App.socket) {
            return App.socket.close();
        }
        else {
            console.error('Socket is not exists');
        }
    },
    message: function (message) {
        App.Message.channel.request('message', message);
    }
});
