"use strict";

window.DEV = !window.version;

_.extend(Element.prototype, {
    setBackground: function (id) {
        if (/^[\da-f]{24}$/.test(id)) {
            id = '/photo/' + id + '.jpg'
        }
        if (id) {
            this.style.backgroundImage = 'url("' + id + '")';
        }
        else if (this.style.backgroundImage) {
            this.style.removeProperty('background-image');
        }
    },

    findParent: function (predicate) {
        var current = this;
        do {
            if (predicate(current)) {
                return current;
            }
        } while (current = current.parentNode);
        return null;
    }
});

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

HTMLFormElement.prototype.serialize = function () {
    var result;
    result = {};
    _.each(this.elements, function (input) {
        if ('file' != input.getAttribute('type')) {
            result[input.getAttribute('name')] = input.value;
        }
    });
    return result;
};

jQuery.sendJSON = function (type, url, data, complete) {
    return this.ajax({
        type: type,
        url: url,
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        data: JSON.stringify(data),
        complete: complete
    });
};

_.extend(jQuery.fn, {
    serialize: function () {
        return this[0].serialize();
    },
    busy: function (state) {
        return this.toggleClass('busy', state);
    },
    report: function (name, message, cssClass) {
        var parent = this.find("[name=" + name + "]").parent();
        var helpBlock = parent.find(".help-block");
        if (helpBlock.length == 0) {
            helpBlock = parent.parent().find(".help-block");
        }
        if ('string' === typeof cssClass) {
            helpBlock.addClass(cssClass).show().html(message);
        } else if (false === cssClass) {
            helpBlock.attr('class', 'help-block').hide().empty();
        } else {
            helpBlock.attr('class', 'help-block').show().html(message);
        }
    }
});

_.extend(Backbone.Model.prototype, {
    toString: function () {
        return this.get('_id');
    },

    wrapModel: function () {
        return function (key, cb) {
            var value;
            value = this.get(key);
            if (value && 'object' === typeof value && !_instanceof(value, Backbone.Model)) {
                return this.set(key, cb(value));
            }
        };
    }
});

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

function logPromise(p) {
    return p.then(function (result) {
            console.log('RESOLVE', result);
        },
        function (error) {
            console.error('REJECT', error);
        });
}

var RootLayout = Marionette.View.extend({
    template: '#view-region',
    regions: {
        left: '#left',
        addLeft: '#root > .add.left > .region',
        main: '#main',
        addRight: '#root > .add.right > .region',
        right: '#right',
        alert: '#alert'
        // modalRegion: App.ModalRegion
    }
});

var morozovProxyHandler = {
    get: function (target, name) {
        return target[name];
    },

    set: function (target, name, value) {
        console.log(name);
        target[name] = value;
    }
};

var Application = Marionette.Application.extend({
    region: '#root-region',

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

        this.channels = {};
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

    navigate: function (url) {
        return Backbone.history.navigate(url, {
            trigger: true
        });
    },

    avatarUrl: function (id) {
        return '/api/user/avatar?id=' + id;
    },

    id: function (object) {
        if (!object) {
            console.warn('Null id');
            return null;
        }
        if (object._id) {
            return object._id;
        }
        if ('object' === typeof object) {
            return object.get('_id');
        } else {
            return object;
        }
    },

    onStart: function (xhr) {
        if (this.user) {
            return $('body').removeAttr('class');
        } else {
            var first = this.route[0];
            if (['login', 'signup', 'users'].indexOf(first) == 0) {
                return this.login();
            }
        }
    },

    module: function (name, define) {
        var module = {};
        this[name] = module;
        define(module, this);
    }
});

properties(Application.prototype, {
    get route() {
        return location.pathname.split('/').slice(1);
    },

    get config() {
        if (!this._config && this.agent && this.agent.config) {
            var config = this.agent.config;
            config.socket.address = config.socket.address.replace('{hostname}', location.hostname);
            var stun = config.peer.iceServers[0].urls.split(' ').map(function (address) {
                return 'stun:' + address;
            });
            config.peer.iceServers[0].urls = stun.concat(this.defaultConfig.peer.iceServers[0].urls);
            this._config = config;
        }
        return this._config ? this._config : this.defaultConfig;
    },

    get stunServers() {
        return [] || this.config.peer.iceServers[0].urls;
    },

    get language() {
        return $.cookie('lang') || document.documentElement.getAttribute('lang');
    },

    set language(value) {
        $.cookie('lang', value);
    },

    get user() {
        return this.agent && this.agent.user ? this.agent.user : null;
    },

    get mainRegion() {
        return this.getView().getRegion('main');
    }
});

_.extend(Backbone.Validation.callbacks, {
    valid: function (view, attr, selector) {
        return view.$el.report(attr, '', false);
    },
    invalid: function (view, attr, error, selector) {
        return view.$el.report(attr, error, false);
    }
});

var App = new Application();
window.App = App;
window.Application = Application;
App.showView(new RootLayout());

App.Behaviors = {};

Marionette.Behaviors.behaviorsLookup = function () {
    return App.Behaviors;
};

App.PageableCollection = Backbone.PageableCollection.extend({
    mode: 'infinite',

    initialize: function () {
        this.queryModel = new Backbone.Model(this.queryModelInitial);
        var self = this;
        return Object.keys(this.queryModelInitial).forEach(function (k) {
            return self.queryParams[k] = function () {
                var value = self.queryModel.get(k);
                if ('string' == typeof value) {
                    return value ? value.trim().replace(/\s+/g, ' ').toLocaleLowerCase() : '';
                }
                else {
                    console.error(k + ' is undefined');
                }
            };
        });
    },

    // state: function () {
    //     return {
    //         totalRecords: 2000,
    //         currentPage: 1,
    //         limit: 48
    //     }
    // },

    state: {
        order: -1,
        sort: '_id',
        limit: 48,
        currentPage: 1,
        totalRecords: 2000
    },

    queryParams: {
        pageSize: 'limit',
        sortKey: '_id',
        currentPage: null,
        totalPages: null,
        totalRecords: null,
        skip: function () {
            return (this.state.currentPage - 1) * this.state.pageSize;
        }
    },

    parseRecords: function (records) {
        var state = this.state;
        if (0 === records.length) {
            state.totalRecords = this.fullCollection.length;
            if (state.totalRecords > 0) {
                state.totalPages = Math.floor(state.totalRecords / state.limit);
                state.currentPage = state.totalPages;
            } else {
                state.totalPages = 0;
                state.currentPage = 1;
            }
        }
        return records;
    },

    delaySearch: function (cb) {
        var self = this;

        function search() {
            self.fullCollection.reset();
            self.getFirstPage({
                success: cb
            });
        }

        _.debounce(search, App.config.search.delay);
    },

    getPage: function (number) {
        var self = this;
        if (!this.loading) {
            this.trigger('start');
            this.loading = true;
            Backbone.PageableCollection.prototype.getPage.call(this, number, {
                complete: (function () {
                    self.trigger('finish');
                    self.loading = false;
                })
            });
        }
    }
});

App.Upload = Marionette.Object.extend({
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
});
