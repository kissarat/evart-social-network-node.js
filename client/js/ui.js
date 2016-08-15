'use strict';

function $tag(name, attributes, children) {
    var tag = document.createElement(name);
    if ('string' === typeof attributes) {
        tag.value = attributes;
    }
    else {
        _.each(attributes, function (value, name) {
            if ('boolean' == typeof value) {
                tag[name] = value;
            }
            else {
                tag.setAttribute(name, value);
            }
        });
    }
    if ('string' === typeof children) {
        tag.innerHTML = children;
    }
    else {
        tag.append(children);
    }
    return tag;
}

function $$(selector) {
    return document.querySelector(selector);
}

function $all(selector) {
    return document.querySelectorAll(selector);
}

function $array(selector) {
    return [].slice.call(document.querySelectorAll(selector));
}

function $import(selector) {
    return document.importNode(document.querySelector(selector), true).content;
}

function $create(selector) {
    var root = $tag('div', {class: selector.replace('#view-', 'view ')});
    root.appendChild($import(selector));
    return root;
}

const NodeListPrototype = {
    on: 'addEventListener',
    off: 'removeEventListener',
    css: 'setProperty',

    show: function (display) {
        this.forEach(function (node) {
            if ('none' === node.style.display) {
                node.style.removeProperty('display');
            }
            else {
                node.style.display = display || node._display || 'block';
            }
        });
    },

    hide: function () {
        this.forEach(function (node) {
            node.style.display = 'none';
        });
    },

    attr: function (name, value) {
        if (value) {
            this.forEach(function (node) {
                node.setAttribute(name, value);
            });
        }
        else {
            return this.map(function (node) {
                node.getAttribute(name);
            });
        }
    }
};

_.each(NodeListPrototype, function (fn, name) {
    if ('string' === typeof fn) {
        NodeListPrototype[name] = function () {
            const args = arguments;
            this.forEach(function (node) {
                node[fn].apply(node, args);
            });
            return this;
        };
    }
});

_.setup = function (target, source) {
    Object.getOwnPropertyNames(source).forEach(function (key) {
        if (source[key] instanceof Function) {
            target[key] = source[key];
        }
    });
};

_.setup(NodeListPrototype, Array.prototype);
_.setup(NodeList.prototype, NodeListPrototype);

_.extend(EventTarget.prototype, {
    register: function (listeners) {
        for (var name in listeners) {
            this.addEventListener(name, listeners[name])
        }
        return this;
    },

    on: function (name, handler) {
        this.addEventListener(name, handler);
        return this;
    },

    once: function (name, handler) {
        function once() {
            handler.apply(this, arguments);
            this.removeEventListener(name, once);
        }

        this.on(name, once);
        return this;
    }
});

_.extend(Node.prototype, {
    $: function (selector) {
        return this.querySelector(selector);
    },

    append: function (children) {
        _.each(children, function (child) {
            if (child instanceof Node) {
                this.appendChild(child);
            }
            else {
                console.error(child);
            }
        }, this);
        return this;
    },

    $all: function (selector) {
        return _.toArray(this.querySelectorAll(selector));
    },

    $each: function (selector, cb) {
        return _.each(this.querySelectorAll(selector), cb);
    },

    clear: function () {
        this.textContent = '';
        return this;
    }
});

_.extend(Element.prototype, {
    getHeight: function () {
        var box = this.getBoundingClientRect();
        return box.height;
    },

    findParent: function (predicate) {
        var current = this;
        do {
            if (predicate(current)) {
                return current;
            }
        } while (current = current.parentNode);
        return null;
    }
});

jQuery.sendJSON = function (type, url, data, complete) {
    var options = {
        type: type,
        url: url,
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        data: JSON.stringify(data)
    };
    if (complete) {
        options.complete = function (xhr) {
            var response = xhr.responseJSON;
            complete(response, xhr);
        };
    }
    return this.ajax(options);
};

_.extend(jQuery.fn, {
    serialize: function () {
        return this[0].serialize();
    },

    busy: function (state) {
        return this.toggleClass('busy', state);
    },

    report: function (name, message, cssClass) {
        var parent = this.find('[name="' + name + '"]').parent();
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
    }
});

_.extend(Element.prototype, {
    setBackground: function (id) {
        if (/^[\da-f]{24}$/.test(id)) {
            id = '/api/file?id=' + id;
        }
        if (id) {
            this.style.backgroundImage = 'url("' + id + '")';
        }
    }
});

function backHistory() {
    history.back();
}

function findStyleRules(selector, match) {
    if (false !== match) {
        match = true;
    }
    var rules = [];
    for (var i = 0; i < document.styleSheets.length; i++) {
        var styleSheet = document.styleSheets[i];
        for (var j = 0; j < styleSheet.cssRules.length; j++) {
            var rule = styleSheet.cssRules[j];
            if (rule.selectorText) {
                var s = rule.selectorText.trim().replace(/\s+/g, ' ');
                if (match ? s == selector : s.indexOf(selector)) {
                    rules.push(rule);
                }
            }
        }
    }
    return rules;
}

function is980() {
    return innerWidth > 980;
}

function resize() {
    if (App.isAuthenticated()) {
        App.debounce(resize, function () {
            $('#left, #right').toggleClass('visible', is980());
        });
        $('#root > .add, #left, #right')
            .on('mouseenter', function () {
                var selector = '#' + this.getAttribute('data-name');
                clearTimeout(resize._timer);
                resize._timer = setTimeout(function () {
                    if (!is980()) {
                        $(selector).addClass('visible');
                    }
                }, 800);
            })
            .on('mouseleave', function () {
                var selector = '#' + this.getAttribute('data-name');
                clearTimeout(resize._timer);
                resize._timer = setTimeout(function () {
                    if (!is980()) {
                        $(selector).removeClass('visible');
                    }
                }, 800);
            });
    }
}
