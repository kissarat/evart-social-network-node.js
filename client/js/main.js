"use strict";

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

addEventListener('keyup', function (e) {
   if ('F7' == e.key) {
       var error_id = localStorage.getItem('errors_last');
       if (error_id) {
           App.local.getById('errors', error_id).then(function (error) {
               var text = JSON.stringify(error, null, '\t');
               text = text.replace(/([\/\w\-_]+\.js):(\d+)/g, function (match, path, line) {
                   return '<span class="green">' + path + '</span>:<span class="red">' + line + '</span>';
               });
               document.body.innerHTML = '<pre>' + text + '</pre>';
           })
       }
   }
});

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
    }
});

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

$(document).ajaxError(function (e, xhr) {
    var data;
    try {
        data = JSON.parse(xhr.responseText);
    }
    catch (ex) {}
    if (data && data.error && data.error.stack) {
        var error = data.error;
        error.type = 'server';
        App.local.add('errors', error);
    }
});

var Application = Marionette.Application.extend({
    region: '#root-region',

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
App.name = 'socex';
App.version = 1;
_.extend(App, CommonApplication.prototype);
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
