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
        this.socket = new WebSocket(App.config.socket.address);
        var self = this;

        function connect(timeout) {
            return function () {
                if (App.isAuthenticated() && !this._timeout) {
                    this._timeout = setTimeout(function () {
                        self._timeout = 0;
                        self.pull();
                    }, timeout);
                }
            };
        }

        register(this.socket, {
            message: function (e) {
                App.debug.push('socket_pull', e.data);
                try {
                    var message = JSON.parse(e.data);
                } catch (ex) {
                    console.error('INVALID_JSON', e.data);
                }
                if (message.type) {
                    switch (message.type) {
                        case 'echo':
                            console.log(message);
                            App.socket.push({
                                type: 'log',
                                target_id: message.source_id
                            });
                            break;

                        case 'log':
                            console.log(message);
                            break;

                        default:
                            self.trigger(message.type, message);
                            break;
                    }
                } else {
                    console.error('UNKNOWN_MESSAGE', message);
                }
            },

            error: connect(App.config.socket.error.wait),
            close: connect(App.config.socket.wait)
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

if (App.features.notification.available) {
    Notification.requestPermission(function (permission) {
        if ('granted' === permission) {
            App.features.notification.enabled = true;
        }
    });
}


if (App.features.notification.enabled) {
    App.notify = function (options) {
        if ('string' === typeof options) {
            options = {title: options};
        }
        if (!isFirefox) {
            sound(model.get('sound') ? model.get('sound') : 'notification');
        }
        var notification = new Notification(options.title, options);
        if (!isNaN(options.timeout) && options.timeout > 0) {
            setTimeout(function () {
                notification.close();
            }, options.timeout);
        }
        if (options.url) {
            notification.addEventListener('click', function () {
                App.navigate(options.url);
                notification.close();
            });
        }
        return notification;
    }
}
else {
    App.notify = Function();
}

App.socket = new Socket((self.App && App.config ? App.config : self.defaultConfig).socket);

register(App, {
    login: function () {
        this.socket.pull();
    },

    logout: function () {
        this.socket.close();
    }
});
