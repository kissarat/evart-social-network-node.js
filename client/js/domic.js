"use strict";

function domic(name, object) {
    if (!object) {
        object = name;
        name = document.body;
    }
    var element = name instanceof Element ? name : document.createElement(name);

    function bind(element, property, attribute) {
        if (!attribute) {
            attribute = 'value';
        }
        element.dataset[attribute] = property;
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
            });
        }
    }
    return element;
}

domic.tag = function (name, attributes, children) {
    var tag = document.createElement(name);
    if ('string' === typeof attributes) {
        tag.value = attributes;
    }
    else if (attributes) {
        for(var key in attributes) {
            var value = attributes[key];
            if ('boolean' == typeof value) {
                tag[key] = value;
            }
            else {
                tag.setAttribute(name, value);
            }
        }
    }
    if ('string' === typeof children) {
        tag.innerHTML = children;
    }
    else {
        tag.append(children);
    }
    return tag;
};

domic.update = function (element, changes) {
    if (!changes) {
        changes = element;
        element = document.body;
    }

    function _update(element) {
        var children;
        if (element.dataset.children) {
            var childrenName = element.dataset.children;
            if (childrenName in changes) {
                var template = element.dataset.template
                    ? document.querySelector(element.dataset.template)
                    : element.querySelector('template');
                if (!template) {
                    throw new Error('Template not found');
                }
                var fragment = document.createDocumentFragment();
                children = changes[childrenName];
                if (children) {
                    children.forEach(function (object) {
                        var child;
                        if (object.id) {
                            child = element.querySelector('[data-id="' + object.id + '"]');
                        }
                        if (!child) {
                            child = document.createElement(element.dataset.tag || 'div');
                            child.appendChild(document.importNode(template, true).content);
                            if (object.id) {
                                child.dataset.id = object.id;
                            }
                            fragment.appendChild(child);
                        }
                        domic.update(child, object);
                    });
                }
                else {
                    element.innerHTML = '';
                }
                element.appendChild(fragment);
            }
        }
        else {
            for (var attribute in element.dataset) {
                var key = element.dataset[attribute];
                var value = changes[key];
                if (key in changes) {
                    if ('value' == attribute) {
                        if ('value' in element) {
                            element.value = value;
                        }
                        else {
                            element.innerHTML = value;
                        }
                    }
                    else {
                        element.setAttribute(attribute, value);
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
