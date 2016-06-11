"use strict";

var style = document.createElement('style');
style.innerHTML = 'ul {padding-left: 16px; font: 10pt courier;} li {list-style: none} strong:after {content: ": "}'
    + ' .object {display: inline-block; margin-left: -12px; margin-top: 2px}'
    + ' ul ul:hover {background-color: rgba(0, 191, 255, 0.25)}'
    + ' h1, h2 {display: inline-block; margin: 16px 10px 0 10px; font-size: 24px; font-family: Roboto, "Droid Sans", sans-serif}'
    + ' html {background-color: #ECEFF4}'
    + ' body {background: url("/images/polyhedron-bg.png") left no-repeat; background-size: cover; margin: 0}';
document.head.appendChild(style);
var title = document.querySelector('title');
var h1 = document.querySelector('h1');
var h2 = document.createElement('h2');
h2.innerHTML = title.innerHTML;
h2.style.color = h1.innerHTML >= 400 ? 'red' : 'green';
document.body.appendChild(h2);
var hr = document.createElement('hr');
document.body.appendChild(hr);
var now = new Date();
var params = {
    Location: location.pathname + location.search,
    Time: now.toUTCString() + ' (' + now.getTime() + ')',
    Agent: navigator.userAgent,
    Language: navigator.language,
    Cookie: navigator.cookieEnabled ? 'enabled' : 'disabled',
    Width: innerWidth,
    Height: innerHeight,
    Cores: navigator.hardwareConcurrency,
    Vendor: navigator.vendor,
    Platform: navigator.platform,
    'Do Not Track': !!navigator.doNotTrack,
    Online: !!navigator.onLine
};

if (navigator.languages) {
    params.Languages = navigator.languages.join(', ');
}

if (document.cookie) {
    document.cookie.split(/;\s+/).forEach(function (cookie) {
        cookie = cookie.split('=');
        params[cookie[0]] = cookie[1];
    })
}

if ('auth' in params) {
    params.auth = params.auth.slice(0, 4) + '................................' + params.auth.slice(-4);
}

params.Screen = screen;

if (navigator.plugins) {
    var plugins = {};
    [].forEach.call(navigator.plugins, function (plugin) {
        var info = {};
        if (plugin.description) {
            info.Description = plugin.description;
        }
        info.mime = [].map.call(plugin, function (mime) {
            return mime.type;
        });
        info.mime = info.mime.join(', ');
        plugins[plugin.name] = info;
    });
    params.Plugins = plugins;
}

function dump(params, name) {
    var ul = document.createElement('ul');
    if (name) {
        var strong = document.createElement('strong');
        strong.setAttribute('class', 'object');
        strong.innerHTML = name;
        ul.appendChild(strong);
    }
    for (var label in params) {
        var value = params[label];
        if ((undefined !== value || null !== value) && 0 !== label.indexOf('on')) {
            if ('object' == typeof value) {
                ul.appendChild(dump(value, label));
            }
            else if ('function' != typeof value) {
                var li = document.createElement('li');
                li.innerHTML = '<strong>' + label + '</strong><span>' + value + '</span>';
                ul.appendChild(li);
            }
        }
    }
    return ul;
}

document.body.appendChild(dump(params));

var download = document.createElement('button');
download.onclick = function () {
    download.remove();
    var doc = '<!DOCTYPE html>\n<html><head><style>';
    doc += style.innerHTML;
    doc += '</style></head><body>';
    doc += document.body.innerHTML;
    doc += '</body></head></html>';
    open('data:application/x-forcedownload;base64,' + btoa(unescape(encodeURIComponent(doc))));
};
download.innerHTML = 'Download';
document.body.insertBefore(download, hr);
