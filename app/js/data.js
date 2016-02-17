
var fonts = ['Arial', 'Arial Black', 'Comic Sans MS', 'Courier New',
    'Georgia', 'Impact', 'Times New Roman', 'Trebuchet MS', 'Verdana'];

var resizeCursor = [
    [0  , 0 , .2, .2, 'nw-resize'],
    [ .2, 0 , .8, .2, 'n-resize' ],
    [ .8, 0 , 1 , .2, 'ne-resize'],
    [ .8, .2, 1 , .8, 'e-resize' ],
    [ .8, .8, 1 , 1 , 'se-resize'],
    [ .2, .8, .8, 1 , 's-resize' ],
    [0 ,  .8, .2, 1 , 'sw-resize'],
    [0 ,  .2, .2, .8, 'w-resize' ],
    [ .2, .2, .8, .8, 'move' ]
];

var colours = {aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"00ffff",aquamarine:"7fffd4",azure:"f0ffff",
    beige:"f5f5dc",bisque:"ffe4c4",black:"000000",blanchedalmond:"ffebcd",blue:"0000ff",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",
    cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"00ffff",
    darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",
    darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkturquoise:"00ced1",
    darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dodgerblue:"1e90ff",
    firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"ff00ff",
    gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",
    honeydew:"f0fff0",hotpink:"ff69b4",
    indianred :"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",
    lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",
    lightgrey:"d3d3d3",lightgreen:"90ee90",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"778899",lightsteelblue:"b0c4de",
    lightyellow:"ffffe0",lime:"00ff00",limegreen:"32cd32",linen:"faf0e6",
    magenta:"ff00ff",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370d8",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",
    mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",
    navajowhite:"ffdead",navy:"000080",
    oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",
    palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"d87093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",
    red:"ff0000",rosybrown:"bc8f8f",royalblue:"4169e1",
    saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",
    tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",
    violet:"ee82ee",
    wheat:"f5deb3",white:"ffffff",whitesmoke:"f5f5f5",
    yellow:"ffff00",yellowgreen:"9acd32"};

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
    NUMPAD_0: 96,  NUMPAD_1: 97,  NUMPAD_2: 98,  NUMPAD_3: 99,  NUMPAD_4: 100,
    NUMPAD_5: 101, NUMPAD_6: 102, NUMPAD_7: 103, NUMPAD_8: 104, NUMPAD_9: 105,
    MULTIPLY: 106,
    ADD: 107,
    SUBTRACT: 109,
    DECIMAL: 110,
    DIVIDE: 111,
    F1: 112, F2: 113, F3: 114, F4:  115, F5:  116, F6:  117,
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

var htmlEntityCodes = {quot:34,amp:38,apos:39,lt:60,gt:62,nbsp:160,iexcl:161,cent:162,pound:163,curren:164,yen:165,brvbar:166,sect:167,uml:168,copy:169,ordf:170,laquo:171,not:172,shy:173,reg:174,macr:175,deg:176,plusmn:177,sup2:178,sup3:179,acute:180,micro:181,para:182,middot:183,cedil:184,sup1:185,ordm:186,raquo:187,frac14:188,frac12:189,frac34:190,iquest:191,Agrave:192,Aacute:193,Acirc:194,Atilde:195,Auml:196,Aring:197,AElig:198,Ccedil:199,Egrave:200,Eacute:201,Ecirc:202,Euml:203,Igrave:204,Iacute:205,Icirc:206,Iuml:207,ETH:208,Ntilde:209,Ograve:210,Oacute:211,Ocirc:212,Otilde:213,Ouml:214,times:215,Oslash:216,Ugrave:217,Uacute:218,Ucirc:219,Uuml:220,Yacute:221,THORN:222,szlig:223,agrave:224,aacute:225,acirc:226,atilde:227,auml:228,aring:229,aelig:230,ccedil:231,egrave:232,eacute:233,ecirc:234,euml:235,igrave:236,iacute:237,icirc:238,iuml:239,eth:240,ntilde:241,ograve:242,oacute:243,ocirc:244,otilde:245,ouml:246,divide:247,oslash:248,ugrave:249,uacute:250,ucirc:251,uuml:252,yacute:253,thorn:254,yuml:255,OElig:338,oelig:339,Scaron:352,scaron:353,Yuml:376,fnof:402,circ:710,tilde:732,Alpha:913,Beta:914,Gamma:915,Delta:916,Epsilon:917,Zeta:918,Eta:919,Theta:920,Iota:921,Kappa:922,Lambda:923,Mu:924,Nu:925,Xi:926,Omicron:927,Pi:928,Rho:929,Sigma:931,Tau:932,Upsilon:933,Phi:934,Chi:935,Psi:936,Omega:937,alpha:945,beta:946,gamma:947,delta:948,epsilon:949,zeta:950,eta:951,theta:952,iota:953,kappa:954,lambda:955,mu:956,nu:957,xi:958,omicron:959,pi:960,rho:961,sigmaf:962,sigma:963,tau:964,upsilon:965,phi:966,chi:967,psi:968,omega:969,thetasym:977,upsih:978,piv:982,ensp:8194,emsp:8195,thinsp:8201,zwnj:8204,zwj:8205,lrm:8206,rlm:8207,ndash:8211,mdash:8212,lsquo:8216,rsquo:8217,sbquo:8218,ldquo:8220,rdquo:8221,bdquo:8222,dagger:8224,Dagger:8225,bull:8226,hellip:8230,permil:8240,prime:8242,Prime:8243,lsaquo:8249,rsaquo:8250,oline:8254,frasl:8260,euro:8364,image:8465,weierp:8472,real:8476,trade:8482,alefsym:8501,larr:8592,uarr:8593,rarr:8594,darr:8595,harr:8596,crarr:8629,lArr:8656,uArr:8657,rArr:8658,dArr:8659,hArr:8660,forall:8704,part:8706,exist:8707,empty:8709,nabla:8711,isin:8712,notin:8713,ni:8715,prod:8719,sum:8721,minus:8722,lowast:8727,radic:8730,prop:8733,infin:8734,ang:8736,and:8743,or:8744,cap:8745,cup:8746,"int":8747,there4:8756,sim:8764,cong:8773,asymp:8776,ne:8800,equiv:8801,le:8804,ge:8805,sub:8834,sup:8835,nsub:8836,sube:8838,supe:8839,oplus:8853,otimes:8855,perp:8869,sdot:8901,lceil:8968,rceil:8969,lfloor:8970,rfloor:8971,lang:9001,rang:9002,loz:9674,spades:9824,clubs:9827,hearts:9829,diams:9830};


var allow_style = ["background-color", "color", "font-family", "font-size", "id",
    "line-height", "margin", "padding", "title"];

var deny_attrs = ["class"];
var deny_tags = ['br', 'img', 'table'];
var short_tags = ['a', 'b', 'i', 'u', 'sup'];
var chars_subs = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
};

var code_styles = ['3024-day', '3024-night', 'ambiance', 'ambiance-mobile', 'base16-dark',
    'base16-light', 'blackboard', 'cobalt', 'eclipse', 'elegant', 'erlang-dark', 'lesser-dark',
    'mbo', 'mdn-like', 'midnight', 'monokai', 'neat', 'neo', 'night', 'paraiso-dark',
    'paraiso-light', 'pastel-on-dark', 'rubyblue', 'solarized', 'the-matrix',
    'tomorrow-night-eighties', 'twilight', 'vibrant-ink', 'xq-dark', 'xq-light'];


var uk = {
    bold: 'Жирний',
    italic: 'Курсив',
    underline: 'Підкреслений',
    justifyCenter: 'Вирівняти по центру',
    justifyFull: 'Вирівняти по ширині',
    justifyRight: 'Вирівняти вправо',
    justifyLeft: 'Вирівняти вліво',
    indent: 'Збільшити відступ',
    outdent: 'Зменшити відступ',
    insertOrderedList: 'Вставити нумерований список',
    insertUnorderedList: 'Вставити список',
    createLink: 'Зробити посиланням',
    unlink: 'Видалити посилання',
    removeFormat: 'Видалити порматування',
    undo: 'Назад',
    redo: 'Вперед',
    fontSize: 'Розмір шрифту',
    fontFamily: 'Шрифт',
    foreColor: 'Колір тексту',
    backColor: 'Колір тла',
    pasteLink: 'Вставте посилання'
};