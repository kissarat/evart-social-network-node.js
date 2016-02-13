'use strict';

var deviceEvents = {
    Orientation: function(e) {
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

    Proximity: function(e) {
        deviceInfo.Proximity = e.value;
    }
};

server.on('login', function () {
    document.querySelector('nav').visible = true;
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(function(p) {
            var c = p.coords;
            var geo = {
                ts: p.timestamp,
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

    for(var name in deviceEvents) {
        if ('Device' + name + 'Event' in window) {
            addEventListener('device' + name.toLocaleLowerCase(), deviceEvents[name]);
        }
    }

    if ('getBattery' in navigator) {
        navigator.getBattery().then(function(battery) {
            window.battery = battery;
        })
    }

    if (navigator.onLine) {
        $each('script[data-src]', function(script) {
            script.setAttribute('src', script.dataset.src);
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


    $each('nav [data-go]', function (tag) {
        tag.addEventListener('click', function () {
            go(tag.dataset.go);
        });
    });
});

function upload_photo(files, call) {
    var file = files[0];
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/photo?target_id=' + localStorage.user_id);
    xhr.setRequestHeader('Name', file.name);
    xhr.onload = function () {
        var remain = files.slice(1);
        if (call) {
            call.call(xhr, file, remain);
        }
        if (remain.length > 0) {
            upload_photo(remain, call);
        }
    };
    xhr.send(file);
}
