'use strict';

var me;

if (!isTopFrame()) {
    $$('.root .content').classList.remove('col-sm-10');
    document.body.classList.remove('z');
}

var deviceEvents = {
    Orientation: function (e) {
        deviceEvents.Orientation = {
            a: e.absolute,
            o: [e.beta, e.gamma]
        };
        if (e.alpha) {
            deviceEvents.Orientation.o.push(e.alpha);
        }
    },

    Light: function (e) {
        deviceInfo.Light = e.value;
    },

    Proximity: function (e) {
        deviceInfo.Proximity = e.value;
    }
};

server.on('login', function () {
    if (!isTopFrame()) {
        return;
    }
    document.querySelector('nav').visible = true;
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(function (p) {
            var c = p.coords;
            var geo = {
                //ts: p.timestamp,
                p: [c.latitude, c.longitude]
            };

            if (c.altitude) {
                geo.p.push(c.altitude);
            }

            if (c.speed) {
                geo.s = c.speed;
            }

            if (c.heading) {
                geo.h = c.heading;
            }
            deviceInfo.Geo = geo;
        });
    }

    for (var name in deviceEvents) {
        if ('Device' + name + 'Event' in window) {
            addEventListener('device' + name.toLocaleLowerCase(), deviceEvents[name]);
        }
    }

    if ('getBattery' in navigator) {
        navigator.getBattery().then(function (battery) {
            window.battery = battery;
        })
    }
});

var deviceInfo = {};
var battery;
var command = {
    fake: fake
};

function ajax_queue(arr, call) {
    if (!(arr instanceof Array)) {
        arr = array(arr);
    }
    arr.reverse();

    function ajax() {
        var el = arr.pop();
        if (el) {
            var xhr = new XMLHttpRequest();
            call.call(xhr, el);
            xhr.addEventListener('load', ajax);
        }
        else {
            call();
        }
    }

    ajax();
}

function upload_photo(album_id, files, call) {
    ajax_queue(files, function (file) {
        if (!file) {
            return call();
        }
        this.open('PUT', '/api/photo');
        this.setRequestHeader('Name', file.name);
        this.setRequestHeader('Album', album_id);
        if (localStorage.delay) {
            this.setRequestHeader('Delay', localStorage.delay);
        }
        call.call(this, file);
        this.send(file);
    });
}

addEventListener('keydown', function (e) {
    if (KeyCode.ESCAPE == e.keyCode) {
        var fullscreen = $$('.fullscreen.active');
        if (fullscreen) {
            fullscreen.classList.remove('active');
        }
    }

    if (hook.delete && KeyCode.DELETE == e.keyCode) {
        hook.delete();
    }
});

function tabs(root) {
    root.querySelector('[data-open]:first-child').classList.add('active');
    root.querySelector('[data-tab]:first-child').classList.add('active');

    each(root.querySelectorAll('[data-open]'), function (item) {
        item.addEventListener('click', function () {
            if (item.classList.contains('active')) {
                return;
            }
            each(root.querySelectorAll('.active'), function (active) {
                active.classList.remove('active');
            });
            item.classList.add('active');
            root.querySelector('[data-tab="' + item.dataset.open + '"]').classList.add('active');
        });
    })
}

extend(window, EventEmitter);

function Frame() {
    var self = this;
    this.tag = $id('frame');
    this.iframe = this.tag.querySelector('iframe');
    this.close = this.close.bind(this);
    this.tag.querySelector('.fa-close').addEventListener('click', this.close);
    this.close();

    this.iframe.addEventListener('load', function () {
        self.fire('load');
        self.tag.visible = true;
    });
    window.addEventListener('message', function (e) {
        self.fire(e.data.type, e.data);
    });
}

Frame.prototype = {
    close: function () {
        this.tag.visible = true;
        this.tag.remove();
    },

    set source(value) {
        if (this.iframe.getAttribute('src') && this.iframe.contentWindow.go) {
            this.iframe.contentWindow.go(value);
        }
        else {
            this.iframe.setAttribute('src', value);
        }
    },

    get hook() {
        return this.iframe.contentWindow.hook;
    },

    get window() {
        return this.iframe.contentWindow;
    }
};

extend(Frame.prototype, EventEmitter);

var frame = new Frame();

var emoji = $$('#lib #wall .emoji');
for (var i = 0; i < 55; i++) {
    var char = String.fromCodePoint(0xd83d, 0xde00 + i);
    emoji.appendChild($new('span', char));
}

function inform(o, text) {
    if (text) {
        o = {
            type: o,
            text: text
        };
    }
    if (!o.type) {
        o.type = 'info';
    }
    var button = $add($new('button', {type: 'button', class: 'close', 'data-dismiss': 'alert', 'aria-label': 'Close'}),
        $new('span', {'aria-hidden': true}, '&times;'));
    var informer = $add($new('div', {class: 'alert alert-dismissible fade in alert-' + o.type, type: 'alert'}),
        button,
        document.createTextNode(o.text)
    );
    $$('.alerts').appendChild(informer);
}
var content = $$('.root .content');
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

function append_content(route, params, push) {
    if ('/' == route[0]) {
        route = route.slice(1);
    }
    var _url = route;
    var k = route.indexOf('?');
    var i;
    if (k >= 0) {
        var _params = _url.slice(k + 1);
        route = _url.slice(0, k);
        _params = _params.split('&');
        params = {};
        for (i = 0; i < _params.length; i++) {
            var param = _params[i].split('=');
            params[param[0]] = param[1];
        }
    }
    var parts = route.split('/');

    function action_get() {
        var action = ui;
        for (i = 0; i < parts.length; i++) {
            action = action[parts[i]];
            if ('string' == typeof action) {
                return action;
            }
        }
        return action;
    }

    var action = action_get();

    if (!action) {
        content.innerHTML = 'Route: ' + route + ' not found';
        return;
    }

    params = params || {};

    function load(action) {
        view = $$('#lib #' + route.replace(/\//g, '\\/'));
        if (view) {
            view = view.cloneNode(true);
            view.visible = false;
            content.appendChild(view);
            Object.defineProperties(view, {
                title: {
                    set: function (value) {
                        var content_container = $$('.root .col-sm-10');
                        if (!content_container) {
                            return console.error('Container not found');
                        }
                        var h1 = content_container.querySelector('h1');
                        if (!h1) {
                            h1 = $new('h1');
                            content_container.prependChild(h1);
                        }
                        h1.innerHTML = value;
                        document.title = value ? value.replace(/<.*>/g, '-') : 'Socex';
                    }
                }
            });
            each(view.querySelectorAll('[data-id]'), function (el) {
                view[el.dataset.id] = el;
            });
            each(view.querySelectorAll('[data-action]'), function (el) {
                for (var action in command) {
                    if (action == el.dataset.action) {
                        el.addEventListener('click', command[action].bind(view));
                    }
                }
                el.addEventListener('click', function (e) {
                    view.fire(this.dataset.action, e);
                });

                if ('BUTTON' == el.tagName) {
                    el.setAttribute('type', 'button');
                }
                else {
                    el.style.cursor = 'pointer';
                }
                view[el.dataset.action] = el;
            });
            view.templates = {};
            each(view.querySelectorAll('[data-widget]'), function (widget) {
                widget.remove();
                view.templates[widget.dataset.widget] = widget;
            });

            each(view.querySelectorAll('[data-go]'), function (tag) {
                tag.params = {};
                tag.addEventListener('click', function () {
                    var params = {};
                    if (tag.dataset.params) {
                        tag.dataset.params.split(',').forEach(function (param) {
                            param = param.split('=');
                            if (1 == param.length && location.params[param[0]]) {
                                param.push(location.params[param[0]]);
                            }
                            params[param[0]] = param[1];
                        });
                        go(tag.dataset.go, merge(params, tag.params));
                    }
                    else {
                        go(tag.dataset.go, tag.params);
                    }
                });
            });

            $each('.tabs', tabs);

            view.widget = function (name, data) {
                var w = this.templates[name].cloneNode(true);
                if (data) {
                    if (data._id) {
                        w.id = data._id;
                    }
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

        view.title = null;

        if (!empty(params)) {
            _url = route + '?' + $.param(params);
        }

        if (action && action.call) {
            action.call(view, params);
        }
        else {
            inform('danger', 'Wrong action: ' + _url);
            return;
        }

        if (true === push) {
            location.route = parts;
            location.controller = parts[0];
            if (parts.length >= 2) {
                location.action = parts[1];
            }
            else {
                delete location.action;
            }
            location.params = params;
            var state = {_: route};
            if (!empty(params)) {
                state.params = params;
            }
            _debug(_url);
            history.pushState(state, document.title, '/' + _url);
        }

        return view;
    }

    return new Promise(function (resolve, reject) {
        if ('string' == typeof action) {
            $script('js/' + action, function () {
                resolve(load(action_get()));
            });
        }
        else {
            resolve(load(action));
        }
    });
}

function go(route, params) {
    content.innerHTML = '';
    hook = {};
    return append_content(route, params, true).then(function (view) {
        window.fire('go', view);
        sendParentWindow({type: 'go'});
    })
}

function reload(data) {
    if (data && !data.n) {
        alert('Not found');
    }
    go(location.route.join('/'), location.params);
}

var Dialog = {
    confirm: function (text, call) {
        if (!text) {
            text = 'Are you sure?';
        }
        if (confirm(text)) {
            call();
        }
    }
};

var hook = {};

var ui = {
    wall: 'wall.js',
    user: 'user.js',
    chat: 'chat.js',
    video: 'video.js',
    photo: 'photo.js',
    message: 'message.js',
    file: 'file.js',
    admin: function () {
        var view = this;
        api('admin', 'GET', {}, function (data) {
            data.forEach(function (row) {
                var route = 'string' == typeof row.route ? row.route : row.route.join('/');
                var items = [
                    '<strong>' + route + '</strong>',
                    row.method, row.code,
                    '<i>' + new Date(row.time).toLocaleString() + '</i>',
                    row.client_id
                ];
                view.rows.appendChild($row(items.join('<br />'),
                    row.body ? $new('pre', JSON.stringify(row.body, null, "  ")) : ''));
            });
            view.visible = true;
        })
    }
};

extend(ui, EventEmitter);

function Notify(comment) {
    var user = comment.user;
    var title = user ? (user.surname + ' ' + user.forename) : comment.title;
    var self = this;
    var options = {
        body: comment.text
    };
    if (isFirefox) {
        options.sticky = true;
    }
    if (!window.Notification || '0' == localStorage.notify) {
        return;
    }
    var n = new Notification(title, options);
    n.addEventListener('click', function () {
        var message = {
            type: comment.type
        };
        ['chat_id', 'owner_id', 'target_id'].forEach(function (field) {
            if (comment[field]) {
                message[field] = comment[field];
                return false;
            }
        });
        go('wall', message);
        Notify.close();
    });
    self.notification = n;
    if (!Notify._list) {
        Notify._list = {};
    }
    Notify._list[comment._id] = n;
}

Notify.close = function () {
    var list = Notify._list;
    for (var id in list) {
        list[id].close();
        delete list[id];
    }
};

function login() {
    User.loadMe(function () {
        $each('nav [data-go]', function (tag) {
            tag.addEventListener('click', function () {
                if (tag.dataset.idparam) {
                    var params = {};
                    params[tag.dataset.idparam] = localStorage.user_id;
                    go(tag.dataset.go, params);
                }
                else {
                    go(tag.dataset.go);
                }
            });
        });
        server.fire('login');
        go((location.pathname.slice(1) + location.search)
            || (auth ? 'user/view?id=' + localStorage.user_id : 'user/login'));
    });
}

addEventListener('load', function () {
    if (localStorage.user_id && auth) {
       login();
    }
    else {
        go('user/login');
    }
});
