"use strict";

self.hasDocument = 'window' in self;

if (!hasDocument) {
  self.statistics = {
    start: Date.now()
  };
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

self.EmptyKeys = ('TAB PAUSE CAPS_LOCK SPACE PAGE_UP PAGE_DOWN END HOME LEFT_ARROW UP_ARROW RIGHT_ARROW DOWN_ARROW ' +
    'INSERT LEFT_META RIGHT_META SELECT NUM_LOCK SCROLL_LOCK').split(' ').map(function (s) { return KeyCode[s]; });

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

var twilio = {
    INVALID_NUMBER: 21211
};

var countries = [{"iso":"IL","name":"Israel","code":972},{"iso":"AF","name":"Afghanistan","code":93},{"iso":"AL","name":"Albania","code":355},{"iso":"DZ","name":"Algeria","code":213},{"iso":"AS","name":"AmericanSamoa","code":1684},{"iso":"AD","name":"Andorra","code":376},{"iso":"AO","name":"Angola","code":244},{"iso":"AI","name":"Anguilla","code":1264},{"iso":"AG","name":"Antigua and Barbuda","code":1268},{"iso":"AR","name":"Argentina","code":54},{"iso":"AM","name":"Armenia","code":374},{"iso":"AW","name":"Aruba","code":297},{"iso":"AU","name":"Australia","code":61},{"iso":"AT","name":"Austria","code":43},{"iso":"AZ","name":"Azerbaijan","code":994},{"iso":"BS","name":"Bahamas","code":1242},{"iso":"BH","name":"Bahrain","code":973},{"iso":"BD","name":"Bangladesh","code":880},{"iso":"BB","name":"Barbados","code":1246},{"iso":"BY","name":"Belarus","code":375},{"iso":"BE","name":"Belgium","code":32},{"iso":"BZ","name":"Belize","code":501},{"iso":"BJ","name":"Benin","code":229},{"iso":"BM","name":"Bermuda","code":1441},{"iso":"BT","name":"Bhutan","code":975},{"iso":"BA","name":"Bosnia and Herzegovina","code":387},{"iso":"BW","name":"Botswana","code":267},{"iso":"BR","name":"Brazil","code":55},{"iso":"IO","name":"British Indian Ocean Territory","code":246},{"iso":"BG","name":"Bulgaria","code":359},{"iso":"BF","name":"Burkina Faso","code":226},{"iso":"BI","name":"Burundi","code":257},{"iso":"KH","name":"Cambodia","code":855},{"iso":"CM","name":"Cameroon","code":237},{"iso":"CA","name":"Canada","code":1},{"iso":"CV","name":"Cape Verde","code":238},{"iso":"KY","name":"Cayman Islands","code":345},{"iso":"CF","name":"Central African Republic","code":236},{"iso":"TD","name":"Chad","code":235},{"iso":"CL","name":"Chile","code":56},{"iso":"CN","name":"China","code":86},{"iso":"CX","name":"Christmas Island","code":61},{"iso":"CO","name":"Colombia","code":57},{"iso":"KM","name":"Comoros","code":269},{"iso":"CG","name":"Congo","code":242},{"iso":"CK","name":"Cook Islands","code":682},{"iso":"CR","name":"Costa Rica","code":506},{"iso":"HR","name":"Croatia","code":385},{"iso":"CU","name":"Cuba","code":53},{"iso":"CY","name":"Cyprus","code":537},{"iso":"CZ","name":"Czech Republic","code":420},{"iso":"DK","name":"Denmark","code":45},{"iso":"DJ","name":"Djibouti","code":253},{"iso":"DM","name":"Dominica","code":1767},{"iso":"DO","name":"Dominican Republic","code":1849},{"iso":"EC","name":"Ecuador","code":593},{"iso":"EG","name":"Egypt","code":20},{"iso":"SV","name":"El Salvador","code":503},{"iso":"GQ","name":"Equatorial Guinea","code":240},{"iso":"ER","name":"Eritrea","code":291},{"iso":"EE","name":"Estonia","code":372},{"iso":"ET","name":"Ethiopia","code":251},{"iso":"FO","name":"Faroe Islands","code":298},{"iso":"FJ","name":"Fiji","code":679},{"iso":"FI","name":"Finland","code":358},{"iso":"FR","name":"France","code":33},{"iso":"GF","name":"French Guiana","code":594},{"iso":"PF","name":"French Polynesia","code":689},{"iso":"GA","name":"Gabon","code":241},{"iso":"GM","name":"Gambia","code":220},{"iso":"GE","name":"Georgia","code":995},{"iso":"DE","name":"Germany","code":49},{"iso":"GH","name":"Ghana","code":233},{"iso":"GI","name":"Gibraltar","code":350},{"iso":"GR","name":"Greece","code":30},{"iso":"GL","name":"Greenland","code":299},{"iso":"GD","name":"Grenada","code":1473},{"iso":"GP","name":"Guadeloupe","code":590},{"iso":"GU","name":"Guam","code":1671},{"iso":"GT","name":"Guatemala","code":502},{"iso":"GN","name":"Guinea","code":224},{"iso":"GW","name":"Guinea-Bissau","code":245},{"iso":"GY","name":"Guyana","code":595},{"iso":"HT","name":"Haiti","code":509},{"iso":"HN","name":"Honduras","code":504},{"iso":"HU","name":"Hungary","code":36},{"iso":"IS","name":"Iceland","code":354},{"iso":"IN","name":"India","code":91},{"iso":"ID","name":"Indonesia","code":62},{"iso":"IQ","name":"Iraq","code":964},{"iso":"IE","name":"Ireland","code":353},{"iso":"IL","name":"Israel","code":972},{"iso":"IT","name":"Italy","code":39},{"iso":"JM","name":"Jamaica","code":1876},{"iso":"JP","name":"Japan","code":81},{"iso":"JO","name":"Jordan","code":962},{"iso":"KZ","name":"Kazakhstan","code":77},{"iso":"KE","name":"Kenya","code":254},{"iso":"KI","name":"Kiribati","code":686},{"iso":"KW","name":"Kuwait","code":965},{"iso":"KG","name":"Kyrgyzstan","code":996},{"iso":"LV","name":"Latvia","code":371},{"iso":"LB","name":"Lebanon","code":961},{"iso":"LS","name":"Lesotho","code":266},{"iso":"LR","name":"Liberia","code":231},{"iso":"LI","name":"Liechtenstein","code":423},{"iso":"LT","name":"Lithuania","code":370},{"iso":"LU","name":"Luxembourg","code":352},{"iso":"MG","name":"Madagascar","code":261},{"iso":"MW","name":"Malawi","code":265},{"iso":"MY","name":"Malaysia","code":60},{"iso":"MV","name":"Maldives","code":960},{"iso":"ML","name":"Mali","code":223},{"iso":"MT","name":"Malta","code":356},{"iso":"MH","name":"Marshall Islands","code":692},{"iso":"MQ","name":"Martinique","code":596},{"iso":"MR","name":"Mauritania","code":222},{"iso":"MU","name":"Mauritius","code":230},{"iso":"YT","name":"Mayotte","code":262},{"iso":"MX","name":"Mexico","code":52},{"iso":"MC","name":"Monaco","code":377},{"iso":"MN","name":"Mongolia","code":976},{"iso":"ME","name":"Montenegro","code":382},{"iso":"MS","name":"Montserrat","code":1664},{"iso":"MA","name":"Morocco","code":212},{"iso":"MM","name":"Myanmar","code":95},{"iso":"NA","name":"Namibia","code":264},{"iso":"NR","name":"Nauru","code":674},{"iso":"NP","name":"Nepal","code":977},{"iso":"NL","name":"Netherlands","code":31},{"iso":"AN","name":"Netherlands Antilles","code":599},{"iso":"NC","name":"New Caledonia","code":687},{"iso":"NZ","name":"New Zealand","code":64},{"iso":"NI","name":"Nicaragua","code":505},{"iso":"NE","name":"Niger","code":227},{"iso":"NG","name":"Nigeria","code":234},{"iso":"NU","name":"Niue","code":683},{"iso":"NF","name":"Norfolk Island","code":672},{"iso":"MP","name":"Northern Mariana Islands","code":1670},{"iso":"NO","name":"Norway","code":47},{"iso":"OM","name":"Oman","code":968},{"iso":"PK","name":"Pakistan","code":92},{"iso":"PW","name":"Palau","code":680},{"iso":"PA","name":"Panama","code":507},{"iso":"PG","name":"Papua New Guinea","code":675},{"iso":"PY","name":"Paraguay","code":595},{"iso":"PE","name":"Peru","code":51},{"iso":"PH","name":"Philippines","code":63},{"iso":"PL","name":"Poland","code":48},{"iso":"PT","name":"Portugal","code":351},{"iso":"PR","name":"Puerto Rico","code":1939},{"iso":"QA","name":"Qatar","code":974},{"iso":"RO","name":"Romania","code":40},{"iso":"RW","name":"Rwanda","code":250},{"iso":"WS","name":"Samoa","code":685},{"iso":"SM","name":"San Marino","code":378},{"iso":"SA","name":"Saudi Arabia","code":966},{"iso":"SN","name":"Senegal","code":221},{"iso":"RS","name":"Serbia","code":381},{"iso":"SC","name":"Seychelles","code":248},{"iso":"SL","name":"Sierra Leone","code":232},{"iso":"SG","name":"Singapore","code":65},{"iso":"SK","name":"Slovakia","code":421},{"iso":"SI","name":"Slovenia","code":386},{"iso":"SB","name":"Solomon Islands","code":677},{"iso":"ZA","name":"South Africa","code":27},{"iso":"GS","name":"South Georgia and the South Sandwich Islands","code":500},{"iso":"ES","name":"Spain","code":34},{"iso":"LK","name":"Sri Lanka","code":94},{"iso":"SD","name":"Sudan","code":249},{"iso":"SR","name":"Suriname","code":597},{"iso":"SZ","name":"Swaziland","code":268},{"iso":"SE","name":"Sweden","code":46},{"iso":"CH","name":"Switzerland","code":41},{"iso":"TJ","name":"Tajikistan","code":992},{"iso":"TH","name":"Thailand","code":66},{"iso":"TG","name":"Togo","code":228},{"iso":"TK","name":"Tokelau","code":690},{"iso":"TO","name":"Tonga","code":676},{"iso":"TT","name":"Trinidad and Tobago","code":1868},{"iso":"TN","name":"Tunisia","code":216},{"iso":"TR","name":"Turkey","code":90},{"iso":"TM","name":"Turkmenistan","code":993},{"iso":"TC","name":"Turks and Caicos Islands","code":1649},{"iso":"TV","name":"Tuvalu","code":688},{"iso":"UG","name":"Uganda","code":256},{"iso":"UA","name":"Ukraine","code":380},{"iso":"AE","name":"United Arab Emirates","code":971},{"iso":"GB","name":"United Kingdom","code":44},{"iso":"US","name":"United States","code":1},{"iso":"UY","name":"Uruguay","code":598},{"iso":"UZ","name":"Uzbekistan","code":998},{"iso":"VU","name":"Vanuatu","code":678},{"iso":"WF","name":"Wallis and Futuna","code":681},{"iso":"YE","name":"Yemen","code":967},{"iso":"ZM","name":"Zambia","code":260},{"iso":"ZW","name":"Zimbabwe","code":263},{"iso":"AX","name":"land Islands"},{"iso":"AQ","name":"Antarctica"},{"iso":"BO","name":"Bolivia, Plurinational State of","code":591},{"iso":"BN","name":"Brunei Darussalam","code":673},{"iso":"CC","name":"Cocos (Keeling) Islands","code":61},{"iso":"CD","name":"Congo, The Democratic Republic of the","code":243},{"iso":"CI","name":"Cote d'Ivoire","code":225},{"iso":"FK","name":"Falkland Islands (Malvinas)","code":500},{"iso":"GG","name":"Guernsey","code":44},{"iso":"VA","name":"Holy See (Vatican City State)","code":379},{"iso":"HK","name":"Hong Kong","code":852},{"iso":"IR","name":"Iran, Islamic Republic of","code":98},{"iso":"IM","name":"Isle of Man","code":44},{"iso":"JE","name":"Jersey","code":44},{"iso":"KP","name":"Korea, Democratic People's Republic of","code":850},{"iso":"KR","name":"Korea, Republic of","code":82},{"iso":"LA","name":"Lao People's Democratic Republic","code":856},{"iso":"LY","name":"Libyan Arab Jamahiriya","code":218},{"iso":"MO","name":"Macao","code":853},{"iso":"MK","name":"Macedonia, The Former Yugoslav Republic of","code":389},{"iso":"FM","name":"Micronesia, Federated States of","code":691},{"iso":"MD","name":"Moldova, Republic of","code":373},{"iso":"MZ","name":"Mozambique","code":258},{"iso":"PS","name":"Palestinian Territory, Occupied","code":970},{"iso":"PN","name":"Pitcairn","code":872},{"iso":"RE","name":"Réunion","code":262},{"iso":"RU","name":"Russia","code":7},{"iso":"BL","name":"Saint Barthélemy","code":590},{"iso":"SH","name":"Saint Helena, Ascension and Tristan Da Cunha","code":290},{"iso":"KN","name":"Saint Kitts and Nevis","code":1869},{"iso":"LC","name":"Saint Lucia","code":1758},{"iso":"MF","name":"Saint Martin","code":590},{"iso":"PM","name":"Saint Pierre and Miquelon","code":508},{"iso":"VC","name":"Saint Vincent and the Grenadines","code":1784},{"iso":"ST","name":"Sao Tome and Principe","code":239},{"iso":"SO","name":"Somalia","code":252},{"iso":"SJ","name":"Svalbard and Jan Mayen","code":47},{"iso":"SY","name":"Syrian Arab Republic","code":963},{"iso":"TW","name":"Taiwan, Province of China","code":886},{"iso":"TZ","name":"Tanzania, United Republic of","code":255},{"iso":"TL","name":"Timor-Leste","code":670},{"iso":"VE","name":"Venezuela, Bolivarian Republic of","code":58},{"iso":"VN","name":"Viet Nam","code":84},{"iso":"VG","name":"Virgin Islands, British","code":1284},{"iso":"VI","name":"Virgin Islands, U.S.","code":1340}];
var codes = [];

countries.forEach(function (country) {
    if (country.code) {
        codes.push(country.code.toString());
    }
});
codes.sort(function (a, b) {
    return b - a;
});

var _feature_exists = function (name) {
    return name in self;
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
    peer: {
      iceServers: [
        {
          urls: "stun:stun.services.mozilla.com",
          username: "louis@mozilla.com",
          credential: "webrtcdemo"
        }, {
          urls: ['stun:stun.l.google.com:19302', 'stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302', 'stun:stun.services.mozilla.com', "stun:23.21.150.121"]
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


Object.freeze(KeyCode);
Object.freeze(emoji);
Object.freeze(SocketReadyState);
Object.freeze(browser);
Object.freeze(code);
