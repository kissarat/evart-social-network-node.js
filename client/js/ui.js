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
            return this.map(node => node.getAttribute(name));
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
