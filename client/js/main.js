"use strict";

_.extend(Element.prototype, {
    setBackground: function (id) {
        if (/^[\da-f]{24}$/.test(id)) {
            id = '/api/file?id=' + id;
        }
        if (id) {
            this.style.backgroundImage = 'url("' + id + '")';
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

_.extend(Backbone.ChildViewContainer.prototype, {
    clear: function () {
        var self = this;
        this.call(function () {
            self.remove(this);
        })
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
        complete: function (xhr) {
            var response = xhr.responseJSON;
            complete(response, xhr);
        }
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
                    App.local.add('errors', error);
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

        set language(value) {
            $.cookie('lang', value);
            var lang = _.find(Languages, {iso: value});
            if (lang) {
                this.cookie('remixlang', lang._id);
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

    PageableCollection: Backbone.PageableCollection.extend({
        mode: 'infinite',

        initialize: function (models, options) {
            if (!options) {
                options = {};
            }
            var self = this;
            var query = _.merge(this.query, options.query);
            this.queryModel = new Backbone.Model(query);
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
            // s: function () {
            //     var keys = [];
            //     _.each(this.queryModel.get('sort'), function (order, key) {
            //         if (order < 0) {
            //             key = '-key';
            //         }
            //         keys.push(key);
            //     });
            //     return keys.join('.');
            // }
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
    })
});

_.extend(Backbone.Validation.callbacks, {
    valid: function (view, attr) {
        return view.$el.report(attr, '', false);
    },
    invalid: function (view, attr, error) {
        return view.$el.report(attr, error, false);
    }
});

window.App = new Application();

// App.alert = function (type, message) {
//     document.write(message);
// };

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

App.on('login', function () {
    // if (App.user && 'admin' == App.user.type) {
        // var rule = findStyleRules('.admin')[0];
        // rule.style.removeProperty('display');
    // }
    setTimeout(function () {
        document.getElementById('left').classList.add('visible');
        document.getElementById('right').classList.add('visible');
    }, 300);
    setTimeout(function () {
        document.getElementById('dock-container').classList.add('visible');
    }, 1200);
});

function backHistory() {
    history.back();
}

addEventListener('unload', function () {
    _.each(App.getView().getRegions(), function (region) {
        region.empty();
    })
});

function loadRelative(model, map) {
    return Promise.all(_.pairs(map)
        .filter(function (relation) {
            return 'string' == typeof model.get(relation[0])
        })
        .map(function (relation) {
            return App.local.getById('user', model.get(relation[0]))
                .then(function (relative) {
                    model.set(relation[0], new relation[1](relative));
                })
        }));
}

function resolveRelative(model, map) {
    // if (!(model instanceof App.Message.Model)) {
    //     throw 'hello';
    // }
    _.each(map, function (modelClass, name) {
        var relative = model.get(name);
        if (relative && 'object' == typeof relative && !(relative instanceof modelClass)) {
            model.set(name, new modelClass(relative));
        }
    });
}
