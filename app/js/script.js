'use strict';

var content = $$('.root .content');
var action;
var view;

var client_id = /cid=(\w+)/.exec(document.cookie);
if (client_id) {
    client_id = client_id[0];
}

var config = {
    delay: {
        active: 1000,
        passive: 2000
    }
};

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

function sendParentWindow(data) {
    if (!isTopFrame()) {
        window.top.postMessage(data, '*');
        return true;
    }
    return false;
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

var Message = {
    getUserIds: function (messages) {
        var ids = [localStorage.user_id];
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


var auth = /auth=(\w+)/.exec(document.cookie);
auth = auth ? auth[1] : null;

var server = {
    send: function (target_id, body) {
        if (!body) {
            body = target_id;
        }
        else {
            body.target_id = target_id;
        }
        body.end = 0;
        return new Promise(function (resolve, reject) {
            api('poll', 'POST', body, resolve).onerror = reject;
        });
    },

    poll: function () {
        if (server._poll && 1 == server._poll.readyState) {
            return;
        }
        var o = {
            route: 'poll',
            success: function (data) {
                function fire(e) {
                    var last = cookies.get('last');
                    last = parseInt(last);
                    if (!isFinite(last)) {
                        last = 0;
                    }
                    cookies.set('last', Math.max(e.time, last), cookies.FOREVER);
                    if (worker) {
                        worker.post(e);
                    }
                    else {
                        server.fire(e.type, e);
                    }
                }

                if (data) {
                    switch (data.type) {
                        case 'empty':
                            break;
                        case 'queue':
                            data.queue.forEach(fire);
                            break;
                        default:
                            fire(data);
                    }
                }
                if (this.status < 400) {
                    schedule_poll();
                }
                else if (401 == this.status) {
                    server.on('login', schedule_poll);
                }
                else if (502 == this.status) {
                    schedule_poll(data ? data.delay : undefined);
                }
                else {
                    schedule_poll();
                }
            }
        };

        if (window.battery) {
            var batteryInfo = {
                c: battery.charging,
                l: battery.level
            };
            if (battery.chargingTime) {
                batteryInfo.t = battery.chargingTime;
            }
        }

        var xhr = query(o);
        xhr.onerror = function () {
            schedule_poll();
        };
        server._poll = xhr;
    }
};

extend(server, EventEmitter);

var me;

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
    });
}

if (localStorage.user_id && auth) {
    addEventListener('load', login);
}

addEventListener('load', function () {
    //if (navigator.onLine) {
    //    $each('script[data-src]', function (script) {
    //        script.setAttribute('src', script.dataset.src);
    //        delete script.dataset.src;
    //    })
    //}
    go((location.pathname.slice(1) + location.search)
        || (auth ? 'user/view?id=' + localStorage.user_id : 'user/login'));
    //if (isTopFrame() && '0' != localStorage.poll) {
    //    server.poll();
    //}
});

function stream() {
    navigator.getUserMedia({audio: true, video: true}, function (stream) {
            var recorder = new MediaRecorder(stream, 'video/vp8');
            recorder.ondataavailable = function (e) {
                query({
                    method: 'POST',
                    responseType: 'blob',
                    route: 'media/' + localStorage.user_id,
                    mime: recorder.mimeType,
                    data: e.data
                });
            };
            recorder.start(700);
        },
        morozov);
}

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

var worker;

if (isTopFrame() && window.SharedWorker) {
    worker = new SharedWorker('/js/worker.js');
    worker.addEventListener('error', function (e) {
        console.error(e);
        worker = null;
    });
    worker.port.addEventListener('message', function (e) {
        var message = JSON.parse(e.data);

        if (window_id == message.window_id) {
            switch (message.type) {
                case 'poll':
                    server.poll();
                    break;
            }
        }

        switch (message.type) {
            case 'list':
                console.log(e.data);
            case 'poll':
            case 'focus':
                break;
            default:
                server.fire(message.type, message);
                break;
        }
    });
    worker.port.start();
    worker.post = function (data) {
        if ('string' == typeof data) {
            data = {type: data};
        }
        data.window_id = window_id;
        this.port.postMessage(JSON.stringify(data));
    };
    worker.post('open');

    addEventListener('beforeunload', function () {
        if (!worker) {
            return;
        }
        worker.post('close');
    });

    document.addEventListener('visibilitychange', function () {
        if (!worker) {
            return;
        }
        worker.post({type: 'focus', visible: 'visible' == document.visibilityState});
    });

    //document.addEventListener(prefix + 'fullscreenchange', function () {
    //    worker.post({type: 'fullscreen', state: isFullscreen()});
    //});

    worker.list = function () {
        if (!worker) {
            return;
        }
        worker.post('list');
    }
}

function schedule_poll(delay) {
    var f = server.poll;
    if (worker) {
        f = function () {
            worker.post('poll');
        };
    }
    if (!delay) {
        delay = 'visible' == document.visibilityState
            ? config.delay.active : config.delay.passive;
    }
    setTimeout(f, delay);
    server._poll = null;
}
