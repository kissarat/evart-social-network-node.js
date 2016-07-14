function domic(name, object) {
    var element = name instanceof Element ? name : document.createElement(name);

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
                            item.innerHTML = v || '';
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
                element.setAttribute(key, value);
                break;
            case 'boolean':
                element.setAttribute(key, '');
                break;
        }
    }

    for(key in object) {
        value = object[key];
        if (key.indexOf(' ') >= 0) {
            var children = element.querySelectorAll(key);
            children.forEach(function (child) {
                if (value instanceof Function) {
                    value(child);
                }
                else if (value && 'object' == typeof value) {
                    domic(child, value);
                }
                else {
                    child.innerHTML = value || '';
                }
            })
        }
    }
    return element;
}
