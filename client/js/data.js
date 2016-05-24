"use strict";

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

var CTRL = 0x100;
var ALT = 0x200;
var SHIFT = 0x400;

var KeyCode = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16, CTRL: 17, ALT: 18,
    PAUSE: 19,
    CAPS_LOCK: 20,
    ESCAPE: 27,
    SPACE: 32,
    PAGE_UP: 33, PAGE_DOWN: 34,
    END: 35, HOME: 36,
    LEFT_ARROW: 37, UP_ARROW: 38, RIGHT_ARROW: 39, DOWN_ARROW: 40,
    INSERT: 45,
    DELETE: 46,
    0: 48, 1: 49, 2: 50, 3: 51, 4: 52, 5: 53, 6: 54, 7: 55, 8: 56, 9: 57,
    A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74,
    K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84,
    U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90,
    LEFT_META: 91,
    RIGHT_META: 92,
    SELECT: 93,
    NUMPAD_0: 96, NUMPAD_1: 97, NUMPAD_2: 98, NUMPAD_3: 99, NUMPAD_4: 100,
    NUMPAD_5: 101, NUMPAD_6: 102, NUMPAD_7: 103, NUMPAD_8: 104, NUMPAD_9: 105,
    MULTIPLY: 106,
    ADD: 107,
    SUBTRACT: 109,
    DECIMAL: 110,
    DIVIDE: 111,
    F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117,
    F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123,
    NUM_LOCK: 144,
    SCROLL_LOCK: 145,
    SEMICOLON: 186,
    EQUALS: 187,
    COMMA: 188,
    DASH: 189,
    PERIOD: 190,
    FORWARD_SLASH: 191,
    GRAVE_ACCENT: 192,
    OPEN_BRACKET: 219,
    BACK_SLASH: 220,
    CLOSE_BRACKET: 221,
    SINGLE_QUOTE: 222
};

var emoji = ["😄", "😊", "😃", "☺", "😉", "😍", "😘", "😚", "😳", "😌", "😁", "😜", "😝", "😒", "😏", "😓", "😔", "😞", "😖", "😥", "😰", "😨", "😣", "😢", "😭", "😂", "😲", "😱", "😠", "😡", "😪", "😷", "👿", "👿", "👽", "💛", "💙", "💜", "💗", "💚", "❤", "💔", "💓", "💘", "✨", "🌟", "💢", "❕", "❔", "💤", "💨", "💦", "🎶", "🎵", "🔥", "💩", "👍", "👎", "👌", "👊", "✊", "✌", "👋", "✋", "👃", "👀", "👂", "👄", "💋", "👣", "💀", "💂", "👸", "👼", "😨", "😣", "😢", "😭", "😂", "😲", "😱", "😠", "😡", "😪", "😷", "👿", "👽", "💛", "💙", "💜", "💗", "💚", "❤", "💔", "💓", "💘", "✨", "🌟", "💢", "❕", "❔", "💤", "💨", "💦", "🎶", "🎵", "🔥", "💩", "👍", "👎", "👌", "👊", "✊", "✌", "👋", "✋", "👐", "👆", "👇", "👉", "👈", "🙌", "🙏", "☝", "👏", "💪", "🚶", "🏃", "👫", "💃", "👯", "🙆", "🙅", "💁", "🙇", "💏", "💑", "💆", "💇", "💅", "👦", "👧", "👩", "👨", "👶", "👵", "👴", "👱", "👲", "👳", "👷", "👮", "👼", "👸", "💂", "💀", "👣", "💋", "👄", "👂", "👀", "👃", "☀", "☔", "☁", "⛄", "🌙", "⚡", "🌀", "🌊", "🐱", "🐶", "🐭", "🐹", "🐰", "🐺", "🐸", "🐯", "🐨", "🐻", "🐷", "🐮", "🐗", "🐵", "🐒", "🐴", "🐎", "🐫", "🐑", "🐘", "🐍", "🐦", "🐤", "🐔", "🐧", "🐛", "🐙", "🐠", "🐟", "🐳", "🐬", "💐", "🌸", "🌷", "🍀", "🌹", "🌻", "🌺", "🍁", "🍃", "🍂", "🌴", "🌵", "🌾", "🐚", "🎍", "💝", "🎎", "🎒", "🎓", "🎏", "🎆", "🎇", "🎐", "🎑", "🎃", "👻", "🎅", "🎄", "🎁", "🔔", "🎉", "🎈", "💿", "📀", "📷", "🎥", "💻", "📺", "📱", "📠", "☎", "💽", "📼", "🔊", "📢", "📣", "📻", "📡", "➿", "🔍", "🔓", "🔒", "🔑", "✂", "🔨", "💡", "📲", "📩", "📫", "📮", "🛀", "🚽", "💺", "💰", "🔱", "🚬", "💣", "🔫", "💊", "💉", "🏈", "🏀", "⚽", "⚾", "🎾", "⛳", "🎱", "🏊", "🏄", "🎿", "♠", "♥", "♣", "♦", "🏆", "👾", "🎯", "🀄", "🎬", "📝", "📖", "🎨", "🎤", "🎧", "🎺", "🎷", "🎸", "〽", "👟", "👡", "👠", "👢", "👕", "👔", "👗", "👘", "👙", "🎀", "🎩", "👑", "👒", "🌂", "💼", "👜", "💄", "💍", "💎", "☕", "🍵", "🍺", "🍻", "🍸", "🍶", "🍴", "🍔", "🍟", "🍝", "🍛", "🍱", "🍣", "🍙", "🍘", "🍚", "🍜", "🍲", "🍞", "🏠", "🏫", "🏢", "🏣", "🏥", "🏦", "🏪", "🏩", "🏨", "💒", "⛪", "🏬", "🌇", "🌆", "🏯", "🏰", "⛺", "🏭", "🗼", "🗻", "🌄", "🌅", "🌃", "🗽", "🌈", "🎡", "⛲", "🎢", "🚢", "🚤", "⛵", "✈", "🚀", "🚲", "🚙", "🚗", "🚕", "🚌", "🚓", "🚒", "🚑", "🚚", "🚃", "🚉", "🚄", "🚅", "🎫", "⛽", "🚥", "⚠", "🚧", "🔰", "🏧", "🎰", "🚏", "💈", "♨", "🏁", "🎌", "⬆", "⬇", "⬅", "➡", "↗", "↖", "↘", "↙", "◀", "▶", "🏠", "🏡", "🏫", "🏢", "🏣", "🏥", "🏦", "🏪", "🏩", "🏨", "💒", "⛪", "🏬", "🏤", "🌇", "🌆", "🏯", "🏰", "⛺", "🏭", "🗼", "🗾", "🗻", "🌄", "🌅", "🌃", "🗽", "🌉", "🎠", "🎡", "⛲", "🎢", "🚢", "⛵", "🚤", "🚣", "⚓", "🚀", "✈", "💺", "🚁", "🚂", "🚊", "🚉", "🚎", "🚆", "🚄", "🚅", "🚈", "🚇", "🚝", "🚋", "🚃", "🚎", "🚌", "🚍", "🚙", "🚘", "🚗", "🚕", "🚖", "🚛", "🚚", "🚨", "🚓", "🚔", "🚒", "🚑", "🚐", "🚲", "🚡", "🚟", "🚠", "🚜", "💈", "🚏", "🎫", "🚦", "🚥", "⚠", "🚧", "🔰", "⛽", "🏮", "🎰", "♨", "🗿", "🎪", "🎭", "📍", "🚩", "✖", "➕", "➖", "➗", "♠", "♥", "♣", "♦", "💮", "💯", "✔", "☑", "🔘", "🔗", "➰", "〽", "🔱"];

var SocketReadyState = {
    0: 'The connection is not yet open',
    1: 'The connection is open and ready to communicate',
    2: 'The connection is in the process of closing',
    3: "The connection is closed or couldn't be opened"
};

var code = {
    ACCEPTED: 202,
    BAD_GATEWAY: 502,
    BAD_REQUEST: 400,
    CONFLICT: 409,
    CONTINUE: 100,
    CREATED: 201,
    EXPECTATION_FAILED: 417,
    FAILED_DEPENDENCY: 424,
    FORBIDDEN: 403,
    GATEWAY_TIMEOUT: 504,
    GONE: 410,
    HTTP_VERSION_NOT_SUPPORTED: 505,
    INSUFFICIENT_SPACE_ON_RESOURCE: 419,
    INSUFFICIENT_STORAGE: 507,
    INTERNAL_SERVER_ERROR: 500,
    LENGTH_REQUIRED: 411,
    LOCKED: 423,
    METHOD_FAILURE: 420,
    METHOD_NOT_ALLOWED: 405,
    MOVED_PERMANENTLY: 301,
    MOVED_TEMPORARILY: 302,
    MULTI_STATUS: 207,
    MULTIPLE_CHOICES: 300,
    NETWORK_AUTHENTICATION_REQUIRED: 511,
    NO_CONTENT: 204,
    NON_AUTHORITATIVE_INFORMATION: 203,
    NOT_ACCEPTABLE: 406,
    NOT_FOUND: 404,
    NOT_IMPLEMENTED: 501,
    NOT_MODIFIED: 304,
    OK: 200,
    PARTIAL_CONTENT: 206,
    PAYMENT_REQUIRED: 402,
    PRECONDITION_FAILED: 412,
    PRECONDITION_REQUIRED: 428,
    PROCESSING: 102,
    PROXY_AUTHENTICATION_REQUIRED: 407,
    REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
    REQUEST_TIMEOUT: 408,
    REQUEST_TOO_LONG: 413,
    REQUEST_URI_TOO_LONG: 414,
    REQUESTED_RANGE_NOT_SATISFIABLE: 416,
    RESET_CONTENT: 205,
    SEE_OTHER: 303,
    SERVICE_UNAVAILABLE: 503,
    SWITCHING_PROTOCOLS: 101,
    TEMPORARY_REDIRECT: 307,
    TOO_MANY_REQUESTS: 429,
    UNAUTHORIZED: 401,
    UNPROCESSABLE_ENTITY: 422,
    UNSUPPORTED_MEDIA_TYPE: 415,
    USE_PROXY: 305
};

var _feature_exists = function (name) {
    return name in window;
};

var features = {
    peer: ['RTCPeerConnection', 'RTCSessionDescription', 'RTCIceCandidate'].every(_feature_exists)
};


var browser = {
    os: {}
};

(function () {
    var b;

    if (b = /(MSIE |Edge\/)([0-9\.]+)/.exec(navigator.userAgent)) {
        browser.name = 'IE';
        browser.version = b[2];
    }
    else if (b = /(Chrome|Firefox)\/([0-9\.]+)/.exec(navigator.userAgent)) {
        browser.name = b[1];
        browser.version = b[2];
        if (navigator.userAgent.indexOf('YaBrowser') >= 0) {
            browser.vendor = 'Yandex';
        }
        if (navigator.userAgent.indexOf('OPR') >= 0) {
            browser.vendor = 'Opera';
        }
    }
    else if (b = /Version\/([0-9\.]+).*Safari\//.exec(navigator.userAgent)) {
        browser.name = 'Safari';
        browser.version = b[1];
    }

    if (b = /(iPod|iPhone|iPad).*OS ([0-9_\.]+)/i.exec(navigator.userAgent)) {
        browser.os.name = 'iOS';
        browser.os.device = b[1].toLowerCase();
        browser.os.version = b[2].replace('_', '.');
    }
    else if (b = /Macintosh.*Mac OS X ([0-9_\.]+)/.exec(navigator.userAgent)) {
        browser.os.name = 'Mac';
        browser.os.version = b[1].replace(/_/g, '.');
    }
    else if (navigator.userAgent.indexOf('Windows') >= 0) {
        browser.os.name = 'Windows';
        var versions = {
            'XP': ['Windows NT 5.1', 'Windows XP'],
            'Server 2003': ['Windows NT 5.2'],
            'Vista': ['Windows NT 6.0'],
            '7': ['Windows NT 6.1'],
            '8': ['Windows NT 6.2'],
            '10': ['Windows NT 10.0']
        };
        windows: for (var v in versions) {
            var matches = versions[v];
            for (var i = 0; i < matches.length; i++) {
                if (navigator.userAgent.indexOf(matches[i]) > 0) {
                    browser.os.version = v;
                    break windows;
                }
            }
        }
    }
    else if (b = /Android ([0-9\.]+)/.exec(navigator.userAgent)) {
        browser.os.name = 'Android';
        browser.os.version = b[1];
    }
    else if (navigator.userAgent.indexOf('Linux') >= 0) {
        browser.os.name = 'Linux';
        if (b = /(Ubuntu|Debian|Fedora|CentOS)/.exec(navigator.userAgent)) {
            browser.os.distribution = b[1];
        }
        else if (navigator.userAgent.indexOf('Android') >= 0) {
            browser.os.name = 'Android';
        }
    }

    if (browser.version) {
        browser.version = parseInt(browser.version)
    }

    statistics.agent = browser;
})();

window.isFirefox = window.InstallTrigger && 'Firefox' == browser.name;

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

window.geo = null;
// if (navigator.geolocation.watchPosition) {
//     navigator.geolocation.watchPosition(function (p) {
//         var c = p.coords;
//         window.geo = [c.latitude, c.longitude];
//
//         if (c.altitude) {
//             window.geo.push(c.altitude);
//         }
//     });
//    
// }


var TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "zh", "з": "z", "и": "i", "й": "j",
    "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f",
    "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu",
    "я": "ya", '_': '', "ї": "yi", "ґ": "g", "є": "ie"
};

if (!('requestFullscreen' in Element.prototype)) {
    Element.prototype.requestFullscreen =
        Element.prototype.webkitRequestFullScreen || Element.prototype.mozRequestFullScreen;
}

function logPromise(p) {
    return p.then(function (result) {
            console.log('RESOLVE', result);
        },
        function (error) {
            console.error('REJECT', error);
        });
}

function preventDefault(e) {
    e.preventDefault();
}

Object.freeze(KeyCode);
Object.freeze(emoji);
Object.freeze(SocketReadyState);
Object.freeze(browser);
Object.freeze(code);

/*
 addEventListener('load', function () {
 var _trace = Marionette.Error.prototype.captureStackTrace;
 Marionette.Error.prototype.captureStackTrace = function () {
 _trace.call(this);
 console.error(this);
 };
 });
 */

