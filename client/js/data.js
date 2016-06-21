"use strict";

if (!self.statistics) {
    self.statistics = {
        start: Date.now()
    };
}

var SocketReadyState = {
    0: 'The connection is not yet open',
    1: 'The connection is open and ready to communicate',
    2: 'The connection is in the process of closing',
    3: "The connection is closed or couldn't be opened"
};

var emoji = {
    "😃": ["Smile", ":)", ":-)"],
    "😄": ["Laugh", ":D", ":-D"],
    "😉": ["Blink", ";)", ";-)"],
    "😍": "In Love",
    "😘": "Love Kiss",
    "😚": "Kiss",
    "😳": "Surprised",
    "😌": "Joy",
    "😜": ["Blink Tongue", ":P", ":-P"],
    "😝": ["Tongue", "XD", "X-D"],
    "😒": ["Sad", ":(", ":-("],
    "😏": "Tricky",
    "😓": "Busy",
    "😞": "Sad",
    "😥": ["Tear", ":'-(", ":'(", ";(", ";-(", ";=("],
    "😭": "Cry",
    "😂": "Laugh",
    "😡": ["Angry"],
    "😷": "Silent",
    "👿": "Evil",
    "👽": "Stranger",
    "💘": "Heart",
    "🌟": "Star",
    "🎵": "Music",
    "🔥": "Fire",
    "👍": "Like",
    "👎": "Dislike",
    "👌": "Good",
    "👊": "Beet",
    // "✌": "",
    "💋": "Lips",
    "🙏": "Pray",
    // "☝": "",
    "👏": "Pop",
    "💪": "Power",
    "🔒": "Lock",
    "🔓": "Unlock",
    "🔑": "Key",
    "💰": "Money",
    "🔬": "Science",
    "🚬": "Smoke",
    "💣": "Bomb",
    "🔫": "Kill",
    "💊": "Pill",
    "💉": "Prick",
    "⚽": "Ball",
    "🎯": "Target",
    "🏆": "Award",
    "🎩": "Hat",
    "💄": "Pomade",
    "💎": "Diamond",
    // "☕": "",
    "🍹": "Cocktail",
    "🍺": "Beer",
    "🍴": "Eat",
    "🍭": "Candy",
    "🍦": "Ice"
};

var code = {
    CONTINUE: 100,
    SWITCHING_PROTOCOLS: 101,
    PROCESSING: 102,
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NON_AUTHORITATIVE_INFORMATION: 203,
    NO_CONTENT: 204,
    RESET_CONTENT: 205,
    PARTIAL_CONTENT: 206,
    MULTI_STATUS: 207,
    MULTIPLE_CHOICES: 300,
    MOVED_PERMANENTLY: 301,
    MOVED_TEMPORARILY: 302,
    SEE_OTHER: 303,
    NOT_MODIFIED: 304,
    USE_PROXY: 305,
    TEMPORARY_REDIRECT: 307,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    PAYMENT_REQUIRED: 402,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    NOT_ACCEPTABLE: 406,
    PROXY_AUTHENTICATION_REQUIRED: 407,
    REQUEST_TIMEOUT: 408,
    CONFLICT: 409,
    GONE: 410,
    LENGTH_REQUIRED: 411,
    PRECONDITION_FAILED: 412,
    REQUEST_TOO_LONG: 413,
    REQUEST_URI_TOO_LONG: 414,
    UNSUPPORTED_MEDIA_TYPE: 415,
    REQUESTED_RANGE_NOT_SATISFIABLE: 416,
    EXPECTATION_FAILED: 417,
    INSUFFICIENT_SPACE_ON_RESOURCE: 419,
    METHOD_FAILURE: 420,
    UNPROCESSABLE_ENTITY: 422,
    LOCKED: 423,
    FAILED_DEPENDENCY: 424,
    PRECONDITION_REQUIRED: 428,
    TOO_MANY_REQUESTS: 429,
    REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
    HTTP_VERSION_NOT_SUPPORTED: 505,
    INSUFFICIENT_STORAGE: 507,
    NETWORK_AUTHENTICATION_REQUIRED: 511
};

var TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "zh", "з": "z", "и": "i", "й": "j",
    "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f",
    "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu",
    "я": "ya", '_': '', "ї": "yi", "ґ": "g", "є": "ie"
};

var Scroll = {
    UP: false,
    DOWN: true
};

var remap = [22,61,43,121,105,210,0,228,16,88,41,32,168,196,126,54,158,125,83,149,98,23,239,234,114,230,49,139,172,7,107,156,217,39,82,9,225,252,221,164,170,185,96,144,92,53,246,74,176,199,109,138,127,29,84,214,235,112,70,122,153,99,38,206,87,215,91,113,6,229,202,205,78,24,31,26,103,145,191,77,120,218,75,203,94,161,253,115,33,140,80,166,10,137,85,2,200,160,55,244,62,28,3,76,174,42,165,222,37,251,131,102,132,249,67,86,186,180,241,208,48,194,51,81,116,4,182,100,237,118,50,141,224,207,201,130,123,69,119,243,40,134,59,66,184,93,247,18,21,232,150,223,231,157,216,45,233,46,248,189,117,195,213,15,57,19,142,58,204,227,163,193,108,97,30,101,219,236,1,175,178,152,14,255,65,5,13,162,179,197,209,198,34,226,110,71,254,143,25,159,212,173,240,167,27,187,146,44,89,220,188,169,95,73,60,242,79,90,11,64,177,17,238,20,136,63,47,155,245,8,133,12,111,151,35,124,183,36,56,72,211,129,106,104,52,250,68,171,147,192,148,128,190,154,135,181];

var twilio = {
    INVALID_NUMBER: 21211
};
var countries = [
    ["RE", "Réunion", 262, "🇷🇪"],
    ["SV", "El Salvador", 503, "🇸🇻"],
    ["LA", "Lao People's Democratic Republic", 856],
    ["NC", "New Caledonia", 687, "🇳🇨"],
    ["NZ", "New Zealand", 64, "🇳🇿"],
    ["SM", "San Marino", 378, "🇸🇲"],
    ["ST", "Sao Tome and Principe", 239],
    ["LK", "Sri Lanka", 94, "🇱🇰"],
    ["CV", "Cape Verde", 238, "🇨🇻"],
    ["TD", "Chad", 235, "🇹🇩"],
    ["CK", "Cook Islands", 682, "🇨🇰"],
    ["CI", "Cote d'Ivoire", 225],
    ["CU", "Cuba", 53, "🇨🇺"],
    ["FJ", "Fiji", 679, "🇫🇯"],
    ["GU", "Guam", 1671, "🇬🇺"],
    ["VA", "Holy See (Vatican City State)", 379],
    ["HK", "Hong Kong", 852, "🇭🇰"],
    ["IR", "Iran", 98],
    ["IQ", "Iraq", 964, "🇮🇶"],
    ["IM", "Isle of Man", 44, "🇮🇲"],
    ["AX", "land Islands"],
    ["ML", "Mali", 223, "🇲🇱"],
    ["NU", "Niue", 683, "🇳🇺"],
    ["OM", "Oman", 968, "🇴🇲"],
    ["PE", "Peru", 51, "🇵🇪"],
    ["TG", "Togo", 228, "🇹🇬"],
    ["VN", "Viet Nam", 84],
    ["AF", "Afghanistan", 93, "🇦🇫"],
    ["AL", "Albania", 355, "🇦🇱"],
    ["DZ", "Algeria", 213, "🇩🇿"],
    ["AS", "AmericanSamoa", 1684],
    ["AD", "Andorra", 376, "🇦🇩"],
    ["AO", "Angola", 244, "🇦🇴"],
    ["AI", "Anguilla", 1264, "🇦🇮"],
    ["AQ", "Antarctica", null, "🇦🇶"],
    ["AG", "Antigua and Barbuda", 1268, "🇦🇬"],
    ["AR", "Argentina", 54, "🇦🇷"],
    ["AM", "Armenia", 374, "🇦🇲"],
    ["AW", "Aruba", 297, "🇦🇼"],
    ["AU", "Australia", 61, "🇦🇺"],
    ["AT", "Austria", 43, "🇦🇹"],
    ["AZ", "Azerbaijan", 994, "🇦🇿"],
    ["BS", "Bahamas", 1242, "🇧🇸"],
    ["BH", "Bahrain", 973, "🇧🇭"],
    ["BD", "Bangladesh", 880, "🇧🇩"],
    ["BB", "Barbados", 1246, "🇧🇧"],
    ["BY", "Belarus", 375, "🇧🇾"],
    ["BE", "Belgium", 32, "🇧🇪"],
    ["BZ", "Belize", 501, "🇧🇿"],
    ["BJ", "Benin", 229, "🇧🇯"],
    ["BM", "Bermuda", 1441, "🇧🇲"],
    ["BT", "Bhutan", 975, "🇧🇹"],
    ["BO", "Bolivia, Plurinational State of", 591],
    ["BA", "Bosnia and Herzegovina", 387, "🇧🇦"],
    ["BW", "Botswana", 267, "🇧🇼"],
    ["BR", "Brazil", 55, "🇧🇷"],
    ["IO", "British Indian Ocean Territory", 246, "🇮🇴"],
    ["BN", "Brunei Darussalam", 673],
    ["BG", "Bulgaria", 359, "🇧🇬"],
    ["BF", "Burkina Faso", 226, "🇧🇫"],
    ["BI", "Burundi", 257, "🇧🇮"],
    ["KH", "Cambodia", 855, "🇰🇭"],
    ["CM", "Cameroon", 237, "🇨🇲"],
    ["CA", "Canada", 1, "🇨🇦"],
    ["KY", "Cayman Islands", 345, "🇰🇾"],
    ["CF", "Central African Republic", 236, "🇨🇫"],
    ["CL", "Chile", 56, "🇨🇱"],
    ["CN", "China", 86, "🇨🇳"],
    ["CX", "Christmas Island", 61, "🇨🇽"],
    ["CC", "Cocos (Keeling) Islands", 61],
    ["CO", "Colombia", 57, "🇨🇴"],
    ["KM", "Comoros", 269, "🇰🇲"],
    ["CD", "Congo, The Democratic Republic of the", 243],
    ["CG", "Congo", 242],
    ["CR", "Costa Rica", 506, "🇨🇷"],
    ["HR", "Croatia", 385, "🇭🇷"],
    ["CY", "Cyprus", 537, "🇨🇾"],
    ["CZ", "Czech Republic", 420, "🇨🇿"],
    ["DK", "Denmark", 45, "🇩🇰"],
    ["DJ", "Djibouti", 253, "🇩🇯"],
    ["DM", "Dominica", 1767, "🇩🇲"],
    ["DO", "Dominican Republic", 1849, "🇩🇴"],
    ["EC", "Ecuador", 593, "🇪🇨"],
    ["EG", "Egypt", 20, "🇪🇬"],
    ["GQ", "Equatorial Guinea", 240, "🇬🇶"],
    ["ER", "Eritrea", 291, "🇪🇷"],
    ["EE", "Estonia", 372, "🇪🇪"],
    ["ET", "Ethiopia", 251, "🇪🇹"],
    ["FK", "Falkland Islands (Malvinas)", 500],
    ["FO", "Faroe Islands", 298, "🇫🇴"],
    ["FI", "Finland", 358, "🇫🇮"],
    ["FR", "France", 33, "🇫🇷"],
    ["PF", "French Polynesia", 689, "🇵🇫"],
    ["GF", "French Guiana", 594, "🇬🇫"],
    ["GA", "Gabon", 241, "🇬🇦"],
    ["GM", "Gambia", 220, "🇬🇲"],
    ["GE", "Georgia", 995, "🇬🇪"],
    ["DE", "Germany", 49, "🇩🇪"],
    ["GH", "Ghana", 233, "🇬🇭"],
    ["GI", "Gibraltar", 350, "🇬🇮"],
    ["GR", "Greece", 30, "🇬🇷"],
    ["GL", "Greenland", 299, "🇬🇱"],
    ["GD", "Grenada", 1473, "🇬🇩"],
    ["GP", "Guadeloupe", 590, "🇬🇵"],
    ["GT", "Guatemala", 502, "🇬🇹"],
    ["GG", "Guernsey", 44, "🇬🇬"],
    ["GW", "Guinea-Bissau", 245, "🇬🇼"],
    ["GN", "Guinea", 224, "🇬🇳"],
    ["GY", "Guyana", 595, "🇬🇾"],
    ["HT", "Haiti", 509, "🇭🇹"],
    ["HN", "Honduras", 504, "🇭🇳"],
    ["HU", "Hungary", 36, "🇭🇺"],
    ["IS", "Iceland", 354, "🇮🇸"],
    ["IN", "India", 91, "🇮🇳"],
    ["ID", "Indonesia", 62, "🇮🇩"],
    ["IE", "Ireland", 353, "🇮🇪"],
    ["IL", "Israel", 972, "🇮🇱"],
    ["IL", "Israel", 972, "🇮🇱"],
    ["IT", "Italy", 39, "🇮🇹"],
    ["JM", "Jamaica", 1876, "🇯🇲"],
    ["JP", "Japan", 81, "🇯🇵"],
    ["JE", "Jersey", 44, "🇯🇪"],
    ["JO", "Jordan", 962, "🇯🇴"],
    ["KZ", "Kazakhstan", 77, "🇰🇿"],
    ["KE", "Kenya", 254, "🇰🇪"],
    ["KI", "Kiribati", 686, "🇰🇮"],
    ["KR", "Korea, Republic of", 82],
    ["KP", "Korea, Democratic People's Republic of", 850],
    ["KW", "Kuwait", 965, "🇰🇼"],
    ["KG", "Kyrgyzstan", 996, "🇰🇬"],
    ["LV", "Latvia", 371, "🇱🇻"],
    ["LB", "Lebanon", 961, "🇱🇧"],
    ["LS", "Lesotho", 266, "🇱🇸"],
    ["LR", "Liberia", 231, "🇱🇷"],
    ["LY", "Libyan Arab Jamahiriya", 218],
    ["LI", "Liechtenstein", 423, "🇱🇮"],
    ["LT", "Lithuania", 370, "🇱🇹"],
    ["LU", "Luxembourg", 352, "🇱🇺"],
    ["MO", "Macao", 853],
    ["MK", "Macedonia, The Former Yugoslav Republic of", 389],
    ["MG", "Madagascar", 261, "🇲🇬"],
    ["MW", "Malawi", 265, "🇲🇼"],
    ["MY", "Malaysia", 60, "🇲🇾"],
    ["MV", "Maldives", 960, "🇲🇻"],
    ["MT", "Malta", 356, "🇲🇹"],
    ["MH", "Marshall Islands", 692, "🇲🇭"],
    ["MQ", "Martinique", 596, "🇲🇶"],
    ["MR", "Mauritania", 222, "🇲🇷"],
    ["MU", "Mauritius", 230, "🇲🇺"],
    ["YT", "Mayotte", 262, "🇾🇹"],
    ["MX", "Mexico", 52, "🇲🇽"],
    ["FM", "Micronesia, Federated States of", 691],
    ["MD", "Moldova, Republic of", 373],
    ["MC", "Monaco", 377, "🇲🇨"],
    ["MN", "Mongolia", 976, "🇲🇳"],
    ["ME", "Montenegro", 382, "🇲🇪"],
    ["MS", "Montserrat", 1664, "🇲🇸"],
    ["MA", "Morocco", 212, "🇲🇦"],
    ["MZ", "Mozambique", 258, "🇲🇿"],
    ["MM", "Myanmar", 95, "🇲🇲"],
    ["NA", "Namibia", 264, "🇳🇦"],
    ["NR", "Nauru", 674, "🇳🇷"],
    ["NP", "Nepal", 977, "🇳🇵"],
    ["NL", "Netherlands", 31, "🇳🇱"],
    ["AN", "Netherlands Antilles", 599],
    ["NI", "Nicaragua", 505, "🇳🇮"],
    ["NE", "Niger", 227, "🇳🇪"],
    ["NG", "Nigeria", 234, "🇳🇬"],
    ["NF", "Norfolk Island", 672, "🇳🇫"],
    ["MP", "Northern Mariana Islands", 1670, "🇲🇵"],
    ["NO", "Norway", 47, "🇳🇴"],
    ["PK", "Pakistan", 92, "🇵🇰"],
    ["PW", "Palau", 680, "🇵🇼"],
    ["PS", "Palestinian Territory, Occupied", 970],
    ["PA", "Panama", 507, "🇵🇦"],
    ["PG", "Papua New Guinea", 675, "🇵🇬"],
    ["PY", "Paraguay", 595, "🇵🇾"],
    ["PH", "Philippines", 63, "🇵🇭"],
    ["PN", "Pitcairn", 872],
    ["PL", "Poland", 48, "🇵🇱"],
    ["PT", "Portugal", 351, "🇵🇹"],
    ["PR", "Puerto Rico", 1939, "🇵🇷"],
    ["QA", "Qatar", 974, "🇶🇦"],
    ["RO", "Romania", 40, "🇷🇴"],
    ["RU", "Russia", 7, "🇷🇺"],
    ["RW", "Rwanda", 250, "🇷🇼"],
    ["VC", "Saint Vincent and the Grenadines", 1784],
    ["SH", "Saint Helena, Ascension and Tristan Da Cunha", 290],
    ["KN", "Saint Kitts and Nevis", 1869],
    ["BL", "Saint Barthélemy", 590],
    ["PM", "Saint Pierre and Miquelon", 508],
    ["MF", "Saint Martin", 590],
    ["LC", "Saint Lucia", 1758],
    ["WS", "Samoa", 685, "🇼🇸"],
    ["SA", "Saudi Arabia", 966, "🇸🇦"],
    ["SN", "Senegal", 221, "🇸🇳"],
    ["RS", "Serbia", 381, "🇷🇸"],
    ["SC", "Seychelles", 248, "🇸🇨"],
    ["SL", "Sierra Leone", 232, "🇸🇱"],
    ["SG", "Singapore", 65, "🇸🇬"],
    ["SK", "Slovakia", 421, "🇸🇰"],
    ["SI", "Slovenia", 386, "🇸🇮"],
    ["SB", "Solomon Islands", 677, "🇸🇧"],
    ["SO", "Somalia", 252, "🇸🇴"],
    ["ZA", "South Africa", 27, "🇿🇦"],
    ["GS", "South Georgia and the South Sandwich Islands", 500],
    ["ES", "Spain", 34, "🇪🇸"],
    ["SD", "Sudan", 249, "🇸🇩"],
    ["SR", "Suriname", 597, "🇸🇷"],
    ["SJ", "Svalbard and Jan Mayen", 47, "🇸🇯"],
    ["SZ", "Swaziland", 268, "🇸🇿"],
    ["SE", "Sweden", 46, "🇸🇪"],
    ["CH", "Switzerland", 41, "🇨🇭"],
    ["SY", "Syrian Arab Republic", 963],
    ["TW", "Taiwan, Province of China", 886],
    ["TJ", "Tajikistan", 992, "🇹🇯"],
    ["TZ", "Tanzania, United Republic of", 255],
    ["TH", "Thailand", 66, "🇹🇭"],
    ["TL", "Timor-Leste", 670, "🇹🇱"],
    ["TK", "Tokelau", 690, "🇹🇰"],
    ["TO", "Tonga", 676, "🇹🇴"],
    ["TT", "Trinidad and Tobago", 1868, "🇹🇹"],
    ["TN", "Tunisia", 216, "🇹🇳"],
    ["TR", "Turkey", 90, "🇹🇷"],
    ["TM", "Turkmenistan", 993, "🇹🇲"],
    ["TC", "Turks and Caicos Islands", 1649, "🇹🇨"],
    ["TV", "Tuvalu", 688, "🇹🇻"],
    ["UG", "Uganda", 256, "🇺🇬"],
    ["UA", "Ukraine", 380, "🇺🇦"],
    ["GB", "United Kingdom", 44, "🇬🇧"],
    ["AE", "United Arab Emirates", 971, "🇦🇪"],
    ["US", "United States", 1, "🇺🇸"],
    ["UY", "Uruguay", 598, "🇺🇾"],
    ["UZ", "Uzbekistan", 998, "🇺🇿"],
    ["VU", "Vanuatu", 678, "🇻🇺"],
    ["VE", "Venezuela, Bolivarian Republic of", 58],
    ["VI", "Virgin Islands, U.S.", 1340],
    ["VG", "Virgin Islands, British", 1284],
    ["WF", "Wallis and Futuna", 681, "🇼🇫"],
    ["YE", "Yemen", 967, "🇾🇪"],
    ["ZM", "Zambia", 260, "🇿🇲"],
    ["ZW", "Zimbabwe", 263, "🇿🇼"]
];

var country_codes = [];
setImmediate(function () {
    _.each(emoji, function (array, symbol) {
        if ('string' == typeof array) {
            array = [array];
            emoji[symbol] = array;
        }
        var s = array[0].toLowerCase().replace(/\s+/g, '_');
        array.unshift(':' + s + ':');
    });
    Object.freeze(emoji);
    
    countries = countries.map(function (country) {
        var o = {
            iso: country[0],
            name: country[1]
        };
        if (country[2]) {
            o.code = country[2];
        }
        if (country[3]) {
            o.flag = country[3];
        }
        return o;
    });

    countries.forEach(function (country) {
        if (country.code) {
            country_codes.push(country.code);
        }
    });
    country_codes.sort(function (a, b) {
        return b - a;
    });
});

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

self.isFirefox = self.InstallTrigger && 'Firefox' == browser.name;

self.defaultConfig = {
    search: {
        delay: 250
    },
    trace: {
        history: true
    },
    socket: {
        address: 'ws://' + location.hostname + '/socket',
        wait: 800
    },
    alert: {
        duration: 12000
    },
    online: {
        delay: 10 * 1000,
        duration: 5 * 60 * 1000
    },
    peer: {
        iceServers: [
            {
                urls: "stun:stun.services.mozilla.com",
                username: "louis@mozilla.com",
                credential: "webrtcdemo"
            }, {
                urls: [
                    'stun:stun.l.google.com:19302', 'stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302',
                    'stun:stun.services.mozilla.com', "stun:23.21.150.121"]
            }
        ]
    }
};

self.features = {
    peer: {
        available: !!(self.RTCPeerConnection || self.webkitRTCPeerConnection)
    },
    notification: {
        available: !!self.Notification,
        enabled: false
    },
    fullscreen: {
        available: !!(self.Element
        && (Element.prototype.requestFullscreen || (Element.prototype.requestFullscreen = Element.prototype.webkitRequestFullscreen)))
    }
};

Object.freeze(SocketReadyState);
Object.freeze(browser);
Object.freeze(code);
