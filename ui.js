server.on('login', function () {
    document.querySelector('nav').visible = true;
});

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

    $each('[data-go]', function (tag) {
        tag.addEventListener('click', function () {
            go(tag.dataset.go);
        });
    });

    
});


