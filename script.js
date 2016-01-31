var content = $$('.wrap > .container > .content');
var action;
var view;

addEventListener('popstate', function (e) {
    if (e.state) {
        go(e.state._, e.state.params);
    }
    else {
        console.warn('No history');
    }
});

function go(route, params) {
    if ('/' == route[0]) {
        route = route.slice(1);
    }
    var _url = route;
    var k = route.indexOf('?');
    var i;
    if (k >= 0) {
        var _params = route.slice(k + 1);
        route = route.slice(0, k);
        _params = _params.split('&');
        params = {};
        for (i = 0; i < _params.length; i++) {
            var param = _params[i].split('=');
            params[param[0]] = param[1];
        }
    }
    var parts = route.split('/');
    action = ui;
    for (i = 0; i < parts.length; i++) {
        action = action[parts[i]];
    }
    if (!action) {
        content.innerHTML = 'Route: ' + route + ' not found';
        return;
    }

    params = params || {};
    view = $id(route);
    if (view) {
        view = view.cloneNode(true);
        view.visible = false;
        content.innerHTML = '';
        content.appendChild(view);
        each(view.querySelectorAll('[data-id]'), function (el) {
            view[el.dataset.id] = el;
        });
        each(view.querySelectorAll('[data-action]'), function (el) {
            if ('fake' == el.dataset.action) {
                el.addEventListener('click', fake.bind(view));
            }
            el.addEventListener('click', function (e) {
                view.fire(this.dataset.action, e);
            });
        });
        view.templates = {};
        each(view.querySelectorAll('[data-widget]'), function (widget) {
            widget.remove();
            view.templates[widget.dataset.widget] = widget;
        });
        view.widget = function (name, data) {
            var w = this.templates[name].cloneNode(true);
            w.id = data._id;
            if (data) {
                each(w.querySelectorAll('[data-name]'), function (el) {
                    if (data[el.dataset.name]) {
                        el.innerHTML = data[el.dataset.name];
                    }
                });
            }
            return w;
        }
    }
    else {
        view = window;
    }
    action.call(view, params);
    var state = {_: route};
    if (!empty(params)) {
        state.params = params;
        _url += '?' + $.param(params);
    }
    history.pushState(state, document.title, '/' + _url);
}

var ui = {
    user: {
        login: function () {
            document.title = 'Login';
            this.on('submit', function () {
                query({
                    route: 'user/login',
                    form: this,
                    success: function (data) {
                        if (data.auth) {
                            document.cookie = 'auth=' + data.auth + '; path=/';
                            localStorage.user_id = data._id;
                        }
                        go('user/index')
                    }
                });
            });
            this.visible = true;
        },

        signup: function () {
            document.title = 'Singup';
            this.on('submit', function () {
                query({
                    route: 'user/signup',
                    form: this,
                    success: function () {
                        go('user/login')
                    }
                });
            });
            this.on('fake', function () {
                fake();
            });
            this.visible = true;
        },

        index: function () {
            document.title = 'Users';
            var self = this;
            query({
                route: 'entity/user',
                success: function (users) {
                    users.forEach(function (user) {
                        var w = self.widget('user', user);
                        w.appendChild($button('View', function () {
                            go('user/view', {id: this.parentNode.id});
                        }));
                        w.appendChild($button('Chat', function () {
                            go('chat', {target_id: this.parentNode.id});
                        }));
                        self.users.appendChild(w);
                    });
                    self.visible = true;
                }
            });
        },

        view: function (params) {
            var self = this;
            if (!params.id) {
                params.id = localStorage.user_id;
            }
            query({
                route: 'entity/user',
                params: params,
                success: function (doc) {
                    fill_form(self, doc);
                    self.on('delete', function () {
                        query.delete('user', params.id, function () {
                            go('user/index');
                        });
                    });
                    self.visible = true;
                }
            });
        },

        logout: function () {
            localStorage.removeItem('auth');
            localStorage.removeItem('user_id');
            go('user/login');
        }
    },

    chat: function (params) {
        document.title = 'Chat';
        var view = this;

        function add(message) {
            User.findOne(message.source_id, function (user) {
                view.messages.appendChild(view.widget('message', {
                    author: user.surname + ' ' + user.forename,
                    text: message.text
                }));
                view.messages.scrollTop = view.messages.scrollHeight;
            });
        }

        query({
            route: 'message/history', params: params, success: function (data) {
                view.visible = true;
                if (data.messages) {
                    User.find(Message.getUserIds(data.messages), function () {
                        data.messages.forEach(function (message) {
                            message.user = data.users[message.source_id];
                            add(message);
                        });
                    });
                }
            }
        });

        server.on('message', add);

        this.on('send', function () {
            var data = {
                source_id: localStorage.user_id,
                target_id: params.target_id,
                text: view.editor.value
            };
            query({
                method: 'POST',
                route: 'message/post',
                data: data,
                success: function (result) {
                    if (result.ok) {
                        add(data);
                    }
                }
            });
        });
    }
};

go(location.pathname.slice(1) || 'user/login');

var User = {
    //_cache: localStorage.users ? keyed(JSON.parse(localStorage.users)) : {},
    _cache: {},

    find: function (ids, call) {
        if (!(ids instanceof Array)) {
            ids = [ids];
        }
        var not_found = [];
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            if (!(id in User._cache)) {
                not_found.push(id);
            }
        }
        if (not_found.length > 0) {
            query({
                route: 'user/many', params: {ids: not_found.join('.')},
                success: function (data) {
                    for (var i = 0; i < data.length; i++) {
                        var user = data[i];
                        User._cache[user._id] = user;
                    }
                    call(User._cache);
                }
            });
        }
        else {
            call(User._cache);
        }
    },

    findOne: function (id, call) {
        User.find(id, function (users) {
            call(users[id]);
        });
    }
};

var Message = {
    getUserIds: function (messages) {
        var ids = [];
        messages.forEach(function (message) {
            if (ids.indexOf(message.source_id) < 0) {
                ids.push(message.source_id);
            }
            if (ids.indexOf(message.target_id) < 0) {
                ids.push(message.target_id);
            }
        });
        return ids;
    }
};


addEventListener('unload', function () {
    localStorage.setItem('users', JSON.stringify(array(User._cache)));
});


var listen = Function();

var auth = /auth=(\w+)/.exec(document.cookie);
auth = auth ? auth[1] : null;

var server = {};
extend(server, EventEmitter);

function pool() {
    var xhr = query({
        route: 'pool',
        success: function (data) {
            server.fire(data.type, data);
            setTimeout(pool, 3000);
        }
    });
    xhr.onerror = function () {
        setTimeout(pool, 3000);
    }
}

pool();
