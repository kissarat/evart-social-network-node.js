"use strict";

function domic(name, object) {
    if (!object) {
        object = name;
        name = document.body;
    }
    var element = name instanceof Element ? name : document.createElement(name);

    function bind(element, property, attribute) {
        element.dataset[property] = attribute || 'value';
    }

    for (var key in object) {
        var value = object[key];
        if (!value || key.indexOf(' ') >= 0) {
            continue;
        }
        if (value instanceof Function) {
            if (0 === key.indexOf('on')) {
                element.addEventListener(key.slice(2).toLocaleLowerCase(), value);
                continue;
            }
            value = value(key, element);
        }
        if (!key && '$' != value[0]) {
            element.innerHTML = value;
            continue;
        }
        switch (typeof value) {
            case 'object':
                if ('number' === typeof value.length) {
                    for (var i = 0; i < value.length; i++) {
                        var v = value[i];
                        if (v && 'object' == typeof v) {
                            element.appendChild(domic(key, v));
                        }
                        else {
                            var item = document.createElement(key);
                            if (v) {
                                if (('string' == typeof v) && '$' == v[0]) {
                                    bind(item, v.slice(1));
                                }
                                else {
                                    item.innerHTML = v;
                                }
                            }
                            element.appendChild(item);
                        }
                    }
                }
                else {
                    element.appendChild(domic(key, value));
                }
                break;
            case 'number':
            case 'string':
                if ('$' === value[0]) {
                    bind(element, value.slice(1), key);
                }
                else {
                    element.setAttribute(key, value);
                }
                break;
            case 'boolean':
                element.setAttribute(key, '');
                break;
        }
    }

    for (key in object) {
        value = object[key];
        if (key.indexOf(' ') >= 0) {
            var children = element.querySelectorAll(key);
            children.forEach(function (child) {
                if (value instanceof Function) {
                    value(child);
                }
                else if (value) {
                    if ('object' == typeof value) {
                        if (value instanceof Element) {
                            child.appendChild(value.cloneNode(true));
                        }
                        else {
                            domic(child, value);
                        }
                    }
                    else if (('string' == typeof value) && '$' == value[0]) {
                        bind(child, value.slice(1));
                    }
                    else {
                        child.innerHTML = value;
                    }
                }
            })
        }
    }
    return element;
}

domic.import = function() {
    return document.importNode(document.querySelector(selector), true).content;
};

domic.update = function (element, changes) {
    if (!changes) {
        changes = element;
        element = document.body;
    }

    function _update(element) {
        var children;
        if (element.dataset.children) {
            if (element.dataset.children in changes) {
                var template = document.querySelector(element.dataset.template);
                var fragment = document.createDocumentFragment();
                children = changes[element.dataset.children];
                children.forEach(function (object) {
                    var child;
                    if (object.id) {
                        child = element.querySelector('[data-id="' + object.id + '"]')
                    }
                    if (!child) {
                        child = document.createElement('div');
                        child.appendChild(document.importNode(template, true).content);
                        if (object.id) {
                            child.dataset.id = object.id;
                        }
                        fragment.appendChild(child);
                    }
                    domic.update(child, object);
                });
                element.appendChild(fragment);
            }
        }
        else {
            for (var key in changes) {
                var attribute = element.dataset[key];
                if (attribute) {
                    if ('value' == attribute) {
                        element.innerHTML = changes[key];
                    }
                    else {
                        element.setAttribute(key, changes[key]);
                    }
                }
            }
            if (element.childNodes.length > 0) {
                children = element.childNodes;
                for (var i = 0; i < children.length; i++) {
                    var child = children.item(i);
                    if (child instanceof Element) {
                        _update(child);
                    }
                }
            }
        }
    }

    _update(element, changes);
};

domic.trace = function (element, useCapture) {
    if ('string' == typeof element) {
        element = document.querySelector(element);
    }
    element.addEventListener('update', function () {
        console.log(this.innerHTML);
    }, useCapture);
    var array = element.childNodes;
    for (var i = 0; i < array.length; i++) {
        var child = array[i];
        if (child instanceof Element) {
            domic.trace(child, useCapture);
        }
    }
};
