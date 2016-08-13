'use strict';

var isNode = ('undefined' !== typeof module) && module.exports;
if (isNode) {
    global.self = global;
}
self.isService = !isNode && !(self.window && window.document);

if (isNode) {
    var _ = require('underscore');
}
else {
    self.isFirefox = !isNode && self.InstallTrigger;
    self.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    self.isIE = /*@cc_on!@*/false || !!document.documentMode;
    self.isEdge = !isIE && !!self.StyleMedia;
    self.isChrome = !!self.chrome && !!window.chrome.webstore;
    self.isBlink = isChrome && !!window.CSS;
}

if (!self.statistics) {
    self.statistics = {
        start: Date.now()
    };
}

var SocketReadyState = {
    0: 'The connection is not yet open',
    1: 'The connection is open and ready to communicate',
    2: 'The connection is in the process of closing',
    3: 'The connection is closed or couldn\'t be opened'
};

var HumanRelationship = {
    '': 'None selected',
    'single': 'Single',
    'in': 'In a relationship',
    'engaged': 'Engaged',
    'married': 'Married',
    'love': 'In love',
    'complex': 'It\'s complicated',
    'search': 'Actively searching'
};

var Languages = [
    {_id: 0, iso: 'ru', name: 'Русский'},
    {_id: 3, iso: 'en', name: 'English'}
];

var emoji = {
    '😃': ['Smile', ':)', ':-)'],
    '😄': ['Laugh', ':D', ':-D'],
    '😉': ['Blink', ';)', ';-)'],
    '😍': 'In Love',
    '😘': 'Love Kiss',
    '😚': 'Kiss',
    '😳': 'Surprised',
    '😌': 'Joy',
    '😜': ['Blink Tongue', ':P', ':-P'],
    '😝': ['Tongue', 'XD', 'X-D'],
    '😒': ['Sad', ':(', ':-('],
    // '😏': 'Tricky',
    '😓': 'Busy',
    '😞': 'Sad',
    '😥': ['Tear', ':\'-(', ':\'(', ';(', ';-(', ';=('],
    '😭': 'Cry',
    '😡': ['Angry'],
    '😷': 'Silent',
    '👿': 'Evil',
    '👽': 'Stranger',
    '💘': 'Heart',
    '🌟': 'Star',
    '🎵': 'Music',
    '🔥': 'Fire',
    '👍': 'Like',
    '👎': 'Dislike',
    '👌': 'Good',
    '👊': 'Beet',
    // '✌': '',
    '💋': 'Lips',
    '🙏': 'Pray',
    // '☝': '',
    '👏': 'Pop',
    '💪': 'Power',
    '🔒': 'Lock',
    '🔓': 'Unlock',
    '🔑': 'Key',
    '💰': 'Money',
    '🚬': 'Smoke',
    '💣': 'Bomb',
    '🔫': 'Kill',
    '💊': 'Pill',
    '💉': 'Prick',
    '⚽': 'Ball',
    '🎯': 'Target',
    '🏆': 'Award',
    '🎩': 'Hat',
    '💄': 'Pomade',
    '💎': 'Diamond',
    // '☕': '',
    '🍹': 'Cocktail',
    '🍺': 'Beer',
    '🍴': 'Eat',
    '🍭': 'Candy',
    '🍦': 'Ice'
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

var EmptyKeys = [' ', '\n', '\t', '\xa0', 'Meta', 'Alt', 'Control', 'Shift', 'CapsLock', 'ArrowLeft', 'ArrowRight'];

var t13n = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j',
    'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
    'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya', '_': '_', 'ї': 'yi', 'ґ': 'g', 'є': 'ie', 'і': 'i'
};

var Scroll = {
    UP: false,
    DOWN: true
};

var Sex = {
    male: 'Male',
    female: 'Female'
};

var twilio = {
    INVALID_NUMBER: 21211
};

var _countries = [
    {'iso': 'AF', 'code': 93, 'flag': '🇦🇫', '_id': 30},
    {'iso': 'AL', 'code': 355, 'flag': '🇦🇱', '_id': 21},
    {'iso': 'DZ', 'code': 213, 'flag': '🇩🇿', '_id': 22},
    {'iso': 'AS', 'code': 1684},
    {'iso': 'AD', 'code': 376, 'flag': '🇦🇩', '_id': 26},
    {'iso': 'AO', 'code': 244, 'flag': '🇦🇴', '_id': 25},
    {'iso': 'AI', 'code': 1264, 'flag': '🇦🇮', '_id': 24},
    {'iso': 'AQ', 'flag': '🇦🇶'},
    {'iso': 'AG', 'code': 1268, 'flag': '🇦🇬', '_id': 27},
    {'iso': 'AR', 'code': 54, 'flag': '🇦🇷', '_id': 28},
    {'iso': 'AM', 'code': 374, 'flag': '🇦🇲', '_id': 6},
    {'iso': 'AW', 'code': 297, 'flag': '🇦🇼', '_id': 29},
    {'iso': 'AU', 'code': 61, 'flag': '🇦🇺', '_id': 19},
    {'iso': 'AT', 'code': 43, 'flag': '🇦🇹', '_id': 20},
    {'iso': 'AZ', 'code': 994, 'flag': '🇦🇿', '_id': 5},
    {'iso': 'BS', 'code': 1242, 'flag': '🇧🇸', '_id': 31},
    {'iso': 'BH', 'code': 973, 'flag': '🇧🇭', '_id': 34},
    {'iso': 'BD', 'code': 880, 'flag': '🇧🇩', '_id': 32},
    {'iso': 'BB', 'code': 1246, 'flag': '🇧🇧', '_id': 33},
    {'iso': 'BY', 'code': 375, 'flag': '🇧🇾', '_id': 3},
    {'iso': 'BE', 'code': 32, 'flag': '🇧🇪', '_id': 36},
    {'iso': 'BZ', 'code': 501, 'flag': '🇧🇿', '_id': 35},
    {'iso': 'BJ', 'code': 229, 'flag': '🇧🇯', '_id': 37},
    {'iso': 'BM', 'code': 1441, 'flag': '🇧🇲', '_id': 38},
    {'iso': 'BT', 'code': 975, 'flag': '🇧🇹', '_id': 47},
    {'iso': 'BO', 'code': 591},
    {'iso': 'BA', 'code': 387, 'flag': '🇧🇦', '_id': 41},
    {'iso': 'BW', 'code': 267, 'flag': '🇧🇼', '_id': 42},
    {'iso': 'BR', 'code': 55, 'flag': '🇧🇷', '_id': 43},
    {'iso': 'IO', 'code': 246, 'flag': '🇮🇴'},
    {'iso': 'BN', 'code': 673, '_id': 44},
    {'iso': 'BG', 'code': 359, 'flag': '🇧🇬', '_id': 39},
    {'iso': 'BF', 'code': 226, 'flag': '🇧🇫', '_id': 45},
    {'iso': 'BI', 'code': 257, 'flag': '🇧🇮', '_id': 46},
    {'iso': 'KH', 'code': 855, 'flag': '🇰🇭', '_id': 91},
    {'iso': 'CM', 'code': 237, 'flag': '🇨🇲', '_id': 92},
    {'iso': 'CA', 'code': 1, 'flag': '🇨🇦', '_id': 10},
    {'iso': 'CV', 'code': 238, 'flag': '🇨🇻', '_id': 90},
    {'iso': 'KY', 'code': 345, 'flag': '🇰🇾', '_id': 149},
    {'iso': 'CF', 'code': 236, 'flag': '🇨🇫', '_id': 213},
    {'iso': 'TD', 'code': 235, 'flag': '🇹🇩', '_id': 214},
    {'iso': 'CL', 'code': 56, 'flag': '🇨🇱', '_id': 216},
    {'iso': 'CN', 'code': 86, 'flag': '🇨🇳', '_id': 97},
    {'iso': 'CX', 'code': 61, 'flag': '🇨🇽'},
    {'iso': 'CC', 'code': 61},
    {'iso': 'CO', 'code': 57, 'flag': '🇨🇴', '_id': 98},
    {'iso': 'KM', 'code': 269, 'flag': '🇰🇲', '_id': 99},
    {'iso': 'CG', 'code': 242, '_id': 100},
    {'iso': 'CD', 'code': 243},
    {'iso': 'CK', 'code': 682, 'flag': '🇨🇰', '_id': 150},
    {'iso': 'CR', 'code': 506, 'flag': '🇨🇷', '_id': 102},
    {'iso': 'CI', 'code': 225},
    {'iso': 'HR', 'code': 385, 'flag': '🇭🇷', '_id': 212},
    {'iso': 'CU', 'code': 53, 'flag': '🇨🇺', '_id': 104},
    {'iso': 'CY', 'code': 537, 'flag': '🇨🇾', '_id': 95},
    {'iso': 'CZ', 'code': 420, 'flag': '🇨🇿', '_id': 215},
    {'iso': 'DK', 'code': 45, 'flag': '🇩🇰', '_id': 73},
    {'iso': 'DJ', 'code': 253, 'flag': '🇩🇯', '_id': 231},
    {'iso': 'DM', 'code': 1767, 'flag': '🇩🇲', '_id': 74},
    {'iso': 'DO', 'code': 1849, 'flag': '🇩🇴', '_id': 75},
    {'iso': 'EC', 'code': 593, 'flag': '🇪🇨', '_id': 221},
    {'iso': 'EG', 'code': 20, 'flag': '🇪🇬', '_id': 76},
    {'iso': 'SV', 'code': 503, 'flag': '🇸🇻', '_id': 166},
    {'iso': 'GQ', 'code': 240, 'flag': '🇬🇶', '_id': 222},
    {'iso': 'ER', 'code': 291, 'flag': '🇪🇷', '_id': 223},
    {'iso': 'EE', 'code': 372, 'flag': '🇪🇪', '_id': 14},
    {'iso': 'ET', 'code': 251, 'flag': '🇪🇹', '_id': 224},
    {'iso': 'FK', 'code': 500},
    {'iso': 'FO', 'code': 298, 'flag': '🇫🇴', '_id': 204},
    {'iso': 'FJ', 'code': 679, 'flag': '🇫🇯', '_id': 205},
    {'iso': 'FI', 'code': 358, 'flag': '🇫🇮', '_id': 207},
    {'iso': 'FR', 'code': 33, 'flag': '🇫🇷', '_id': 209},
    {'iso': 'GF', 'code': 594, 'flag': '🇬🇫', '_id': 210},
    {'iso': 'PF', 'code': 689, 'flag': '🇵🇫', '_id': 211},
    {'iso': 'GA', 'code': 241, 'flag': '🇬🇦', '_id': 56},
    {'iso': 'GM', 'code': 220, 'flag': '🇬🇲', '_id': 59},
    {'iso': 'GE', 'code': 995, 'flag': '🇬🇪', '_id': 7},
    {'iso': 'DE', 'code': 49, 'flag': '🇩🇪', '_id': 65},
    {'iso': 'GH', 'code': 233, 'flag': '🇬🇭', '_id': 60},
    {'iso': 'GI', 'code': 350, 'flag': '🇬🇮', '_id': 66},
    {'iso': 'GR', 'code': 30, 'flag': '🇬🇷', '_id': 71},
    {'iso': 'GL', 'code': 299, 'flag': '🇬🇱', '_id': 70},
    {'iso': 'GD', 'code': 1473, 'flag': '🇬🇩', '_id': 69},
    {'iso': 'GP', 'code': 590, 'flag': '🇬🇵', '_id': 61},
    {'iso': 'GU', 'code': 1671, 'flag': '🇬🇺', '_id': 72},
    {'iso': 'GT', 'code': 502, 'flag': '🇬🇹', '_id': 62},
    {'iso': 'GG', 'code': 44, 'flag': '🇬🇬', '_id': 236},
    {'iso': 'GN', 'code': 224, 'flag': '🇬🇳', '_id': 63},
    {'iso': 'GW', 'code': 245, 'flag': '🇬🇼', '_id': 64},
    {'iso': 'GY', 'code': 595, 'flag': '🇬🇾', '_id': 58},
    {'iso': 'HT', 'code': 509, 'flag': '🇭🇹', '_id': 57},
    {'iso': 'VA', 'code': 379},
    {'iso': 'HN', 'code': 504, 'flag': '🇭🇳', '_id': 67},
    {'iso': 'HK', 'code': 852, 'flag': '🇭🇰', '_id': 68},
    {'iso': 'HU', 'code': 36, 'flag': '🇭🇺', '_id': 50},
    {'iso': 'IS', 'code': 354, 'flag': '🇮🇸', '_id': 86},
    {'iso': 'IN', 'code': 91, 'flag': '🇮🇳', '_id': 80},
    {'iso': 'ID', 'code': 62, 'flag': '🇮🇩', '_id': 81},
    {'iso': 'IR', 'code': 98, '_id': 84},
    {'iso': 'IQ', 'code': 964, 'flag': '🇮🇶', '_id': 83},
    {'iso': 'IE', 'code': 353, 'flag': '🇮🇪', '_id': 85},
    {'iso': 'IM', 'code': 44, 'flag': '🇮🇲', '_id': 147},
    {'iso': 'IL', 'code': 972, 'flag': '🇮🇱', '_id': 8},
    {'iso': 'IT', 'code': 39, 'flag': '🇮🇹', '_id': 88},
    {'iso': 'JM', 'code': 1876, 'flag': '🇯🇲', '_id': 228},
    {'iso': 'JP', 'code': 81, 'flag': '🇯🇵', '_id': 229},
    {'iso': 'JE', 'code': 44, 'flag': '🇯🇪', '_id': 237},
    {'iso': 'JO', 'code': 962, 'flag': '🇯🇴', '_id': 82},
    {'iso': 'KZ', 'code': 77, 'flag': '🇰🇿', '_id': 4},
    {'iso': 'KE', 'code': 254, 'flag': '🇰🇪', '_id': 94},
    {'iso': 'KI', 'code': 686, 'flag': '🇰🇮', '_id': 96},
    {'iso': 'KP', 'code': 850},
    {'iso': 'KR', 'code': 82},
    {'iso': 'KW', 'code': 965, 'flag': '🇰🇼', '_id': 105},
    {'iso': 'KG', 'code': 996, 'flag': '🇰🇬', '_id': 11},
    {'iso': 'LA', 'code': 856},
    {'iso': 'LV', 'code': 371, 'flag': '🇱🇻', '_id': 12},
    {'iso': 'LB', 'code': 961, 'flag': '🇱🇧', '_id': 109},
    {'iso': 'LS', 'code': 266, 'flag': '🇱🇸', '_id': 107},
    {'iso': 'LR', 'code': 231, 'flag': '🇱🇷', '_id': 108},
    {'iso': 'LY', 'code': 218},
    {'iso': 'LI', 'code': 423, 'flag': '🇱🇮', '_id': 111},
    {'iso': 'LT', 'code': 370, 'flag': '🇱🇹', '_id': 13},
    {'iso': 'LU', 'code': 352, 'flag': '🇱🇺', '_id': 112},
    {'iso': 'MO', 'code': 853},
    {'iso': 'MK', 'code': 389},
    {'iso': 'MG', 'code': 261, 'flag': '🇲🇬', '_id': 115},
    {'iso': 'MW', 'code': 265, 'flag': '🇲🇼', '_id': 118},
    {'iso': 'MY', 'code': 60, 'flag': '🇲🇾', '_id': 119},
    {'iso': 'MV', 'code': 960, 'flag': '🇲🇻', '_id': 121},
    {'iso': 'ML', 'code': 223, 'flag': '🇲🇱', '_id': 120},
    {'iso': 'MT', 'code': 356, 'flag': '🇲🇹', '_id': 122},
    {'iso': 'MH', 'code': 692, 'flag': '🇲🇭', '_id': 125},
    {'iso': 'MQ', 'code': 596, 'flag': '🇲🇶', '_id': 124},
    {'iso': 'MR', 'code': 222, 'flag': '🇲🇷', '_id': 114},
    {'iso': 'MU', 'code': 230, 'flag': '🇲🇺', '_id': 113},
    {'iso': 'YT', 'code': 262, 'flag': '🇾🇹'},
    {'iso': 'MX', 'code': 52, 'flag': '🇲🇽', '_id': 126},
    {'iso': 'FM', 'code': 691},
    {'iso': 'MD', 'code': 373},
    {'iso': 'MC', 'code': 377, 'flag': '🇲🇨', '_id': 129},
    {'iso': 'MN', 'code': 976, 'flag': '🇲🇳', '_id': 130},
    {'iso': 'ME', 'code': 382, 'flag': '🇲🇪', '_id': 230},
    {'iso': 'MS', 'code': 1664, 'flag': '🇲🇸', '_id': 131},
    {'iso': 'MA', 'code': 212, 'flag': '🇲🇦', '_id': 123},
    {'iso': 'MZ', 'code': 258, 'flag': '🇲🇿', '_id': 128},
    {'iso': 'MM', 'code': 95, 'flag': '🇲🇲', '_id': 132},
    {'iso': 'NA', 'code': 264, 'flag': '🇳🇦', '_id': 133},
    {'iso': 'NR', 'code': 674, 'flag': '🇳🇷', '_id': 134},
    {'iso': 'NP', 'code': 977, 'flag': '🇳🇵', '_id': 135},
    {'iso': 'NL', 'code': 31, 'flag': '🇳🇱', '_id': 139},
    {'iso': 'AN', 'code': 599},
    {'iso': 'NC', 'code': 687, 'flag': '🇳🇨', '_id': 143},
    {'iso': 'NZ', 'code': 64, 'flag': '🇳🇿', '_id': 142},
    {'iso': 'NI', 'code': 505, 'flag': '🇳🇮', '_id': 140},
    {'iso': 'NE', 'code': 227, 'flag': '🇳🇪', '_id': 136},
    {'iso': 'NG', 'code': 234, 'flag': '🇳🇬', '_id': 137},
    {'iso': 'NU', 'code': 683, 'flag': '🇳🇺', '_id': 141},
    {'iso': 'NF', 'code': 672, 'flag': '🇳🇫', '_id': 148},
    {'iso': 'MP', 'code': 1670, 'flag': '🇲🇵', '_id': 174},
    {'iso': 'NO', 'code': 47, 'flag': '🇳🇴', '_id': 144},
    {'iso': 'OM', 'code': 968, 'flag': '🇴🇲', '_id': 146},
    {'iso': 'PK', 'code': 92, 'flag': '🇵🇰', '_id': 152},
    {'iso': 'PW', 'code': 680, 'flag': '🇵🇼', '_id': 153},
    {'iso': 'PS', 'code': 970},
    {'iso': 'PA', 'code': 507, 'flag': '🇵🇦', '_id': 155},
    {'iso': 'PG', 'code': 675, 'flag': '🇵🇬', '_id': 156},
    {'iso': 'PY', 'code': 595, 'flag': '🇵🇾', '_id': 157},
    {'iso': 'PE', 'code': 51, 'flag': '🇵🇪', '_id': 158},
    {'iso': 'PH', 'code': 63, 'flag': '🇵🇭', '_id': 206},
    {'iso': 'PN', 'code': 872},
    {'iso': 'PL', 'code': 48, 'flag': '🇵🇱', '_id': 160},
    {'iso': 'PT', 'code': 351, 'flag': '🇵🇹', '_id': 161},
    {'iso': 'PR', 'code': 1939, 'flag': '🇵🇷', '_id': 162},
    {'iso': 'QA', 'code': 974, 'flag': '🇶🇦', '_id': 93},
    {'iso': 'RO', 'code': 40, 'flag': '🇷🇴', '_id': 165},
    {'iso': 'RU', 'code': 7, 'flag': '🇷🇺', '_id': 1},
    {'iso': 'RW', 'code': 250, 'flag': '🇷🇼', '_id': 164},
    {'iso': 'RE', 'code': 262, 'flag': '🇷🇪', '_id': 163},
    {'iso': 'BL', 'code': 590},
    {'iso': 'SH', 'code': 290},
    {'iso': 'KN', 'code': 1869, '_id': 178},
    {'iso': 'LC', 'code': 1758, '_id': 179},
    {'iso': 'MF', 'code': 590},
    {'iso': 'PM', 'code': 508, '_id': 180},
    {'iso': 'VC', 'code': 1784, '_id': 177},
    {'iso': 'WS', 'code': 685, 'flag': '🇼🇸', '_id': 167},
    {'iso': 'SM', 'code': 378, 'flag': '🇸🇲', '_id': 168},
    {'iso': 'ST', 'code': 239},
    {'iso': 'SA', 'code': 966, 'flag': '🇸🇦', '_id': 170},
    {'iso': 'SN', 'code': 221, 'flag': '🇸🇳', '_id': 176},
    {'iso': 'RS', 'code': 381, 'flag': '🇷🇸', '_id': 181},
    {'iso': 'SC', 'code': 248, 'flag': '🇸🇨', '_id': 175},
    {'iso': 'SL', 'code': 232, 'flag': '🇸🇱', '_id': 190},
    {'iso': 'SG', 'code': 65, 'flag': '🇸🇬', '_id': 182},
    {'iso': 'SK', 'code': 421, 'flag': '🇸🇰', '_id': 184},
    {'iso': 'SI', 'code': 386, 'flag': '🇸🇮', '_id': 185},
    {'iso': 'SB', 'code': 677, 'flag': '🇸🇧', '_id': 186},
    {'iso': 'SO', 'code': 252, 'flag': '🇸🇴', '_id': 187},
    {'iso': 'ZA', 'code': 27, 'flag': '🇿🇦', '_id': 227},
    {'iso': 'GS', 'code': 500},
    {'iso': 'ES', 'code': 34, 'flag': '🇪🇸', '_id': 87},
    {'iso': 'LK', 'code': 94, 'flag': '🇱🇰', '_id': 220},
    {'iso': 'SD', 'code': 249, 'flag': '🇸🇩', '_id': 188},
    {'iso': 'SR', 'code': 597, 'flag': '🇸🇷', '_id': 189},
    {'iso': 'SJ', 'code': 47, 'flag': '🇸🇯', '_id': 219},
    {'iso': 'SZ', 'code': 268, 'flag': '🇸🇿', '_id': 171},
    {'iso': 'SE', 'code': 46, 'flag': '🇸🇪', '_id': 218},
    {'iso': 'CH', 'code': 41, 'flag': '🇨🇭', '_id': 217},
    {'iso': 'SY', 'code': 963},
    {'iso': 'TW', 'code': 886},
    {'iso': 'TJ', 'code': 992, 'flag': '🇹🇯', '_id': 16},
    {'iso': 'TZ', 'code': 255},
    {'iso': 'TH', 'code': 66, 'flag': '🇹🇭', '_id': 191},
    {'iso': 'TL', 'code': 670, 'flag': '🇹🇱'},
    {'iso': 'TG', 'code': 228, 'flag': '🇹🇬', '_id': 194},
    {'iso': 'TK', 'code': 690, 'flag': '🇹🇰', '_id': 195},
    {'iso': 'TO', 'code': 676, 'flag': '🇹🇴', '_id': 196},
    {'iso': 'TT', 'code': 1868, 'flag': '🇹🇹', '_id': 197},
    {'iso': 'TN', 'code': 216, 'flag': '🇹🇳', '_id': 199},
    {'iso': 'TR', 'code': 90, 'flag': '🇹🇷', '_id': 200},
    {'iso': 'TM', 'code': 993, 'flag': '🇹🇲', '_id': 17},
    {'iso': 'TC', 'code': 1649, 'flag': '🇹🇨', '_id': 151},
    {'iso': 'TV', 'code': 688, 'flag': '🇹🇻', '_id': 198},
    {'iso': 'UG', 'code': 256, 'flag': '🇺🇬', '_id': 201},
    {'iso': 'UA', 'code': 380, 'flag': '🇺🇦', '_id': 2},
    {'iso': 'AE', 'code': 971, 'flag': '🇦🇪', '_id': 145},
    {'iso': 'GB', 'code': 44, 'flag': '🇬🇧', '_id': 49},
    {'iso': 'US', 'code': 1, 'flag': '🇺🇸'},
    {'iso': 'UY', 'code': 598, 'flag': '🇺🇾', '_id': 203},
    {'iso': 'UZ', 'code': 998, 'flag': '🇺🇿', '_id': 18},
    {'iso': 'VU', 'code': 678, 'flag': '🇻🇺', '_id': 48},
    {'iso': 'VE', 'code': 58},
    {'iso': 'VN', 'code': 84},
    {'iso': 'VG', 'code': 1284},
    {'iso': 'VI', 'code': 1340},
    {'iso': 'WF', 'code': 681, 'flag': '🇼🇫', '_id': 202},
    {'iso': 'YE', 'code': 967, 'flag': '🇾🇪', '_id': 89},
    {'iso': 'ZM', 'code': 260, 'flag': '🇿🇲', '_id': 77},
    {'iso': 'ZW', 'code': 263, 'flag': '🇿🇼', '_id': 79},
    {'iso': 'AX'}
];

var countries = [];
var country_codes = [];

var mimes = [
    'application/atom+xml,128,atom',
    'application/font-woff,8192,woff',
    'application/java-archive,8192,jar war ear',
    'application/json,512,json',
    'application/mac-binhex40,64,hqx',
    'application/msword,8192,doc',
    'application/octet-stream,16384,bin exe dll deb dmg iso img msi msp msm',
    'application/pdf,16384,pdf',
    'application/postscript,8192,ps eps ai',
    'application/rss+xml,128,rss',
    'application/rtf,4096,rtf',
    'application/vnd.apple.mpegurl,16,m3u8',
    'application/vnd.google-earth.kml+xml,16,kml',
    'application/vnd.google-earth.kmz,16,kmz',
    'application/vnd.ms-excel,1024,xls',
    'application/vnd.ms-fontobject,8192,eot',
    'application/vnd.ms-powerpoint,8192,ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation,16384,pptx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,16384,xlsx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document,16384,docx',
    'application/vnd.wap.wmlc,8192,wmlc',
    'application/x-7z-compressed,16384,7z',
    'application/x-cocoa,8192,cco',
    'application/x-java-archive-diff,512,jardiff',
    'application/x-java-jnlp-file,16,jnlp',
    'application/x-makeself,8192,run',
    'application/x-perl,128,pl pm',
    'application/x-pilot,2048,prc pdb',
    'application/x-rar-compressed,2048,rar',
    'application/x-redhat-package-manager,16384,rpm',
    'application/x-sea,8192,sea',
    'application/x-shockwave-flash,256,swf',
    'application/x-stuffit,8192,sit',
    'application/x-tcl,256,tcl tk',
    'application/x-www-form-urlencoded,8,data',
    'application/x-x509-ca-cert,64,der pem crt',
    'application/x-xpinstall,512,xpi',
    'application/xhtml+xml,2048,xhtml',
    'application/xspf+xml,8192,xspf',
    'application/zip,8192,zip',

    'audio/midi,256,mid midi kar',
    'audio/mpeg,16384,mp3',
    'audio/ogg,8192,ogg',
    'audio/x-m4a,16384,m4a',
    'audio/x-realaudio,2048,ra',

    'image/gif,8192,gif',
    'image/jpeg,8192,jpeg jpg',
    'image/png,1024,png',
    'image/svg+xml,1024,svg svgz',
    'image/tiff,2048,tif tiff',
    'image/vnd.wap.wbmp,256,wbmp',
    'image/webp,8192,webp',
    'image/x-icon,256,ico',
    'image/x-jng,8192,jng',
    'image/x-ms-bmp,256,bmp',

    'text/css,512,css',
    'text/mathml,32,mml',
    'text/plain,2048,txt',
    'text/vnd.sun.j2me.app-descriptor,8192,jad',
    'text/vnd.wap.wml,8192,wml',
    'text/x-component,512,htc',
    'text/xml,512,xml',
    'text/json,2,xml',

    'video/3gpp,16384,3gpp 3gp',
    'video/mp2t,16384,ts',
    'video/mp4,32768,mp4',
    'video/mpeg,8192,mpeg mpg',
    'video/quicktime,8192,mov',
    'video/webm,32768,webm',
    'video/x-flv,4096,flv',
    'video/x-m4v,4096,m4v',
    'video/x-mng,4096,mng',
    'video/x-ms-asf,8192,asx asf',
    'video/x-ms-wmv,2048,wmv',
    'video/x-msvideo,32768,avi'
];

var extensions = {};

var filetypes = [
    {mime: ['image/jpeg'], type: 'photo'},
    {mime: ['audio/mpeg', 'audio/ogg', 'audio/ogg'], type: 'audio'},
    {mime: ['video/mp4', 'video/webm'], type: 'video'},
    {mime: ['text/html', 'text/plain'], type: 'text'},
    {mime: ['application/pdf'], type: 'pdf'}
];

function _generate_data() {
    _.each(emoji, function (object, chararcter) {
        if ('string' === typeof object) {
            object = {
                title: object
            }
        }
        else {
            object = {
                title: object[0],
                shortcuts: object.slice(1)
            }
        }
        emoji[chararcter] = object;
        object.name = object.title.toLowerCase().replace(/\s+/g, '_');
    });
    Object.freeze(emoji);

    _countries.forEach(function (country) {
        if (country._id && country.flag && country.code) {
            countries.push(country);
            country_codes.push(country.code);
        }
    });
    Object.freeze(countries);

    country_codes.sort(function (a, b) {
        return b - a;
    });
    Object.freeze(country_codes);

    var _mimes = {};
    mimes.forEach(function (mime) {
        mime = mime.split(',');
        var name = mime[0];
        mime = {
            size: mime[1] * 1024,
            ext: mime[2].split(' ')
        };
        mime.ext.forEach(function (ext) {
            extensions[ext] = name;
        });
        _mimes[name] = mime;
    });
    mimes = _mimes;
    Object.freeze(mimes);

    var _filetypes = {};
    filetypes.forEach(function (record) {
        record.mime.forEach(function (mime) {
            _filetypes[mime] = record.type;
        })
    });
    filetypes = _filetypes;
    Object.freeze(filetypes);
}

if (isNode) {
    _generate_data();
    module.exports = {
        countries: countries,
        mimes: mimes,
        extensions: extensions,
        filetypes: filetypes,
        t13n: t13n
    };
}
else {
    setImmediate(_generate_data)
}

var browser = {
    client: {},
    os: {}
};

self.isMicrosoftWindows = false;
(function () {
    if (isNode) {
        return;
    }
    var b;

    if (b = /(MSIE |Edge\/)([0-9\.]+)/.exec(navigator.userAgent)) {
        browser.client.name = 'IE';
        browser.client.version = b[2];
    }
    else if (b = /(Chrome|Firefox)\/([0-9\.]+)/.exec(navigator.userAgent)) {
        browser.client.name = b[1];
        browser.client.version = b[2];
        if (navigator.userAgent.indexOf('YaBrowser') >= 0) {
            browser.client.vendor = 'Yandex';
        }
        if (navigator.userAgent.indexOf('OPR') >= 0) {
            browser.client.vendor = 'Opera';
        }
    }
    else if (b = /Version\/([0-9\.]+).*Safari\//.exec(navigator.userAgent)) {
        browser.client.name = 'Safari';
        browser.client.version = b[1];
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
        self.isMicrosoftWindows = true;
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
            browser.os.name = b[1];
        }
        else if (navigator.userAgent.indexOf('Android') >= 0) {
            browser.os.name = 'Android';
        }
    }

    if (browser.client.version && !isNaN(browser.version)) {
        browser.client.version = +browser.version;
    }

    statistics.agent = browser;

    self.defaultConfig = {
        search: {
            delay: 250
        },
        trace: {
            history: false
        },
        socket: {
            address: 'ws://' + location.hostname + '/socket',
            wait: 800,
            error: {
                wait: 2000
            }
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
                    urls: 'stun:stun.services.mozilla.com',
                    username: 'louis@mozilla.com',
                    credential: 'webrtcdemo'
                }, {
                    urls: [
                        'stun:stun.l.google.com:19302', 'stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302',
                        'stun:stun.services.mozilla.com', 'stun:23.21.150.121']
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
})();


Object.freeze(SocketReadyState);
Object.freeze(HumanRelationship);
Object.freeze(Languages);
Object.freeze(browser);
Object.freeze(code);
Object.freeze(Scroll);
Object.freeze(Sex);
