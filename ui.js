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

    o.onmousemove = function (e) {
        o.tag.style.left = (o.start.left + (e.clientX - o.start.x)) + 'px';
        o.tag.style.top = (o.start.top + (e.clientY - o.start.y)) + 'px';
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
});
