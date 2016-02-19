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

function floating(o) {
    o = movable(o);
    o.tag.classList.add('floating');
    o.show = function () {
        o.tag.visible = true;
    };
    return o;
}

function movable(o) {
    if (o instanceof Element) {
        o = {tag: o};
    }

    o.onmousedown = function (e) {
        var box = o.tag.getBoundingClientRect();
        o.start = {
            left: box.left,
            top: box.top,
            x: e.clientX,
            y: e.clientY
        };
        o.tag.removeEventListener('mousedown', o.onmousedown);
        document.documentElement.addEventListener('mousemove', o.onmousemove);
        document.documentElement.addEventListener('mouseup', o.onmouseup);
    };
    var p = bounding(o.tag.previousElementSibling);
    var n = bounding(o.tag.nextElementSibling);

    o.onmousemove = function (e) {
        var offset;
        if ('x' != o.fixed) {
            offset = o.start.left + (e.clientX - o.start.x);
        }

        if ('y' != o.fixed) {
            offset = (o.start.top + (e.clientY - o.start.y));
            p.setAttribute('height', p.start.height + offset);
            n.setAttribute('height', n.start.height - offset);
        }
    };

    o.onmouseup = function () {
        o.tag.addEventListener('mousedown', o.onmousedown);
        document.documentElement.removeEventListener('mousemove', o.onmousemove);
        document.documentElement.removeEventListener('mouseup', o.onmouseup);
    };

    o.tag.addEventListener('mousedown', o.onmousedown);
    return o;
}

var command = {
    fake: fake,
    emoji: floating(emoji).show
};

document.addEventListener('DOMContentLoaded', function () {
    $each('autoremove', function (tag) {
        tag.remove();
    });

    $each('movable', function (tag) {
        movable({
            tag: tag,
            fixed: tag.dataset.fixed
        });
    });
});

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
