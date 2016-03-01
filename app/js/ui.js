'use strict';

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
