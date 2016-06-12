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
                    return setTimeout(pull, App.config.socket.wait);
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
    }
};

var notification_not_available = function() {
    App.features.notification.enabled = false;
    return console.warn('Notification not available');
};

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

App.notify = function (title, options) {
    options.title = title;
    return {
        options: options,
        addEventListener: function (event, cb) {
            return console.warn("LISTENER REGISTER");
        }
    };
};

App.socket = new Socket(App.config.socket);

// App.pull = App.socket.pull;
// App.push = App.socket.push;


register(App, {
    login: App.socket.pull.bind(App.socket),
    logout: function () {
        return App.socket.close();
    },
    message: function (message) {
        var add, dialog;
        dialog = App.getDialogs().findWhere({
            dialog_id: message.source
        });
        add = function () {
            return dialog.get('messages').add(message);
        };
        return App.dock.set('dialogs');
    }
});
