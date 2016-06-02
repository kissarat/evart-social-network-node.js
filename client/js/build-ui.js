"use strict";

addEventListener('load', function () {
    if (matchMedia('min-width(769px)')) {
        var leftMenu = new App.Views.VerticalMenu();
        leftMenu.$el.hide();
        App.addLeftRegion.show(leftMenu);
        var rightMenu = new App.Views.VerticalMenu();
        rightMenu.$el.hide();
        App.addRightRegion.show(rightMenu);
        $('#root > .add').click(function (e) {
            var isLeft = this.classList.contains('left');
            (isLeft ? leftMenu : rightMenu).$el.toggle();
            (!isLeft ? leftMenu : rightMenu).$el.hide();
        });
    }

    $('#dock a')
        .click(function (e) {
            var href, region, widget;
            e.preventDefault();
            region = this.getAttribute('data-open');
            href = this.getAttribute('href');
            widget = App.widgets[href.slice(1)];
            if (region && widget) {
                $('#' + region).show();
                region = App[region + 'Region'];
                return widget(null, region);
            } else {
                return App.navigate(href);
            }
        })
        .on('mouseover', function () {
            _.each(document.querySelectorAll('#dock a.prev'), function (prev) {
                return prev.classList.remove('prev');
            });
            if (this.getAttribute('href')) {
                return this.classList.add('prev');
            }
        });

    $(document).ajaxError(function (_1, ajax) {
        switch (ajax.status) {
            case code.UNAUTHORIZED:
                App.navigate('/login');
                break;
            default:
                if (ajax.responseJSON && ajax.responseJSON.error) {
                    var error = ajax.responseJSON.error;
                    App.alert('danger', error.message ? error.message : error);
                }
        }
    });
});

function preventDefault(e) {
    e.preventDefault();
}

Element.prototype.setBackground = function (id) {
    if (/^[\da-f]{24}$/.test(id)) {
        id = '/photo/' + id + '.jpg'
    }
    if (id) {
        this.style.backgroundImage = 'url("' + id + '")';
    }
    else if (this.style.backgroundImage) {
        this.style.removeProperty('background-image');
    }
};

Element.prototype.findParent = function (predicate) {
    var current = this;
    do {
        if (predicate(current)) {
            return current;
        }
    } while (current = current.parentNode);
    return null;
};

function register(target, listeners) {
    var _add = target.addEventListener || target.on;
    for (var name in listeners) {
        _add.call(target, name, listeners[name])
    }
}

function react(target, getter, listeners) {
    for (var name in listeners) {
        var listener = listeners[name];
        target.on(name, (function () {
            this.apply(getter.apply(target, arguments), arguments);
        }).bind(listener));
    }
}

function logPromise(p) {
    return p.then(function (result) {
            console.log('RESOLVE', result);
        },
        function (error) {
            console.error('REJECT', error);
        });
}

jQuery.sendJSON = function (type, url, data, complete) {
    return this.ajax({
        type: type,
        url: url,
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        data: JSON.stringify(data),
        complete: complete
    });
};

jQuery.fn.serialize = function () {
    return this[0].serialize();
};

jQuery.fn.busy = function (state) {
    return this.toggleClass('busy', state);
};

jQuery.fn.report = function (name, message, cssClass) {
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
};

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

window.responses = {};

Backbone.Model.prototype.toString = function () {
    return this.get('_id');
};

Backbone.Model.prototype.wrapModel = function () {
    return function (key, cb) {
        var value;
        value = this.get(key);
        if (value && 'object' === typeof value && !_instanceof(value, Backbone.Model)) {
            return this.set(key, cb(value));
        }
    };
};

function _instanceof(instance, clazz) {
    return instance instanceof clazz;
}

function _is(child, parent) {
    return child.__super__ && (child.__super__.constructor == parent || _is(child.__super__, parent))
}

function _get(name) {
    var regex = new RegExp(name + '=([^&]+)');
    if (regex.test(location.search)) {
        return regex.exec(location.search)[1];
    }
    return null
}

Object.defineProperties(App, {
    route: {
        get: function () {
            return location.pathname.split('/').slice(1);
        }
    }
});
