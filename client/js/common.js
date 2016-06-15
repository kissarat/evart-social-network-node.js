"use strict";

self.DEV = !self.version;
self.T = function (text) {
    return text;
};

self.Labiak = function Labiak() {
    if (this.construct) {
        this.construct.apply(constructor);
    }
};
self.LabiakFunction = function LabiakFunction() {
};
self.isService = !(self.window && window.document);

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
    },

    isObjectID: function (string) {
        return /^[0-9a-f]{24}$/.exec(string);
    },

    defineProperties: function (target, source) {
        for (var key in source) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        }
    },

    defineClass: function (parent, mixins, prototype, statics) {
        var hasParent = 'function' == typeof parent;
        if (parent && 'object' == typeof parent) {
            statics = prototype;
            prototype = mixins;
            mixins = parent;
            parent = Labiak;
        }
        else if (!hasParent) {
            throw new Error('Parent is not a function');
        }
        if (!(mixins instanceof Array)) {
            statics = prototype;
            prototype = mixins;
            mixins = [];
        }
        if (!prototype || 'object' != typeof prototype) {
            throw new Error('Prototype is not an object');
        }
        if (!(mixins instanceof Array)) {
            throw new Error('Mixins is an instance of array');
        }
        var hasConstructor = Object != prototype.constructor;
        var child = hasConstructor ? prototype.constructor : Function();

        if (parent.prototype && 'object' == typeof parent.prototype) {
            child.prototype = Object.create(parent.prototype);
            _.defineProperties(child.prototype);
        }
        else {
            child.prototype = prototype;
        }

        child.prototype.construct = hasParent
            ? function () {
            _.each(mixins, _.extend, this)
        }
            : function () {
            parent.apply(this, arguments);
            _.each(mixins, _.extend, this);
        };

        if (statics) {
            if ('object' != typeof statics) {
                throw new Error('Statics is not an object');
            }
            _.extend(child, statics);
        }

        return child;
    }
});

if (!Array.from) {
    Array.from = _.toArray;
}

function unimplemented() {
    throw new Error('Not implemented');
}

function deprecated() {
    throw new Error('Deprecated');
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

function Service() {
    if (self.Marionette) {
        Marionette.Application.apply(this, arguments);
    }
    else {
        _.extend(this, Backbone.Events);
        this.initialize.apply(this, arguments);
    }

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

    var _this = this;
    this.features = {
        peer: {
            available: !!window.RTCPeerConnection,
            get enabled() {
                return this.available && _this.config.peer.enabled
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
}

if (self.Marionette) {
    Service.prototype = Object.create(Marionette.Application.prototype);
}

_.extend(Service.prototype, {
    cidPrefix: 'app',

    constructor: Service,

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
    },

    Upload: _.defineClass({
        initialize: function (options) {
            var self = this;
            this.url = options.url || '/api/file';
            this.method = options.method || 'POST';
            this.channel = options.channel || Backbone.Radio.channel('upload');
            this.channel.reply('upload', _.bind(this.reply, this));
            this.headers = options.headers || {};
            this.params = options.params;
            if (options.contentType) {
                this.headers['content-type'] = options.contentType;
            }

            function upload(files) {
                self.files = reverse(files);
                self.uploadFile();
                self.on('response', self.uploadFile);
            }

            if (options.promise) {
                options.promise.then(upload);
            }
            else {
                if (options.file) {
                    options.files = [file];
                }
                if (options.files) {
                    upload(options.files);
                }
            }
        },

        uploadFile: function () {
            var file = this.files.pop();
            if (file) {
                this.channel.request('upload', file);
            }
        },

        reply: function (options) {
            var self = this;
            var headers = {};
            if (options instanceof Blob) {
                options.data = options;
            }
            else if (options.json) {
                options.data = JSON.stringify(options.json);
                headers['content-type'] = 'application/json';
            }
            if (options.data.name) {
                headers['name'] = options.data.name;
            }
            if (options.data.type) {
                headers['content-type'] = options.data.type;
            }
            if (options.data.mozFullPath) {
                headers['path'] = options.data.mozFullPath;
            }
            if (options.data.lastModifiedDate) {
                headers['last-modified'] = options.data.lastModifiedDate;
            }
            if (options.data.lastModified) {
                headers['modified'] = options.data.lastModified;
            }
            options.headers = _.merge(this.headers, options.headers, headers);
            if (!options.headers['accept']) {
                options.headers['accept'] = 'application/json';
            }
            var xhr = new XMLHttpRequest();
            options.method = options.method || this.method;
            options.url = options.url || this.url;
            options.params = options.params || this.params;
            var url = options.url;
            if (options.params) {
                url += '?' + $.param(options.params);
            }
            xhr.open(options.method || this.method, url);
            var isText = false;
            for (var name in options.headers) {
                var value = options.headers[name];
                if ('content-type' == name.toLocaleLowerCase() && (value.indexOf('json') > 0 || value.indexOf('text') === 0)) {
                    value += '; charset=utf8';
                    isText = true;
                }
                xhr.setRequestHeader(name, value);
            }
            if (!isText) {
                xhr.responseType = 'arraybuffer';
            }
            xhr.addEventListener('load', function () {
                var data = null;
                try {
                    data = JSON.parse(this.responseText);
                }
                catch (ex) {
                }
                self.trigger('response', data, xhr, options);
            });
            this.trigger('upload', xhr, options);
            xhr.send(options.data);
            return xhr;
        }
    })
});

function uptime() {
    var delta = Date.now() - statistics.start;
    var minutes = Math.floor(delta / 60000);
    var seconds = Math.floor(delta / 1000 - minutes * 60);
    return [minutes, seconds];
}

if (isService) {
    self.App = new Service();
}
