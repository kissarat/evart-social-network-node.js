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
                            localStorage.auth = data.auth;
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
            this.on('fake', function() {
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
                        w.appendChild($button('View', function() {
                            go('user/view', {_id:this.parentNode.id});
                        }));
                        self.users.appendChild(w);
                    });
                    self.visible = true;
                }
            });
        },

        view: function(params) {
            var self = this;
            if (!params._id) {
                params._id = localStorage.user_id;
            }
            query({
                route: 'entity/user',
                params: params,
                success: function (users) {
                    if (1 == users.length) {
                        fill_form(self, users[0]);
                    }
                    else {
                        self.innerHTML = users.length + ' users found';
                    }
                    self.visible = true;
                }
            });
        },

        logout: function() {
            localStorage.removeItem('auth');
            localStorage.removeItem('user_id');
            go('user/login');
        }
    },

    chat: function () {
        document.title = 'Chat';
        //query({route:''})
        this.messages.appendChild(this.widget('message', {author: 'a'}));
        this.messages.appendChild(this.widget('message'));
        this.visible = true;
    }
};

go(location.pathname.slice(1) || 'user/login');
