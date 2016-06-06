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
        if (App.user) {
            return App.trigger('login');
        } else {
            return $.getJSON('/api/agent', function (agent) {
                App.agent = agent;
                if (App.user) {
                    App.navigate('profile');
                    $('#dock-container').show();
                    return App.trigger('login');
                }
            });
        }
    },

    logout: function () {
        if (App.user) {
            return $.getJSON('/api/user/logout', function (response) {
                $('#dock-container').hide();
                App.trigger('logout');
                return App.navigate('login');
            });
        } else {
            App.trigger('logout');
            return App.navigate('login');
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

    boot: function (xhr) {
        if (code.UNAUTHORIZED !== xhr.status) {
            try {
                App.agent = JSON.parse(xhr.responseText);
                App.trigger('login');
            } catch (ex) {
                console.warn('User is not authorized');
            }
        }

        Backbone.history.start({
            pushState: true,
            root: '/'
        });
        if (!App.user) {
            var first = App.route[0];
            if ('login' == first || 'signup' == first) {
                return App.login();
            }
        } else {
            return $('body').removeAttr('class');
        }
    },

    module: function (name, define) {
        var module = {};
        this[name] = module;
        // console.log('MODULE: ' + name);
        // define(new Proxy(module, morozovProxyHandler), this);
        define(module, this);
    },

    onStart: function () {
        var self = this;
        $.sendJSON('POST', '/api/agent', statistics, function (xhr) {
            var language;
            $('#boot-loading').hide();
            $('#root').show();
            if (xhr.status <= code.UNAUTHORIZED) {
                language = App.language;
                if (language && 'en' !== language) {
                    document.documentElement.setAttribute('lang', language);
                    $.getJSON("/languages/" + language + ".json", function (_dict) {
                        window.dictionary = _dict;
                        window.T = function (name) {
                            return this.dictionary[name] || name;
                        };
                        self.boot(xhr);
                    });
                } else {
                    self.boot(xhr);
                }
            } else {
                self.Views.show('Error', {
                    status: 'Server Error',
                    text: 'Service Temporarily Unavailable'
                });
            }
        });
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

addEventListener('load', function () {
    if (!window.supported) {
        return;
    }

    if (false && matchMedia('min-width(769px)')) {
        var leftMenu = new App.Views.VerticalMenu();
        leftMenu.$el.hide();
        App.region.addLeftRegion.show(leftMenu);
        var rightMenu = new App.Views.VerticalMenu();
        rightMenu.$el.hide();
        App.addRightRegion.show(rightMenu);
        $('#root > .add').click(function (e) {
            var isLeft = this.classList.contains('left');
            (isLeft ? leftMenu : rightMenu).$el.toggle();
            (!isLeft ? leftMenu : rightMenu).$el.hide();
        });
    }

    $('#dock a')
        .click(function (e) {
            var href, region, widget;
            e.preventDefault();
            region = this.getAttribute('data-open');
            href = this.getAttribute('href');
            widget = App.widgets[href.slice(1)];
            if (region && widget) {
                $('#' + region).show();
                region = App[region + 'Region'];
                return widget(null, region);
            } else {
                return App.navigate(href);
            }
        })
        .on('mouseover', function () {
            _.each(document.querySelectorAll('#dock a.prev'), function (prev) {
                return prev.classList.remove('prev');
            });
            if (this.getAttribute('href')) {
                return this.classList.add('prev');
            }
        });

    $(document).ajaxError(function (_1, ajax) {
        switch (ajax.status) {
            case code.UNAUTHORIZED:
                App.navigate('/login');
                break;
            default:
                if (ajax.responseJSON && ajax.responseJSON.error) {
                    var error = ajax.responseJSON.error;
                    App.alert('danger', error.message ? error.message : error);
                }
        }
    });

    // var deferreds;
    // $('#select-language').val(App.language).change(function (e) {
    //     $.cookie('lang', e.target.value, {
    //         expires: 365,
    //         path: '/'
    //     });
    //     return location.reload();
    // });
    if (DEV) {
        var deferreds = [];
        $('[data-src]').each(function (i, script) {
            return deferreds.push($.get(script.dataset.src, function (template) {
                script.innerHTML = template.replace(/>\s+</g, '><');
                return script.removeAttribute('data-src');
            }));
        });
        return $.when(deferreds).then(function () {
            console.log('Views loaded');
            App.start();
        });
    } else if (window.addEventListener && navigator.sendBeacon) {
        addEventListener('beforeunload', function () {
            return navigator.sendBeacon('/api/statistics', JSON.stringify(statistics));
        });
        App.start();
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
        var _this = this;
        return Object.keys(this.queryModelInitial).forEach(function (k) {
            return _this.queryParams[k] = function () {
                var value;
                value = _this.queryModel.get(k);
                if (value) {
                    return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
                } else {
                    return console.error(k + ' is undefied');
                }
            };
        });
    },

    state: {
        order: -1,
        sortKey: '_id',
        totalRecords: 2000
    },

    queryParams: {
        pageSize: 'limit',
        sortKey: 'sort',
        currentPage: null,
        totalPages: null,
        totalRecords: null,
        skip: function () {
            return (this.state.currentPage - 1) * this.state.pageSize;
        }
    },

    parseRecords: function (records) {
        if (0 === records.length) {
            this.state.totalRecords = this.fullCollection.length;
            if (this.state.totalRecords > 0) {
                this.state.totalPages = Math.floor(this.state.totalRecords / this.state.limit);
                this.state.currentPage = this.state.totalPages;
            } else {
                this.state.totalPages = 0;
                this.state.currentPage = 1;
            }
        }
        return records;
    },

    delaySearch: function (cb) {
        this.start = Date.now();
        var _this = this;

        function search() {
            if (Date.now() - _this.start >= App.config.search.delay) {
                _this.fullCollection.reset();
                _this.getFirstPage({
                    success: cb
                });
            }
        }

        setTimeout(search, App.config.search.delay);
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
