'use strict';

// Opera 8.0+
var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
// Firefox 1.0+
var isFirefox = typeof InstallTrigger !== 'undefined';
// At least Safari 3+: "[object HTMLElementConstructor]"
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
// Internet Explorer 6-11
var isIE = /*@cc_on!@*/false || !!document.documentMode;
// Edge 20+
var isEdge = !isIE && !!window.StyleMedia;
// Chrome 1+
var isChrome = !!window.chrome && !!window.chrome.webstore;
// Blink engine detection
var isBlink = (isChrome || isOpera) && !!window.CSS;

var features = [
    'navigator.getUserMedia',
    'MediaDevices.getUserMedia',
    'navigator.getBattery',
    'navigator.serviceWorker',
    'MediaSource',
    'MediaStream',
    'RTCPeerConnection',
    'RTCSessionDescription',
    'RTCIceCandidate',
    'AudioContext',
    'GestureEvent',
    'PointerEvent',
    'TouchEvent',
    'WindowWidget',
    'openDatabase',
    'applicationCache',
    'WebSocket',
    'Element.prototype.requestPointerLock',
    'Element.prototype.requestFullscreen',
    'Element.prototype.matchesSelector',
    'sessionStorage',
    'localStorage',
    'Crypto',
    'screen.keepAwake',
    'navigator.webdriver',
    'ScreenOrientation',
    'GamepadEvent',
    'ClipboardEvent',
    'PushManager',
    'Worker',
    'requestAnimationFrame',
    'requestFileSystem',
    'SpeechRecognition'
];

var prefix = '';

if (isFirefox) {
    prefix = 'moz';
}

if (isChrome) {
    prefix = 'webkit';
}

var prefixes = ['', 'webkit', 'moz'];
var detected = {};

for (var i = 0; i < features.length; i++) {
    var parts = features[i].split('.');
    var detected_parts = [];
    var obj = window;
    part: for (var j = 0; j < parts.length; j++) {
        var part = parts[j];
        for (var k = 0; k < prefixes.length; k++) {
            var key = prefixes[k];
            if (key.length > 0) {
                key += part[0].toUpperCase() + part.slice(1);
            }
            else {
                key = part;
            }
            if (key in obj) {
                if (key != part) {
                    obj[part] = obj[key];
                }
                obj = obj[key];
                detected_parts.push(key);
            }
            if (!obj) {
                break part;
            }
        }
    }
    if (parts.length == detected_parts.length) {
        detected[features[i]] = detected_parts.join('.');
    }
}

function isTopFrame() {
    return self == top;
}

function isFullscreen() {
    return (0 == screenLeft)
        && (0 == screenTop);
    //&& (screen.width == innerWidth)
    //&& (screen.height == innerHeight);
}

function unsafe_uid() {
    return Math.round(Math.random() * 1679615).toString(36);
}

var window_id = unsafe_uid();

function $$(selector) {
    return document.querySelector(selector)
}
function $id(id) {
    return document.getElementById(id)
}
function $all(selector) {
    return document.querySelectorAll(selector)
}
function $class(name) {
    return document.getElementsByClassName(name)
}
function $new(name, attributes, children, click) {
    var tag = document.createElement(name);
    if (attributes) {
        if ('string' == typeof attributes) {
            tag.innerHTML = attributes;
        }
        else {
            for (var key in attributes) {
                tag.setAttribute(key, attributes[key]);
            }
        }
    }
    if (children) {
        if ('string' == typeof children) {
            tag.innerHTML = children;
        }
        else if (children instanceof Function) {
            tag.addEventListener('click', children);
        }
        else {
            for (var i in children) {
                tag.appendChild(children[i]);
            }
        }
    }

    if (click) {
        tag.addEventListener('click', click);
    }
    return tag;
}

function $fa(name, confirm_text, call) {
    if (call) {
        var _call = call;
        call = function () {
            Dialog.confirm(confirm_text, _call);
        }
    }
    else {
        call = confirm_text;
    }
    return $new('div', {class: 'button fa fa-' + name}, call);
}

function $content(text) {
    var tag = document.createElement('div');
    tag.innerHTML = text;
    return tag;
}

function $add(parent) {
    for (var i = 1; i < arguments.length; i++) {
        parent.appendChild(arguments[i]);
    }
    return parent;
}

function on(target, name, call) {
    if (!call) {
        call = name;
        name = 'click';
    }
    if ('string' == typeof target) {
        target = document.querySelectorAll(target);
        for (var i = 0; i < target.length; i++)
            target[i].addEventListener(name, call);
    }
    else {
        target.addEventListener(name, call);
    }
}

function $a(label, url) {
    var a = $new('a');
    a.setAttribute('href', url);
    a.innerHTML = label;
    return a;
}

function $script(url, load) {
    var script = $new('script', {src: '/' + url});
    script.addEventListener('load', load);
    document.head.appendChild(script);
    return script;
}

function $row() {
    var row = $new('tr');
    console.log(arguments);
    for (var i = 0; i < arguments.length; i++) {
        var cell = arguments[i];
        if (cell instanceof HTMLTableCellElement) {
            row.appendChild(cell);
        }
        else if (cell instanceof Element) {
            row.insertCell(-1).appendChild(cell);
        }
        else if ('string' == typeof cell) {
            row.insertCell(-1).innerHTML = cell;
        }
        else {
            row.insertCell(-1).innerHTML = cell.toString();
        }
    }
    return row;
}

function each(array, call) {
    Array.prototype.forEach.call(array, call);
}

function keyed(array) {
    var object = {};
    for (var i = 0; i < array.length; i++) {
        object[array[i]._id] = array[i];
    }
    return object;
}

function array(a) {
    if (a.length) {
        return Array.prototype.slice.call(a);
    }
    else {
        var b = [];
        for (var key in a) {
            b.push(a[key]);
        }
        return b;
    }
}

function empty(object) {
    for (var key in object) {
        return false;
    }
    return true;
}

function $each(selector, call) {
    if ('string' == typeof selector) {
        selector = $all(selector);
    }
    return each(selector, call);
}

function fill_form(form, data) {
    each(form.elements, function (element) {
        if (element.getAttribute('name') in data) {
            element.value = data[element.getAttribute('name')];
        }
    });
}

function fake() {
    var form = this;
    if (!(this instanceof HTMLFormElement && this.getAttribute('name'))) {
        return;
    }
    query({
        route: 'fake/' + this.getAttribute('name'), success: function (data) {
            fill_form(form, data);
        }
    });
}

Object.defineProperty(Element.prototype, 'visible', {
    get: function () {
        return 'none' != this.style.display
    },
    set: function (value) {
        if (value) {
            this.style.removeProperty('display');
        }
        else {
            this.style.display = 'none';
        }
    }
});

function morozov(a) {
    console.log(a);
}

function _error(a) {
    console.error(a);
}

HTMLFormElement.prototype.getData = function () {
    var data = {};
    for (var i = 0; i < this.elements.length; i++) {
        var element = this.elements[i];
        if (element.getAttribute('name')) {
            data[element.getAttribute('name')] = element.value;
        }
    }
    return data;
};

function query(o) {
    o.url = '/api';

    if (!o.method) {
        o.method = (o.data || o.body) ? 'POST' : 'GET';
    }

    if (o.form) {
        o.body = o.form.getData();
        delete o.form;
    }

    o.params = o.params || {};
    if (o.route instanceof Array) {
        o.route = o.route.join('/');
    }
    if (localStorage.auth) {
        o.params['auth'] = localStorage.auth;
    }
    var xhr = new XMLHttpRequest();

    xhr.addEventListener('loadend', function () {
        var delay = xhr.getResponseHeader('delay');
        if (delay) {
            config.delay = JSON.parse(delay);
        }
        if (o.success) {
            var response;
            try {
                response = JSON.parse(this.responseText);
            }
            catch (ex) {

            }
            o.success.call(xhr, response);
        }
    });

    var url = o.url + '/' + o.route;
    if (!empty(o.params)) {
        url += '?' + $.param(o.params);
    }

    if (!o.method && (o.body || o.data)) {
        o.method = 'POST';
    }

    xhr.open(o.method, url);

    if (o.mime) {
        xhr.overrideMimeType(o.mime)
    }
    if (o.responseType) {
        xhr.responseType = o.responseType;
    }

    var name;
    if (o.headers) {
        for (name in o.headers) {
            xhr.setRequestHeader(name, o.headers[name]);
        }
    }

    if (window.deviceInfo) {
        for (name in deviceInfo) {
            var value = deviceInfo[name];
            if (value) {
                if (value instanceof Object) {
                    value = JSON.stringify(value);
                }
                xhr.setRequestHeader(name, value);
            }
        }
    }

    if (o.body) {
        o.data = JSON.stringify(o.body);
        //xhr.overrideMimeType('application/json');
        xhr.setRequestHeader('content-type', 'application/json');
    }

    xhr.send(o.data);
    return xhr;
}

function api(route, method, params, success) {
    var o = {
        route: route,
        method: method,
        success: success
    };
    if ('GET' == method) {
        o.params = params;
    }
    else {
        o.body = params;
    }
    query(o);
}

function $button(text, call) {
    var button = $new('button', {type: 'button'}, text);
    button.onclick = call;
    return button;
}

function base64buffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function bytes2base64(bytes) {
    var binary = [];
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary.push(String.fromCharCode(bytes[i]));
    }
    return window.btoa(binary.join(''));
}

function base62rand(length) {
    var bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    var str = bytes2base64(bytes);
    str = str.slice(0, -2);
    str = str.replace(/\+/g, 'z');
    str = str.replace(/\//g, 'Z');
    return str;
}

function extend(target, source) {
    for (var key in source) {
        target[key] = source[key];
    }
}

var EventEmitter = {
    on: function (name, call) {
        if ('function' != typeof call) {
            console.warn('Argument call is not a function', call);
        }
        EventEmitter.init.call(this, name).push(call);
    },

    single: function (name, call) {
        EventEmitter.init.call(this, name, [call]);
    },

    register: function(events) {
        for(var name in events) {
            this.on(name, events[name]);
        }
    },

    off: function (name, call) {
        if (this._events[name] instanceof Array) {
            var i = this._events[name].indexOf(call);
            this._events[name].splice(i, 1);
            if (this._events[name].length == 0) {
                delete this._events[name];
            }
        }
    },
    once: function (name, call) {
        function once(data) {
            call.call(this, data);
            this.off(name, once);
        }

        this.on(name, once);
    },
    fire: function (name, data) {
        if (this._events && (name in this._events)) {
            var listeners = this._events[name];
            for (var i = 0; i < listeners.length; i++) {
                if (false === listeners[i].call(this, data)) {
                    return;
                }
            }
        }
    },
    cloneEvents: function () {
        var events = {};
        for (var i in this._events) {
            var event = [];
            events[i] = event;
            for (var j = 0; j < this._events[i].length; j++) {
                event.push(this._events[i][j]);
            }
        }
        return events;
    }
};

EventEmitter.init = function(name, cbs) {
    if (!this._events) {
        this._events = this.constructor
        && this.constructor._events
        && this.constructor.cloneEvents
            ? this.constructor.cloneEvents() : {};
    }

    if (name) {
        if (!(name in this._events)) {
            this._events[name] = cbs || [];
        }
        return this._events[name];
    }
};

extend(Element.prototype, EventEmitter);

Node.prototype.findParent = function (call) {
    var parent = this.parentNode;
    if (call(parent)) {
        return parent;
    }
};

function bounding(tag) {
    var rect = tag.getBoundingClientRect();
    tag.setAttribute('width', rect.width);
    tag.setAttribute('height', rect.height);
    tag.start = rect;
    return tag;
}

Object.defineProperty(HTMLElement.prototype, 'background', {
    get: function () {
        var source = /"([^"]+)"/.exec(this.style.backgroundImage);
        return source ? source[1] : null;
    },

    set: function (value) {
        if (value instanceof File) {
            var self = this;
            var reader = new FileReader();
            reader.onload = function (e) {
                self.style.backgroundImage = 'url("' + e.target.result + '")';
            };
            reader.readAsDataURL(value);
        }
        else {
            this.style.backgroundImage = 'url("' + value + '")';
        }
    }
});

Object.defineProperties(XMLHttpRequest.prototype, {
    responseXML: {
        get: function () {
            return JSON.parse(this.responseText);
        }
    }
});

Element.prototype.change = function () {
    this.dispatchEvent(new Event('change'));
};

Element.prototype.prependChild = function (child) {
    this.insertBefore(child, this.firstChild);
};

function merge() {
    var o = {};
    for (var i = 0; i < arguments.length; i++) {
        var a = arguments[i];
        for (var j in a) {
            o[j] = a[j];
        }
    }
    return o;
}

function download(url) {
    if (!('string' == typeof url)) {
        url = '/api/file?id=' + (url.id || url._id);
    }
    open(url, '_blank');
}

function measure(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toPrecision(4) + ' ' + sizes[i];
}

function inherit(child, parent, proto, descriptor) {
    if (!child)
        child = function () {
            parent.apply(this, arguments);
        };
    if (!descriptor)
        descriptor = {};
    descriptor.base = {
        value: parent,
        enumerable: false,
        writable: false
    };
    child.prototype = Object.create(parent.prototype ? parent.prototype : parent);
    child.prototype.constructor = child;
    var names = proto ? Object.getOwnPropertyNames(proto) : [];
    for (var i in names) {
        var name = names[i];
        descriptor[name] = Object.getOwnPropertyDescriptor(proto, name);
    }
    Object.defineProperties(child.prototype, descriptor);
    child.descriptor = descriptor;
    return child;
}
