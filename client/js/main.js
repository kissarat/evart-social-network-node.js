"use strict";

function _sendMessages(n) {
    for (var i = 0; i < n; i++) {
        setTimeout(function () {
            $.sendJSON('POST', '/api/message', {
                type: 'dialog',
                target: '01145c9ae906148400be8f72',
                text: 'A' + i
            });
        }, i * 1100);
    }
}

_.extend(Element.prototype, {
    setBackground: function (id) {
        if (/^[\da-f]{24}$/.test(id)) {
            id = '/api/file?id=' + id;
        }
        if (id) {
            this.style.backgroundImage = 'url("' + id + '")';
        }
    }
});

addEventListener('keyup', function (e) {
    if ('F7' == e.key) {
        var error_id = localStorage.getItem('_error_last');
        if (error_id) {
            App.local.getById('_error', error_id).then(function (error) {
                var text = JSON.stringify(error, null, '\t');
                text = text.replace(/([\/\w\-_]+\.js):(\d+)/g, function (match, path, line) {
                    return '<span class="green">' + path + '</span>:<span class="red">' + line + '</span>';
                });
                document.body.innerHTML = '<pre>' + text + '</pre>';
            })
        }
    }
});

_.extend(Backbone.ChildViewContainer.prototype, {
    clear: function () {
        var self = this;
        this.call(function () {
            self.remove(this);
        })
    }
});

jQuery.sendJSON = function (type, url, data, complete) {
    var options = {
        type: type,
        url: url,
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        data: JSON.stringify(data)
    };
    if (complete) {
        options.complete = function (xhr) {
            var response = xhr.responseJSON;
            complete(response, xhr);
        };
    }
    return this.ajax(options);
};

_.extend(jQuery.fn, {
    serialize: function () {
        return this[0].serialize();
    },

    busy: function (state) {
        return this.toggleClass('busy', state);
    },

    report: function (name, message, cssClass) {
        var parent = this.find('[name="' + name + '"]').parent();
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

var StackRegion = Marionette.Region.extend({
    initialize: function () {
        this.stack = [];
    },

    push: function (view) {
        var old = this.currentView;
        if (old) {
            this.stack.push(this.currentView);
        }
        this.show(view);
        return old;
    },

    pop: function () {
        var current = this.currentView;
        var old = this.stack.pop();
        if (old) {
            this.show(old);
        }
        else {
            this.empty();
        }
        return current;
    },

    getPanelList: function () {
        var current = this.currentView;
        if (current) {
            if (current instanceof App.Views.PanelList) {
                return current;
            }
            else {
                throw new Error('currentView is not PanelList');
            }
        }
        else {
            this.show(new App.Views.PanelList());
            return this.currentView;
        }
    },

    addPanel: function (view, options) {
        var panelList = this.getPanelList();
        var panel = view instanceof App.Views.Panel ? view : new App.Views.Panel();
        panelList.addChildView(panel);
        panel.ui.controls.show();
        this._resolveView(panel.getRegion('content'), view, options);
        return panel;
    },

    _resolveView: function (region, view, options) {
        if ('string' == typeof view) {
            view = App.resolve(view);
        }
        if (view instanceof Marionette.View) {
            region.show(view);
        }
        else {
            if ('function' === typeof view.widget) {
                view = view.widget(region, options);
            }
            else {
                throw new Error('View is not widget');
            }
        }
        return view;
    },

    removePanel: function () {
        throw new Error('Not implemented');
    }
});

var ModalRegion = Marionette.Region.extend({
    onShow: function () {
        this.$el.show();
    },

    onEmpty: function () {
        this.$el.hide();
    }
});

$(document).ajaxError(function (e, xhr) {
    switch (xhr.status) {
        case code.UNAUTHORIZED:
            App.navigate('/login');
            break;
        default:
            var data = xhr.responseJSON;
            if (data && data.error) {
                var error = data.error;
                App.alert('danger', error.message ? error.message : error);
                if (error.stack) {
                    error.type = 'server';
                    App.local.create('_error', error);
                }
            }
    }
});

function Application() {
    Service.apply(this, arguments);
    _.defineProperties(this, {
        get route() {
            return location.pathname.split('/').slice(1);
        },

        get config() {
            function iceServer(prefix, value) {
                var object = {};
                var url = 'string' == typeof value ? value : value[0];
                url = prefix + url;
                if (isFirefox) {
                    object.urls = url;
                }
                else {
                    object.url = url;
                }
                if (value instanceof Array) {
                    object.username = value[1];
                    object.credential = value[2];
                }
                return object;
            }

            if (!this._config && this.agent && this.agent.config) {
                var config = this.agent.config;
                if (config.socket.address) {
                    config.socket.address = config.socket.address.replace('{hostname}', location.host);
                }
                config.peer.iceServers = [];
                config.peer.stun.split(' ').forEach(function (value) {
                    config.peer.iceServers.push(iceServer('stun:', value));
                });
                config.peer.turn.forEach(function (value) {
                    config.peer.iceServers.push(iceServer('turn:', value));
                });
                this._config = config;
            }
            return this._config ? this._config : this.defaultConfig;
        },

        get stunServers() {
            return [] || this.config.peer.iceServers[0].urls;
        },

        set language(value) {
            this.getCookie('lang', value);
            var lang = _.find(Languages, {iso: value});
            if (lang) {
                this.setCookie('remixlang', lang._id);
            }
            document.documentElement.setAttribute('lang', value);
        },

        get user() {
            return this.agent && this.agent.user ? this.agent.user : null;
        },

        get mainRegion() {
            return this.getView().getRegion('main');
        }
    });
}

Application.prototype = Object.create(Service.prototype);

_.extend(Application.prototype, {
    region: '#root-region',

    initialize: function () {
        this.showView(new this.RootLayout());
    },

    navigate: function (url) {
        if (statistics.history) {
            statistics.history.push([Date.now() - statistics.start, url]);
        }
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

    getPlace: function (name) {
        return this.getView().getRegion(name);
    },

    RootLayout: Marionette.View.extend({
        template: '#view-region',
        regions: {
            left: new StackRegion({el: '#left'}),
            addLeft: '#root > .add.left',
            main: '#main',
            addRight: '#root > .add.right',
            right: new StackRegion({el: '#right'}),
            alert: '#alert',
            dock: '#dock-container',
            modal: new ModalRegion({el: '#modal'})
        }
    }),

    getClass: function (clazz) {
        if ('string' === typeof clazz) {
            clazz = clazz.split('.');
            clazz = this[clazz[0]][clazz[1]];
        }
        return clazz;
    },

    widget: function (region, path, options) {
        return this.getClass(path).widget(region, options);
    },

    PageableCollection: Backbone.PageableCollection.extend({
        mode: 'infinite',

        initialize: function (models, options) {
            if (!options) {
                options = {};
            }
            var self = this;
            var query = _.merge(_.clone(this.query), options.query);
            Object.keys(_.omit(query, 'loading')).forEach(function (k) {
                self.queryParams[k] = function () {
                    var value = self.queryModel.get(k);
                    switch (typeof value) {
                        case 'number':
                            return value.toString();
                        case 'string':
                            return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
                        default:
                            return '';
                    }
                };
            });
            this.queryModel = new Backbone.Model(query);
        },

        state: {
            limit: 48,
            currentPage: 1,
            totalRecords: 2000
        },

        queryParams: {
            pageSize: 'limit',
            currentPage: null,
            totalPages: null,
            totalRecords: null,
            sortKey: 'sort',
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
            var name = /^\/api\/(\w+)/.exec(this.url);
            if (name) {
                records.forEach(function (record) {
                    record = _.clone(record);
                    ['source', 'target'].forEach(function (key) {
                        var value = record[key];
                        if (value && 'object' == typeof value) {
                            App.local.put('user', value);
                            record[key] = value._id;
                        }
                    });
                    App.local.put(name[1], record);
                });
            }
            return records;
        },

        delaySearch: function (cb) {
            var self = this;
            App.debounce(this, function search() {
                self.fullCollection.reset();
                var options = {};
                if (cb instanceof Function) {
                    options.success = cb;
                }
                self.getFirstPage(options);
            });
        },

        getPage: function (number, options) {
            if (!options) {
                options = {};
            }
            var self = this;
            if (!this.loading) {
                this.loading = true;
                this.trigger('start');
                _.before(options, 'complete', function () {
                    self.loading = false;
                    self.trigger('finish');
                });
                Backbone.PageableCollection.prototype.getPage.call(this, number, options);
            }
        }
    })
});

_.extend(Backbone.Validation.callbacks, {
    valid: function (view, attr) {
        return view.$el.report(attr, '', false);
    },
    invalid: function (view, attr, error) {
        return view.$el.report(attr, error, 'error');
    }
});

window.App = new Application();

function backHistory() {
    history.back();
}

App.Behaviors = {};

Marionette.Behaviors.behaviorsLookup = function () {
    return App.Behaviors;
};

function findStyleRules(selector, match) {
    if (false !== match) {
        match = true;
    }
    var rules = [];
    for (var i = 0; i < document.styleSheets.length; i++) {
        var styleSheet = document.styleSheets[i];
        for (var j = 0; j < styleSheet.cssRules.length; j++) {
            var rule = styleSheet.cssRules[j];
            if (rule.selectorText) {
                var s = rule.selectorText.trim().replace(/\s+/g, ' ');
                if (match ? s == selector : s.indexOf(selector)) {
                    rules.push(rule);
                }
            }
        }
    }
    return rules;
}

function is980() {
    return innerWidth > 980;
}

function resize() {
    if (App.isAuthenticated()) {
        App.debounce(resize, function () {
            $('#left, #right').toggleClass('visible', is980());
        });
        $('#root > .add, #left, #right')
            .on('mouseenter', function () {
                var selector = '#' + this.getAttribute('data-name');
                clearTimeout(resize._timer);
                resize._timer = setTimeout(function () {
                    if (!is980()) {
                        $(selector).addClass('visible');
                    }
                }, 800);
            })
            .on('mouseleave', function () {
                var selector = '#' + this.getAttribute('data-name');
                clearTimeout(resize._timer);
                resize._timer = setTimeout(function () {
                    if (!is980()) {
                        $(selector).removeClass('visible');
                    }
                }, 800);
            });
    }
}

App.on('login', resize);

window.addEventListener('resize', resize);

addEventListener('unload', function () {
    _.each(App.getView().getRegions(), function (region) {
        region.empty();
    });
});

function resolveRelative(model, map) {
    _.each(map, function (clazz, key) {
        var value = model.get(key);
        if (value) {
            if (!(value instanceof clazz) && _.isObject(value)) {
                if (_.is(clazz, Backbone.Collection)) {
                    assert.isArray(value);
                }
                model.set(key, new clazz(value));
            }
        }
        else if (_.is(clazz, Backbone.Collection)) {
            model.set(key, new clazz())
        }
    });
}

function loadRelative(model, map) {
    var promises = [];
    _.each(map, function (clazz, key) {
        var value = model.get(key);
        if (value) {
            if (value instanceof clazz) {
            }
            else if (value) {
                if ('object' === typeof value) {
                    model.set(key, new clazz(value))
                }
                else {
                    promises.push(new Promise(function (resolve, reject) {
                        App.local.getById(clazz.tableName, value)
                            .catch(reject)
                            .then(function (relative) {
                                relative = new clazz(relative);
                                model.set(key, relative);
                                resolve(relative);
                            });
                    }))
                }
            }
        }
        else if (_.is(clazz, Backbone.Collection)) {
            model.set(key, new clazz())
        }
    });
    return Promise.all(promises);
}
