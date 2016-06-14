"use strict";

self.DEV = !self.version;
self.T = function (text) {
    return text;
};

_.mixin({
    merge: function () {
        if (arguments.length <= 1) {
            return arguments[0] || {};
        }
        else {
            var result = {};
            for (var i = 0; i < arguments.length; i++) {
                var arg = arguments[i];
                if (arg) {
                    for (var j in arg) {
                        result[j] = arg[j];
                    }
                }
            }
            return result;
        }
    },

    hex_time: function () {
        return (Date.now().toString(16) + '000').slice(0, -3);
    }
});

if (!Array.from) {
    Array.from = _.toArray;
}

function reverse(array) {
    if (!(array instanceof Array)) {
        array = Array.from(array);
    }
    return array.reverse();
}

function _instanceof(instance, clazz) {
    return instance instanceof clazz;
}

function _is(child, parent) {
    return child.__super__ && (child.__super__.constructor == parent || _is(child.__super__, parent))
}

function _get(name) {
    var regex = new RegExp(name + '=([^&]+)');
    if (regex.test(location.search)) {
        return regex.exec(location.search)[1];
    }
    return null
}

function properties(target, source) {
    for (var key in source) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    }
}

function preventDefault(e) {
    e.preventDefault();
}

function register(target, listeners) {
    var _add = target.addEventListener || target.on;
    for (var name in listeners) {
        _add.call(target, name, listeners[name])
    }
}

function react(target, getter, listeners) {
    for (var name in listeners) {
        var listener = listeners[name];
        target.on(name, (function () {
            this.apply(getter.apply(target, arguments), arguments);
        }).bind(listener));
    }
}

function resolve(path) {
    if ('string' == typeof path) {
        path = path.split('.');
    }
    var property = this[path[0]];
    if (!property) {
        throw new Error('Invalid property', path[0]);
    }
    return path.length > 1 ? resolve.call(property, path.slice(1)) : property;
}

function getMyId() {
    return App.user._id;
}

function logPromise(p) {
    return p.then(function (result) {
            console.log('RESOLVE', result);
        },
        function (error) {
            console.error('REJECT', error);
        });
}

function CommonApplication() {
    if ('function' == typeof this.initialize) {
        this.initialize();
    }
}

CommonApplication.prototype = {
    
    initialize: function () {
        this.DEV_MODE = true;

        this.defaultConfig = {
            search: {
                delay: 250
            },
            trace: {
                history: true
            },
            socket: {
                address: 'ws://' + location.hostname + '/socket',
                wait: 800
            },
            alert: {
                duration: 12000
            },
            peer: {
                iceServers: [
                    {
                        urls: "stun:stun.services.mozilla.com",
                        username: "louis@mozilla.com",
                        credential: "webrtcdemo"
                    }, {
                        urls: ['stun:stun.l.google.com:19302', 'stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302', 'stun:stun.services.mozilla.com', "stun:23.21.150.121"]
                    }
                ]
            }
        };

        var self = this;
        this.features = {
            peer: {
                available: !!window.RTCPeerConnection,
                get enabled() {
                    return this.available && self.config.peer.enabled
                }
            },
            notification: {
                available: !!window.Notification,
                enabled: false
            },
            fullscreen: {
                available: Element.prototype.requestFullscreen
            }
        };
    },

    debug: {
        trace: function () {
            if (DEV) {
                return console.log.apply(console, arguments);
            }
        },
        error: function () {
            if (DEV) {
                return console.error.apply(console, arguments);
            }
        },
        push: function (name, element) {
            if (DEV) {
                if (!this[name]) {
                    this[name] = [];
                }
                return this[name].push(element);
            }
        }
    },

    login: function () {
        var self = this;
        if (this.user) {
            return this.trigger('login');
        } else {
            return $.getJSON('/api/agent', function (agent) {
                self.agent = agent;
                if (self.user) {
                    self.navigate('profile');
                    $('#dock-container').show();
                    return self.trigger('login');
                }
            });
        }
    },

    logout: function () {
        var self = this;
        if (this.user) {
            return $.getJSON('/api/user/logout', function (response) {
                $('#dock-container').hide();
                self.trigger('logout');
                return self.navigate('login');
            });
        } else {
            this.trigger('logout');
            return this.navigate('login');
        }
    },
    
    resolve: resolve,
    
    module: function (name, define) {
        var module = {};
        this[name] = module;
        define(module, this);
    },

    storage: {
        save: function (model, idAttribute) {
            var id = model.get(idAttribute || '_id');
            if ('object' == typeof id) {
                id = id.id || id._id || id.get('_id');
            }
            localStorage.setItem(id, JSON.stringify(model.attributes));
        },

        load: function (model, idAttribute) {
            var id = idAttribute || '_id';
            var object = localStorage.getItem(id);
            if (object) {
                object = JSON.parse(object);
                model.set(object);
            }
            return !!object;
        }
    }
};
