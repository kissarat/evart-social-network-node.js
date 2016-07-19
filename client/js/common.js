"use strict";

self.DEV = !self.version;

self.T = function (text) {
    return text;
};

self.MessageType = {
    DIALOG: 'dialog',
    WALL: 'wall',
    PHOTO: 'photo',
    VIDEO: 'video'
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
    },

    isObjectID: function (string) {
        return /^[0-9a-f]{24}$/.exec(string);
    },

    defineProperties: function (target, source) {
        for (var key in source) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        }
    },

    passed: function (time) {
        return moment.utc(time).fromNow()
    },

    before: function (object, name, method) {
        if (name in object) {
            var _old = object[name];
            object[name] = function () {
                method.apply(this, arguments);
                _old.apply(this, arguments);
            }
        }
        else {
            object[name] = method;
        }
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

function register(target, listeners) {
    var _add = target.addEventListener || target.on;
    for (var name in listeners) {
        _add.call(target, name, listeners[name])
    }
    return target;
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

function logPromise(p) {
    return p.then(function (result) {
            console.log('RESOLVE', result);
        },
        function (error) {
            console.error('REJECT', error);
        });
}

function Service() {
    var _this = this;
    if (self.Marionette) {
        Marionette.Application.apply(this, arguments);
    }
    else {
        _.extend(this, Backbone.Events);
        this.initialize.apply(this, arguments);
    }

    this.defaultConfig = {
        search: {
            delay: 250
        },
        trace: {
            history: false
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

    this.jsonpCount = {
        vk: 0
    };

    this.on('login', function () {
        if (!$.cookie('remixlang')) {
            App.language = _this.user.lang;
        }
    });
}

if (self.Marionette) {
    Service.prototype = Object.create(Marionette.Application.prototype);
}

_.extend(Service.prototype, {
    cidPrefix: 'app',

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

    cookie: function (name, value) {
        document.cookie = name + '=' + value + '; path=/; expires=' + this.config.cookie.future;
    },

    login: function (data, error) {
        var self = this;

        function _login(agent) {
            if (agent && agent.success) {
                self.agent = agent;
            }
            if (self.isAuthenticated()) {
                self.trigger('login');
                self.navigate('profile');
            }
        }

        if (this.isAuthenticated() || !data) {
            $.getJSON('/api/agent', _login);
        } else {
            $.sendJSON('POST', '/api/user/login', data, function (agent, xhr) {
                if (agent && agent.success) {
                    _login(agent);
                }
                else {
                    error(agent, xhr);
                }
            });
        }
    },

    logout: function () {
        var self = this;

        function _logout(agent) {
            delete agent.user;
            self.agent = agent;
            self.trigger('logout');
            self.navigate('login');
        }

        if (this.isAuthenticated()) {
            $.sendJSON('POST', '/api/user/logout', {}, _logout);
        } else {
            _logout(this.agent);
        }
    },

    jsonpCallback: function (prefix) {
        this.jsonpCount[prefix]++;
        return prefix + this.jsonpCount[prefix];
    },

    isAuthenticated: function () {
        return !!(this.agent && this.agent.user);
    },

    isOnline: function () {
        return WebSocket.OPEN === this.socket.readyState;
    },

    resolve: resolve,

    module: function (name, define) {
        var module = {};
        this[name] = module;
        define(module, this);
    },

    updateOnline: function (duration) {
        if (this.isOnline()) {
            $.sendJSON('PATCH', '/api/agent/online', {till: -duration}, function (data) {
                if (data.success) {
                    App.user.online = new Date(data.till).toUTCString();
                }
            });
        }
    },

    debounce: function (context, fn) {
        if (context._debounce_timeout) {
            clearTimeout(context._debounce_timeout);
            context._debounce_timeout = 0;
        }
        context._debounce_timeout = setTimeout(function () {
            fn.call(context);
            context._debounce_timeout = 0;
        }, this.config.search.delay);
    },

    sendStatistics: function (async) {
        statistics.end = Date.now() - statistics.start;
        if (this.config.trace.enabled) {
            $.ajax({
                type: 'PUT',
                url: '/api/agent/stat',
                data: JSON.stringify(statistics),
                async: !!async,
                contentType: 'application/json'
            });
        }
    },

    clearCookies: function () {
        var names = ['auth', 'lang', 'remixlang'];
        for (var i = 0; i < names.length; i++) {
            document.cookie = names[i] + '=; path=/; expires=' + this.config.cookie.past;
        }
    },

    get language() {
        return $.cookie('lang');
    },

    set language(value) {
        $.cookie('lang', value);
        var lang = _.find(Languages, {iso: value});
        if (lang) {
            this.cookie('remixlang', lang._id);
        }
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
});
/*
if (self.jQuery && jQuery.ajaxSetup) {
    jQuery.ajaxSetup({
        beforeSend: function (_1, options) {
            if (self.App && App.user && 'admin' === App.user.type) {
                options.url = options.url.replace(/^\/api-cache\//, '/api/');
                options.url += (options.url.indexOf('?') > 0 ? '&' : '?') + '_=' + Date.now().toString(36);
            }
        }
    });
}
*/
Service.prototype.Upload = function Upload(options) {
    _.extend(this, Backbone.Events);
    this.initialize(options);
};

Service.prototype.Upload.prototype = {
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
        options.params = _.merge(options.params, this.params);
        if (!options.params.owner_id) {
            options.params.owner_id = App.user._id;
        }
        var url = options.url;
        url += '?' + $.param(options.params);
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
        // if (!isText) {
        //     xhr.responseType = 'arraybuffer';
        // }
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
};

if (isService) {
    self.App = new Service();
}
