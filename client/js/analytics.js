(function () {
    var $c = function (a) {
        this.array = a || []
    };
    $c.prototype.set = function (a) {
        this.array[a] = true
    };
    $c.prototype.encode = function () {
        for (var a = [], b = 0; b < this.array.length; b++) this.array[b] && (a[Math.floor(b / 6)] ^= 1 << b % 6);
        for (b = 0; b < a.length; b++) a[b] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".charAt(a[b] || 0);
        return a.join("") + "~"
    };
    var features = new $c;

    function unavailable(a) {
        features.set(a)
    }

    var Nd = function (a, b) {
            var c = new $c(Dd(a));
            c.set(b);
            a.set(Gd, c.array)
        },
        Td = function (a) {
            a = Dd(a);
            a = new $c(a);
            for (var b = features.array.slice(), c = 0; c < a.array.length; c++) b[c] = b[c] || a.array[c];
            return (new $c(b)).encode()
        },
        Dd = function (a) {
            a = a.get(Gd);
            isArray(a) || (a = []);
            return a
        };
    var isFunction = function (a) {
            return "function" == typeof a
        },
        isArray = function (a) {
            return "[object Array]" == Object.prototype.toString.call(Object(a))
        },
        isString = function (a) {
            return void 0 != a && -1 < (a.constructor + "").indexOf("String")
        },
        startsWith = function (a, b) {
            return 0 == a.indexOf(b)
        },
        trim = function (a) {
            return a ? a.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "") : ""
        },
        createImage = function (src) {
            var b = document.createElement("img");
            b.width = 1;
            b.height = 1;
            b.src = src;
            return b
        },
        noop = function () {
        },
        encode = function (a) {
            if (encodeURIComponent instanceof Function) return encodeURIComponent(a);
            unavailable(28);
            return a
        },
        listen = function (emitter, type, listener, useCapture) {
            try {
                emitter.addEventListener ? emitter.addEventListener(type, listener, !!useCapture) : emitter.attachEvent && emitter.attachEvent("on" + type, listener)
            } catch (e) {
                unavailable(27)
            }
        },
        f = /^[\w\-:/.?=&%!]+$/,
        wa = function (a, b, c) {
            a && (c ? (c = "", b && f.test(b) && (c = ' id="' + b + '"'), f.test(a) && document.write("<script" + c + ' src="' + a + '">\x3c/script>')) : (c = document.createElement("script"), c.type = "text/javascript", c.async = true, c.src = a, b && (c.id = b), a = document.getElementsByTagName("script")[0], a.parentNode.insertBefore(c, a)))
        },
        isHTTPS = function () {
            return "https:" == document.location.protocol
        },
        getHostname = function () {
            var a =
                "" + document.location.hostname;
            return 0 == a.indexOf("www.") ? a.substring(4) : a
        },
        removeProtocol = function (a) {
            var b = document.referrer;
            if (/^https?:\/\//i.test(b)) {
                if (a) return b;
                a = "//" + document.location.hostname;
                var c = b.indexOf(a);
                if (5 == c || 6 == c)
                    if (a = b.charAt(c + a.length), "/" == a || "?" == a || "" == a || ":" == a) return;
                return b
            }
        },
        za = function (a, b) {
            if (1 == b.length && null != b[0] && "object" === typeof b[0]) return b[0];
            for (var c = {}, d = Math.min(a.length + 1, b.length), e = 0; e < d; e++)
                if ("object" === typeof b[e]) {
                    for (var g in b[e]) {
                        b[e].hasOwnProperty(g) && (c[g] = b[e][g]);
                    }
                    break
                } else if (e < a.length) {
                    c[a[e]] = b[e];
                }
            return c
        };
    var SomeMap = function () {
        this.keys = [];
        this.values = {};
        this.m = {}
    };
    SomeMap.prototype.set = function (a, b, c) {
        this.keys.push(a);
        c ? this.m[":" + a] = b : this.values[":" + a] = b
    };
    SomeMap.prototype.get = function (a) {
        return this.m.hasOwnProperty(":" + a) ? this.m[":" + a] : this.values[":" + a]
    };
    SomeMap.prototype.map = function (a) {
        for (var b = 0; b < this.keys.length; b++) {
            var c = this.keys[b],
                d = this.get(c);
            d && a(c, d)
        }
    };

    var Aa = function (a) {
        var b = window._gaUserPrefs;
        if (b && b.ioo && b.ioo() || a && true === window["ga-disable-" + a]) return true;
        try {
            var c = window.external;
            if (c && c._gaUserPrefs && "oo" == c._gaUserPrefs) return true;
        } catch (d) {
        }
        return false;
    };
    var Ca = function (a) {
            var b = [],
                c = document.cookie.split(";");
            a = new RegExp("^\\s*" + a + "=\\s*(.*?)\\s*$");
            for (var d = 0; d < c.length; d++) {
                var e = c[d].match(a);
                e && b.push(e[1])
            }
            return b
        },
        zc = function (a, b, c, d, e, g) {
            e = Aa(e) ? false : doubleClickHostRegex.test(document.location.hostname) || "/" == c && googleHostRegex.test(d) ? false : true;
            if (!e) return false;
            b && 1200 < b.length && (b = b.substring(0, 1200), unavailable(24));
            c = a + "=" + b + "; path=" + c + "; ";
            g && (c += "expires=" + (new Date((new Date).getTime() + g)).toGMTString() + "; ");
            d && "none" != d && (c += "domain=" + d + ";");
            d = document.cookie;
            document.cookie = c;
            if (!(d = d != document.cookie)) a: {
                a =
                    Ca(a);
                for (d = 0; d < a.length; d++)
                    if (b == a[d]) {
                        d = true;
                        break a
                    }
                d = false
            }
            return d
        },
        Cc = function (a) {
            return encode(a).replace(/\(/g, "%28").replace(/\)/g, "%29")
        },
        googleHostRegex = /^(www\.)?google(\.com?)?(\.[a-z]{2})?$/,
        doubleClickHostRegex = /(^|\.)doubleclick\.net$/i;
    var getGoogleAnalyticsOrigin = function () {
            return (Ba || isHTTPS() ? "https:" : "http:") + "//www.google-analytics.com"
        },
        Da = function (a) {
            this.name = "len";
            this.message = a + "-8192"
        },
        ba = function (a, b, c) {
            c = c || noop;
            if (2036 >= b.length) loadSomeImage(a, b, c);
            else if (8192 >= b.length) sendBeacon(a, b, c) || ajax_post(a, b, c) || loadSomeImage(a, b, c);
            else throw ge("len", b.length), new Da(b.length);
        },
        loadSomeImage = function (a, b, c) {
            var d = createImage(a + "?" + b);
            d.onload = d.onerror = function () {
                d.onload = null;
                d.onerror = null;
                c()
            }
        },
        ajax_post = function (a, b, c) {
            var d = window.XMLHttpRequest;
            if (!d) return false;
            var e = new d;
            if (!("withCredentials" in e)) return false;
            e.open("POST", a, true);
            e.withCredentials = true;
            e.setRequestHeader("Content-Type", "text/plain");
            e.onreadystatechange = function () {
                4 == e.readyState && (c(), e = null)
            };
            e.send(b);
            return true
        },
        sendBeacon = function (a, b, c) {
            return window.navigator.sendBeacon ? window.navigator.sendBeacon(a, b) ? (c(), true) : false : false
        },
        ge = function (a, b, c) {
            1 <= 100 * Math.random() || Aa("?") || (a = ["t=error", "_e=" + a, "_v=j44", "sr=1"], b && a.push("_f=" + b), c && a.push("_m=" + encode(c.substring(0, 100))), a.push("aip=1"), a.push("z=" + pseudoRandomInt32()), loadSomeImage(getGoogleAnalyticsOrigin() + "/collect", a.join("&"), noop))
        };
    var h = function (a) {
        var b = window.gaData = window.gaData || {};
        return b[a] = b[a] || {}
    };
    var SomeList = function () {
        this.M = []
    };
    SomeList.prototype.add = function (a) {
        this.M.push(a)
    };
    SomeList.prototype.D = function (a) {
        try {
            for (var b = 0; b < this.M.length; b++) {
                var c = a.get(this.M[b]);
                c && isFunction(c) && c.call(window, a)
            }
        } catch (d) {
        }
        b = a.get(Ia);
        b != noop && isFunction(b) && (a.set(Ia, noop, true), setTimeout(b, 10))
    };

    function Ja(a) {
        if (100 != a.get(Ka) && La(P(a, Q)) % 1E4 >= 100 * R(a, Ka)) throw "abort";
    }

    function Ma(a) {
        if (Aa(P(a, Na))) throw "abort";
    }

    function isSupportedProtocol() {
        var a = document.location.protocol;
        if ("http:" != a && "https:" != a) throw "abort";
    }

    function Pa(a) {
        try {
            window.navigator.sendBeacon ? unavailable(42) : window.XMLHttpRequest && "withCredentials" in new window.XMLHttpRequest && unavailable(40)
        } catch (c) {
        }
        a.set(ld, Td(a), true);
        a.set(Ac, R(a, Ac) + 1);
        var b = [];
        Qa.map(function (c, d) {
            if (d.F) {
                var e = a.get(c);
                void 0 != e && e != d.defaultValue && ("boolean" == typeof e && (e *= 1), b.push(d.F + "=" + encode("" + e)))
            }
        });
        b.push("z=" + randomInt32());
        a.set(Ra, b.join("&"), true)
    }

    function collect(a) {
        var b = P(a, gd) || getGoogleAnalyticsOrigin() + "/collect",
            c = P(a, fa);
        !c && a.get(Vd) && (c = "beacon");
        if (c) {
            var d = P(a, Ra),
                e = a.get(Ia),
                e = e || noop;
            "image" == c ? loadSomeImage(b, d, e) : "xhr" == c && ajax_post(b, d, e) || "beacon" == c && sendBeacon(b, d, e) || ba(b, d, e)
        } else ba(b, P(a, Ra), a.get(Ia));
        b = a.get(Na);
        b = h(b);
        c = b.hitcount;
        b.hitcount = c ? c + 1 : 1;
        b = a.get(Na);
        delete h(b).pending_experiments;
        a.set(Ia, noop, true)
    }

    function Hc(a) {
        (window.gaData = window.gaData || {}).expId && a.set(Nc, (window.gaData = window.gaData || {}).expId);
        (window.gaData = window.gaData || {}).expVar && a.set(Oc, (window.gaData = window.gaData || {}).expVar);
        var b;
        var c = a.get(Na);
        if (c = h(c).pending_experiments) {
            var d = [];
            for (b in c) c.hasOwnProperty(b) && c[b] && d.push(encodeURIComponent(b) + "." + encodeURIComponent(c[b]));
            b = d.join("!")
        } else b = void 0;
        b && a.set(m, b, true)
    }

    function previewLoadPurpose() {
        if (window.navigator && "preview" == window.navigator.loadPurpose) throw "abort";
    }

    function yd(a) {
        var b = window.gaDevIds;
        isArray(b) && 0 != b.length && a.set("&did", b.join(","), true)
    }

    function vb(a) {
        if (!a.get(Na)) throw "abort";
    };
    var pseudoRandomInt32 = function () {
            return Math.round(0x7FFFFFFF * Math.random())
        },
        randomInt32 = function () {
            try {
                var a = new Uint32Array(1);
                window.crypto.getRandomValues(a);
                return a[0] & 0x7FFFFFFF
            } catch (b) {
                return pseudoRandomInt32()
            }
        };

    function Ta(a) {
        var b = R(a, Ua);
        500 <= b && unavailable(15);
        var c = P(a, Va);
        if ("transaction" != c && "item" != c) {
            var c = R(a, Wa),
                d = (new Date).getTime(),
                e = R(a, Xa);
            0 == e && a.set(Xa, d);
            e = Math.round(2 * (d - e) / 1E3);
            0 < e && (c = Math.min(c + e, 20), a.set(Xa, d));
            if (0 >= c) throw "abort";
            a.set(Wa, --c)
        }
        a.set(Ua, ++b)
    }
    var Ya = function () {
            this.data = new SomeMap
        },
        Qa = new SomeMap,
        Za = [];
    Ya.prototype.get = function (a) {
        var b = $a(a),
            c = this.data.get(a);
        b && void 0 == c && (c = isFunction(b.defaultValue) ? b.defaultValue() : b.defaultValue);
        return b && b.Z ? b.Z(this, a, c) : c
    };
    var P = function (a, b) {
            var c = a.get(b);
            return void 0 == c ? "" : "" + c
        },
        R = function (a, b) {
            var c = a.get(b);
            return void 0 == c || "" === c ? 0 : 1 * c
        };
    Ya.prototype.set = function (a, b, c) {
        if (a)
            if ("object" == typeof a)
                for (var d in a) a.hasOwnProperty(d) && ab(this, d, a[d], c);
            else ab(this, a, b, c)
    };
    var ab = function (a, b, c, d) {
            if (void 0 != c) switch (b) {
                case Na:
                    wb.test(c)
            }
            var e = $a(b);
            e && e.o ? e.o(a, b, c, d) : a.data.set(b, c, d)
        },
        bb = function (a, b, c, d, e) {
            this.name = a;
            this.F = b;
            this.Z = d;
            this.o = e;
            this.defaultValue = c
        },
        $a = function (a) {
            var b = Qa.get(a);
            if (!b)
                for (var c = 0; c < Za.length; c++) {
                    var d = Za[c],
                        e = d[0].exec(a);
                    if (e) {
                        b = d[1](e);
                        Qa.set(b.name, b);
                        break
                    }
                }
            return b
        },
        yc = function (a) {
            var b;
            Qa.map(function (c, d) {
                d.F == a && (b = d)
            });
            return b && b.name
        },
        S = function (a, b, c, d, e) {
            a = new bb(a, b, c, d, e);
            Qa.set(a.name, a);
            return a.name
        },
        cb = function (a,
                       b) {
            Za.push([new RegExp("^" + a + "$"), b])
        },
        T = function (a, b, c) {
            return S(a, b, c, void 0, db)
        },
        db = function () {
        };
    var gb = isString(window.GoogleAnalyticsObject) && trim(window.GoogleAnalyticsObject) || "ga",
        Ba = false,
        hb = T("apiVersion", "v"),
        ib = T("clientVersion", "_v");
    S("anonymizeIp", "aip");
    var jb = S("adSenseId", "a"),
        Va = S("hitType", "t"),
        Ia = S("hitCallback"),
        Ra = S("hitPayload");
    S("nonInteraction", "ni");
    S("currencyCode", "cu");
    S("dataSource", "ds");
    var Vd = S("useBeacon", void 0, false),
        fa = S("transport");
    S("sessionControl", "sc", "");
    S("sessionGroup", "sg");
    S("queueTime", "qt");
    var Ac = S("_s", "_s");
    S("screenName", "cd");
    var kb = S("location", "dl", ""),
        lb = S("referrer", "dr"),
        mb = S("page", "dp", "");
    S("hostname", "dh");
    var nb = S("language", "ul"),
        ob = S("encoding", "de");
    S("title", "dt", function () {
        return document.title || void 0
    });
    cb("contentGroup([0-9]+)", function (a) {
        return new bb(a[0], "cg" + a[1])
    });
    var pb = S("screenColors", "sd"),
        qb = S("screenResolution", "sr"),
        rb = S("viewportSize", "vp"),
        sb = S("javaEnabled", "je"),
        tb = S("flashVersion", "fl");
    S("campaignId", "ci");
    S("campaignName", "cn");
    S("campaignSource", "cs");
    S("campaignMedium", "cm");
    S("campaignKeyword", "ck");
    S("campaignContent", "cc");
    var ub = S("eventCategory", "ec"),
        xb = S("eventAction", "ea"),
        yb = S("eventLabel", "el"),
        zb = S("eventValue", "ev"),
        Bb = S("socialNetwork", "sn"),
        Cb = S("socialAction", "sa"),
        Db = S("socialTarget", "st"),
        Eb = S("l1", "plt"),
        Fb = S("l2", "pdt"),
        Gb = S("l3", "dns"),
        Hb = S("l4", "rrt"),
        Ib = S("l5", "srt"),
        Jb = S("l6", "tcp"),
        Kb = S("l7", "dit"),
        Lb = S("l8", "clt"),
        Mb = S("timingCategory", "utc"),
        Nb = S("timingVar", "utv"),
        Ob = S("timingLabel", "utl"),
        Pb = S("timingValue", "utt");
    S("appName", "an");
    S("appVersion", "av", "");
    S("appId", "aid", "");
    S("appInstallerId", "aiid", "");
    S("exDescription", "exd");
    S("exFatal", "exf");
    var Nc = S("expId", "xid"),
        Oc = S("expVar", "xvar"),
        m = S("exp", "exp"),
        Rc = S("_utma", "_utma"),
        Sc = S("_utmz", "_utmz"),
        Tc = S("_utmht", "_utmht"),
        Ua = S("_hc", void 0, 0),
        Xa = S("_ti", void 0, 0),
        Wa = S("_to", void 0, 20);
    cb("dimension([0-9]+)", function (a) {
        return new bb(a[0], "cd" + a[1])
    });
    cb("metric([0-9]+)", function (a) {
        return new bb(a[0], "cm" + a[1])
    });
    S("linkerParam", void 0, void 0, Bc, db);
    var ld = S("usage", "_u"),
        Gd = S("_um");
    S("forceSSL", void 0, void 0, function () {
        return Ba
    }, function (a, b, c) {
        unavailable(34);
        Ba = !!c
    });
    var ed = S("_j1", "jid");
    cb("\\&(.*)", function (a) {
        var b = new bb(a[0], a[1]),
            c = yc(a[0].substring(1));
        c && (b.Z = function (a) {
            return a.get(c)
        }, b.o = function (a, b, g, ca) {
            a.set(c, g, ca)
        }, b.F = void 0);
        return b
    });
    var Qb = T("_oot"),
        dd = S("previewTask"),
        Rb = S("checkProtocolTask"),
        md = S("validationTask"),
        Sb = S("checkStorageTask"),
        Uc = S("historyImportTask"),
        Tb = S("samplerTask"),
        Vb = S("_rlt"),
        Wb = S("buildHitTask"),
        Xb = S("sendHitTask"),
        Vc = S("ceTask"),
        zd = S("devIdTask"),
        Cd = S("timingTask"),
        Ld = S("displayFeaturesTask"),
        V = T("name"),
        Q = T("clientId", "cid"),
        n = T("clientIdTime"),
        Ad = S("userId", "uid"),
        Na = T("trackingId", "tid"),
        U = T("cookieName", void 0, "_ga"),
        W = T("cookieDomain"),
        Yb = T("cookiePath", void 0, "/"),
        Zb = T("cookieExpires", void 0, 63072E3),
        $b = T("legacyCookieDomain"),
        Wc = T("legacyHistoryImport", void 0, true),
        ac = T("storage", void 0, "cookie"),
        bc = T("allowLinker", void 0, false),
        cc = T("allowAnchor", void 0, true),
        Ka = T("sampleRate", "sf", 100),
        dc = T("siteSpeedSampleRate", void 0, 1),
        ec = T("alwaysSendReferrer", void 0, false),
        gd = S("transportUrl"),
        Md = S("_r", "_r");

    function X(a, b, c, d) {
        b[a] = function () {
            try {
                return d && unavailable(d), c.apply(this, arguments)
            } catch (b) {
                throw ge("exc", a, b && b.name), b;
            }
        }
    };
    var Od = function () {
            this.V = 1E4;
            this.fa = void 0;
            this.$ = false;
            this.ea = 1
        },
        Ed = function () {
            var a = new Od,
                b;
            if (a.fa && a.$) return 0;
            a.$ = true;
            if (0 == a.V) return 0;
            void 0 === b && (b = randomInt32());
            return 0 == b % a.V ? Math.floor(b / a.V) % a.ea + 1 : 0
        };

    function shockwaveFlash() {
        var a, b, c;
        if ((c = (c = window.navigator) ? c.plugins : null) && c.length)
            for (var d = 0; d < c.length && !b; d++) {
                var e = c[d];
                -1 < e.name.indexOf("Shockwave Flash") && (b = e.description)
            }
        if (!b) try {
            a = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7"), b = a.GetVariable("$version")
        } catch (g) {
        }
        if (!b) try {
            a = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6"), b = "WIN 6,0,21,0", a.AllowScriptAccess = "always", b = a.GetVariable("$version")
        } catch (g) {
        }
        if (!b) try {
            a = new ActiveXObject("ShockwaveFlash.ShockwaveFlash"), b = a.GetVariable("$version")
        } catch (g) {
        }
        b &&
        (a = b.match(/[\d]+/g)) && 3 <= a.length && (b = a[0] + "." + a[1] + " r" + a[2]);
        return b || void 0
    };
    var gc = function (a, b) {
            var c = Math.min(R(a, dc), 100);
            if (!(La(P(a, Q)) % 100 >= c) && (c = {}, Ec(c) || Fc(c))) {
                var d = c[Eb];
                void 0 == d || Infinity == d || isNaN(d) || (0 < d ? (notNegative(c, Gb), notNegative(c, Jb), notNegative(c, Ib), notNegative(c, Fb), notNegative(c, Hb), notNegative(c, Kb), notNegative(c, Lb), b(c)) : listen(window, "load", function () {
                    gc(a, b)
                }, false))
            }
        },
        Ec = function (a) {
            var b = window.performance || window.webkitPerformance,
                b = b && b.timing;
            if (!b) return false;
            var c = b.navigationStart;
            if (0 == c) return false;
            a[Eb] = b.loadEventStart - c;
            a[Gb] = b.domainLookupEnd - b.domainLookupStart;
            a[Jb] = b.connectEnd - b.connectStart;
            a[Ib] = b.responseStart - b.requestStart;
            a[Fb] = b.responseEnd - b.responseStart;
            a[Hb] = b.fetchStart - c;
            a[Kb] = b.domInteractive - c;
            a[Lb] = b.domContentLoadedEventStart - c;
            return true
        },
        Fc = function (a) {
            if (window.top != window) return false;
            var b = window.external,
                c = b && b.onloadT;
            b && !b.isValidLoadTime && (c = void 0);
            0x80000000 < c && (c = void 0);
            0 < c && b.setPageReadyTime();
            if (void 0 == c) return false;
            a[Eb] = c;
            return true
        },
        notNegative = function (a, b) {
            var c = a[b];
            if (isNaN(c) || Infinity == c || 0 > c) a[b] = void 0
        },
        Fd = function (a) {
            return function (b) {
                "pageview" != b.get(Va) || a.I || (a.I = true, gc(b, function (b) {
                    a.send("timing", b)
                }))
            }
        };
    var hc = false,
        mc = function (a) {
            if ("cookie" == P(a, ac)) {
                var b = P(a, U),
                    c = nd(a),
                    d = kc(P(a, Yb)),
                    e = lc(P(a, W)),
                    g = 1E3 * R(a, Zb),
                    ca = P(a, Na);
                if ("auto" != e) zc(b, c, d, e, ca, g) && (hc = true);
                else {
                    unavailable(32);
                    var l;
                    a: {
                        c = [];
                        e = getHostname().split(".");
                        if (4 == e.length && (l = e[e.length - 1], parseInt(l, 10) == l)) {
                            l = ["none"];
                            break a
                        }
                        for (l = e.length - 2; 0 <= l; l--) c.push(e.slice(l).join("."));
                        c.push("none");
                        l = c
                    }
                    for (var k = 0; k < l.length; k++)
                        if (e = l[k], a.data.set(W, e), c = nd(a), zc(b, c, d, e, ca, g)) {
                            hc = true;
                            return
                        }
                    a.data.set(W, "auto")
                }
            }
        },
        nc = function (a) {
            if ("cookie" == P(a, ac) && !hc && (mc(a), !hc)) throw "abort";
        },
        Yc = function (a) {
            if (a.get(Wc)) {
                var b = P(a, W),
                    c = P(a, $b) || getHostname(),
                    d = Xc("__utma", c, b);
                d && (unavailable(19), a.set(Tc, (new Date).getTime(), true), a.set(Rc, d.R), (b = Xc("__utmz", c, b)) && d.hash == b.hash && a.set(Sc, b.R))
            }
        },
        nd = function (a) {
            var b = Cc(P(a, Q)),
                c = lc(P(a, W)).split(".").length;
            a = jc(P(a, Yb));
            1 < a && (c += "-" + a);
            return ["GA1", c, b].join(".")
        },
        Gc = function (a, b, c) {
            for (var d = [], e = [], g, ca = 0; ca < a.length; ca++) {
                var l = a[ca];
                l.H[c] == b ? d.push(l) : void 0 == g || l.H[c] < g ? (e = [l], g = l.H[c]) : l.H[c] == g && e.push(l)
            }
            return 0 <
            d.length ? d : e
        },
        lc = function (a) {
            return 0 == a.indexOf(".") ? a.substr(1) : a
        },
        kc = function (a) {
            if (!a) return "/";
            1 < a.length && a.lastIndexOf("/") == a.length - 1 && (a = a.substr(0, a.length - 1));
            0 != a.indexOf("/") && (a = "/" + a);
            return a
        },
        jc = function (a) {
            a = kc(a);
            return "/" == a ? 1 : a.split("/").length
        };

    function Xc(a, b, c) {
        "none" == b && (b = "");
        var d = [],
            e = Ca(a);
        a = "__utma" == a ? 6 : 2;
        for (var g = 0; g < e.length; g++) {
            var ca = ("" + e[g]).split(".");
            ca.length >= a && d.push({
                hash: ca[0],
                R: e[g],
                O: ca
            })
        }
        return 0 == d.length ? void 0 : 1 == d.length ? d[0] : Zc(b, d) || Zc(c, d) || Zc(null, d) || d[0]
    }

    function Zc(a, b) {
        var c, d;
        null == a ? c = d = 1 : (c = La(a), d = La(startsWith(a, ".") ? a.substring(1) : "." + a));
        for (var e = 0; e < b.length; e++)
            if (b[e].hash == c || b[e].hash == d) return b[e]
    };
    var hostnameRegex = new RegExp(/^https?:\/\/([^\/:]+)/),
        pd = /(.*)([?&#])(?:_ga=[^&#]*)(?:&?)(.*)/;

    function Bc(a) {
        a = a.get(Q);
        var b = Ic(a, 0);
        return "_ga=1." + encode(b + "." + a)
    }

    function Ic(a, b) {
        for (var c = new Date, d = window.navigator, e = d.plugins || [], c = [a, d.userAgent, c.getTimezoneOffset(), c.getYear(), c.getDate(), c.getHours(), c.getMinutes() + b], d = 0; d < e.length; ++d) c.push(e[d].description);
        return La(c.join("."))
    }

    var Dc = function (a) {
        unavailable(48);
        this.target = a;
        this.T = false
    };
    Dc.prototype.ca = function (a, b) {
        if (a.tagName) {
            if ("a" == a.tagName.toLowerCase()) {
                a.href && (a.href = qd(this, a.href, b));
                return
            }
            if ("form" == a.tagName.toLowerCase()) return rd(this, a)
        }
        if ("string" == typeof a) return qd(this, a, b)
    };
    var qd = function (a, b, c) {
            var d = pd.exec(b);
            d && 3 <= d.length && (b = d[1] + (d[3] ? d[2] + d[3] : ""));
            a = a.target.get("linkerParam");
            var e = b.indexOf("?"),
                d = b.indexOf("#");
            c ? b += (-1 == d ? "#" : "&") + a : (c = -1 == e ? "?" : "&", b = -1 == d ? b + (c + a) : b.substring(0, d) + c + a + b.substring(d));
            return b = b.replace(/&+_ga=/, "&_ga=")
        },
        rd = function (a, b) {
            if (b && b.action) {
                var c = a.target.get("linkerParam").split("=")[1];
                if ("get" == b.method.toLowerCase()) {
                    for (var d = b.childNodes || [], e = 0; e < d.length; e++)
                        if ("_ga" == d[e].name) {
                            d[e].setAttribute("value", c);
                            return
                        }
                    d =
                        document.createElement("input");
                    d.setAttribute("type", "hidden");
                    d.setAttribute("name", "_ga");
                    d.setAttribute("value", c);
                    b.appendChild(d)
                } else "post" == b.method.toLowerCase() && (b.action = qd(a, b.action))
            }
        };
    Dc.prototype.S = function (a, b, c) {
        function d(c) {
            try {
                c = c || window.event;
                var d;
                a: {
                    var g = c.target || c.srcElement;
                    for (c = 100; g && 0 < c;) {
                        if (g.href && g.nodeName.match(/^a(?:rea)?$/i)) {
                            d = g;
                            break a
                        }
                        g = g.parentNode;
                        c--
                    }
                    d = {}
                }
                ("http:" == d.protocol || "https:" == d.protocol) && sd(a, d.hostname || "") && d.href && (d.href = qd(e, d.href, b))
            } catch (w) {
                unavailable(26)
            }
        }

        var e = this;
        this.T || (this.T = true, listen(document, "mousedown", d, false), listen(document, "keyup", d, false));
        if (c) {
            c = function (b) {
                b = b || window.event;
                if ((b = b.target || b.srcElement) && b.action) {
                    var c = b.action.match(hostnameRegex);
                    c && sd(a, c[1]) && rd(e,
                        b)
                }
            };
            for (var g = 0; g < document.forms.length; g++) listen(document.forms[g], "submit", c)
        }
    };

    function sd(a, b) {
        if (b == document.location.hostname) return false;
        for (var c = 0; c < a.length; c++)
            if (a[c] instanceof RegExp) {
                if (a[c].test(b)) return true
            } else if (0 <= b.indexOf(a[c])) return true;
        return false
    };
    var p = /^(GTM|OPT)-[A-Z0-9]+$/,
        q = /;_gaexp=[^;]*/g,
        r = /;((__utma=)|([^;=]+=GAX?\d+\.))[^;]*/g,
        t = function (a) {
            function b(a, b) {
                b && (c += "&" + a + "=" + encode(b))
            }

            var c = "https://www.google-analytics.com/gtm/js?id=" + encode(a.id);
            "dataLayer" != a.B && b("l", a.B);
            b("t", a.target);
            b("cid", a.ja);
            b("cidt", a.ka);
            b("gac", a.la);
            b("aip", a.ia);
            a.na && b("m", "sync");
            b("cycle", a.G);
            return c
        };
    var Jd = function (a, b, c) {
            this.U = ed;
            this.aa = b;
            (b = c) || (b = (b = P(a, V)) && "t0" != b ? Wd.test(b) ? "_gat_" + Cc(P(a, Na)) : "_gat_" + Cc(b) : "_gat");
            this.Y = b
        },
        Rd = function (a, b) {
            var c = b.get(Wb);
            b.set(Wb, function (b) {
                Pd(a, b);
                var d = c(b);
                Qd(a, b);
                return d
            });
            var d = b.get(Xb);
            b.set(Xb, function (b) {
                var c = d(b);
                Id(a, b);
                return c
            })
        },
        Pd = function (a, b) {
            b.get(a.U) || ("1" == Ca(a.Y)[0] ? b.set(a.U, "", true) : b.set(a.U, "" + pseudoRandomInt32(), true))
        },
        Qd = function (a, b) {
            b.get(a.U) && zc(a.Y, "1", b.get(Yb), b.get(W), b.get(Na), 6E5)
        },
        Id = function (a, b) {
            if (b.get(a.U)) {
                var c = new SomeMap,
                    d = function (a) {
                        $a(a).F && c.set($a(a).F, b.get(a))
                    };
                d(hb);
                d(ib);
                d(Na);
                d(Q);
                d(Ad);
                d(a.U);
                c.set($a(ld).F, Td(b));
                var e = a.aa;
                c.map(function (a, b) {
                    e += encode(a) + "=";
                    e += encode("" + b) + "&"
                });
                e += "z=" + pseudoRandomInt32();
                createImage(e);
                b.set(a.U, "", true)
            }
        },
        Wd = /^gtm\d+$/;
    var fd = function (a, b) {
        var c = a.b;
        if (!c.get("dcLoaded")) {
            Nd(c, 29);
            b = b || {};
            var d;
            b[U] && (d = Cc(b[U]));
            d = new Jd(c, "https://stats.g.doubleclick.net/r/collect?t=dc&aip=1&_r=3&", d);
            Rd(d, c);
            c.set("dcLoaded", true)
        }
    };
    var Sd = function (a) {
        if (!a.get("dcLoaded") && "cookie" == a.get(ac)) {
            Nd(a, 51);
            var b = new Jd(a);
            Pd(b, a);
            Qd(b, a);
            a.get(b.U) && (a.set(Md, 1, true), a.set(gd, getGoogleAnalyticsOrigin() + "/r/collect", true))
        }
    };
    var Lc = function () {
        var a = window.gaGlobal = window.gaGlobal || {};
        return a.hid = a.hid || pseudoRandomInt32()
    };
    var ad, bd = function (a, b, c) {
        if (!ad) {
            var d;
            d = document.location.hash;
            var e = window.name,
                g = /^#?gaso=([^&]*)/;
            if (e = (d = (d = d && d.match(g) || e && e.match(g)) ? d[1] : Ca("GASO")[0] || "") && d.match(/^(?:!([-0-9a-z.]{1,40})!)?([-.\w]{10,1200})$/i)) zc("GASO", "" + d, c, b, a, 0), window._udo || (window._udo = b), window._utcp || (window._utcp = c), a = e[1], wa("https://www.google.com/analytics/web/inpage/pub/inpage.js?" + (a ? "prefix=" + a + "&" : "") + pseudoRandomInt32(), "_gasojs");
            ad = true
        }
    };
    var wb = /^(UA|YT|MO|GP)-(\d+)-(\d+)$/,
        pc = function (a) {
            function b(a, b) {
                d.b.data.set(a, b)
            }

            function c(a, c) {
                b(a, c);
                d.filters.add(a)
            }

            var d = this;
            this.b = new Ya;
            this.filters = new SomeList;
            b(V, a[V]);
            b(Na, trim(a[Na]));
            b(U, a[U]);
            b(W, a[W] || getHostname());
            b(Yb, a[Yb]);
            b(Zb, a[Zb]);
            b($b, a[$b]);
            b(Wc, a[Wc]);
            b(bc, a[bc]);
            b(cc, a[cc]);
            b(Ka, a[Ka]);
            b(dc, a[dc]);
            b(ec, a[ec]);
            b(ac, a[ac]);
            b(Ad, a[Ad]);
            b(n, a[n]);
            b(hb, 1);
            b(ib, "j44");
            c(Qb, Ma);
            c(dd, previewLoadPurpose);
            c(Rb, isSupportedProtocol);
            c(md, vb);
            c(Sb, nc);
            c(Uc, Yc);
            c(Tb, Ja);
            c(Vb, Ta);
            c(Vc, Hc);
            c(zd, yd);
            c(Ld, Sd);
            c(Wb, Pa);
            c(Xb, collect);
            c(Cd, Fd(this));
            Jc(this.b, a[Q]);
            Kc(this.b);
            this.b.set(jb, Lc());
            bd(this.b.get(Na), this.b.get(W), this.b.get(Yb))
        },
        Jc = function (a, b) {
            if ("cookie" == P(a, ac)) {
                hc = false;
                var c;
                b: {
                    var d = Ca(P(a, U));
                    if (d && !(1 > d.length)) {
                        c = [];
                        for (var e = 0; e < d.length; e++) {
                            var g;
                            g = d[e].split(".");
                            var ca = g.shift();
                            ("GA1" == ca || "1" == ca) && 1 < g.length ? (ca = g.shift().split("-"), 1 == ca.length && (ca[1] = "1"), ca[0] *= 1, ca[1] *= 1, g = {
                                H: ca,
                                s: g.join(".")
                            }) : g = void 0;
                            g && c.push(g)
                        }
                        if (1 == c.length) {
                            unavailable(13);
                            c = c[0].s;
                            break b
                        }
                        if (0 == c.length) unavailable(12);
                        else {
                            unavailable(14);
                            d = lc(P(a,
                                W)).split(".").length;
                            c = Gc(c, d, 0);
                            if (1 == c.length) {
                                c = c[0].s;
                                break b
                            }
                            d = jc(P(a, Yb));
                            c = Gc(c, d, 1);
                            c = c[0] && c[0].s;
                            break b
                        }
                    }
                    c = void 0
                }
                c || (c = P(a, W), d = P(a, $b) || getHostname(), c = Xc("__utma", d, c), void 0 != c ? (unavailable(10), c = c.O[1] + "." + c.O[2]) : c = void 0);
                c && (a.data.set(Q, c), hc = true)
            }
            c = a.get(cc);
            if (e = (c = document.location[c ? "href" : "search"].match("(?:&|#|\\?)" + encode("_ga").replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1") + "=([^&#]*)")) && 2 == c.length ? c[1] : "") a.get(bc) ? (c = e.indexOf("."), -1 == c ? unavailable(22) : (d = e.substring(c + 1), "1" != e.substring(0, c) ? unavailable(22) : (c = d.indexOf("."), -1 == c ? unavailable(22) : (e = d.substring(0, c), c = d.substring(c + 1), e != Ic(c, 0) && e != Ic(c, -1) && e != Ic(c, -2) ? unavailable(23) : (unavailable(11), a.data.set(Q, c)))))) : unavailable(21);
            b && (unavailable(9), a.data.set(Q, encode(b)));
            if (!a.get(Q))
                if (c = (c = window.gaGlobal && window.gaGlobal.vid) && -1 != c.search(/^(?:utma\.)?\d+\.\d+$/) ? c : void 0) unavailable(17), a.data.set(Q, c);
                else {
                    unavailable(8);
                    c = window.navigator.userAgent + (document.cookie ? document.cookie : "") + (document.referrer ? document.referrer : "");
                    d = c.length;
                    for (e = window.history.length; 0 < e;) c += e-- ^ d++;
                    a.data.set(Q, [pseudoRandomInt32() ^ La(c) & 0x7FFFFFFF, Math.round((new Date).getTime() / 1E3)].join("."))
                }
            mc(a)
        },
        Kc = function (a) {
            var b = window.navigator,
                c = window.screen,
                d = document.location;
            a.set(lb, removeProtocol(a.get(ec)));
            if (d) {
                var e = d.pathname || "";
                "/" != e.charAt(0) && (unavailable(31), e = "/" + e);
                a.set(kb, d.protocol + "//" + d.hostname + e + d.search)
            }
            c && a.set(qb, c.width + "x" + c.height);
            c && a.set(pb, c.colorDepth + "-bit");
            var c = document.documentElement,
                g = (e = document.body) && e.clientWidth && e.clientHeight,
                ca = [];
            c && c.clientWidth && c.clientHeight && ("CSS1Compat" === document.compatMode || !g) ? ca = [c.clientWidth, c.clientHeight] : g && (ca = [e.clientWidth, e.clientHeight]);
            c = 0 >= ca[0] || 0 >= ca[1] ? "" : ca.join("x");
            a.set(rb, c);
            a.set(tb, shockwaveFlash());
            a.set(ob, document.characterSet || document.charset);
            a.set(sb, b && "function" === typeof b.javaEnabled && b.javaEnabled() || false);
            a.set(nb, (b && (b.language || b.browserLanguage) || "").toLowerCase());
            if (d && a.get(cc) && (b = document.location.hash)) {
                b = b.split(/[?&#]+/);
                d = [];
                for (c = 0; c < b.length; ++c)(startsWith(b[c], "utm_id") || startsWith(b[c], "utm_campaign") || startsWith(b[c], "utm_source") || startsWith(b[c], "utm_medium") || startsWith(b[c], "utm_term") || startsWith(b[c], "utm_content") || startsWith(b[c], "gclid") || startsWith(b[c], "dclid") || startsWith(b[c], "gclsrc")) && d.push(b[c]);
                0 < d.length && (b = "#" + d.join("&"),
                    a.set(kb, a.get(kb) + b))
            }
        };
    pc.prototype.get = function (a) {
        return this.b.get(a)
    };
    pc.prototype.set = function (a, b) {
        this.b.set(a, b)
    };
    var qc = {
        pageview: [mb],
        event: [ub, xb, yb, zb],
        social: [Bb, Cb, Db],
        timing: [Mb, Nb, Pb, Ob]
    };
    pc.prototype.send = function (a) {
        if (!(1 > arguments.length)) {
            var b, c;
            "string" === typeof arguments[0] ? (b = arguments[0], c = [].slice.call(arguments, 1)) : (b = arguments[0] && arguments[0][Va], c = arguments);
            b && (c = za(qc[b] || [], c), c[Va] = b, this.b.set(c, void 0, true), this.filters.D(this.b), this.b.data.m = {})
        }
    };
    pc.prototype.ma = function (a, b) {
        var c = this;
        u(a, c, b) || (v(a, function () {
            u(a, c, b)
        }), y(String(c.get(V)), a, void 0, b, true))
    };
    var rc = function (a) {
            if ("prerender" == document.visibilityState) return false;
            a();
            return true
        },
        z = function (a) {
            if (!rc(a)) {
                unavailable(16);
                var b = false,
                    c = function () {
                        if (!b && rc(a)) {
                            b = true;
                            var d = c,
                                e = document;
                            e.removeEventListener ? e.removeEventListener("visibilitychange", d, false) : e.detachEvent && e.detachEvent("onvisibilitychange", d)
                        }
                    };
                listen(document, "visibilitychange", c)
            }
        };
    var td = /^(?:(\w+)\.)?(?:(\w+):)?(\w+)$/,
        sc = function (a) {
            if (isFunction(a[0])) this.u = a[0];
            else {
                var b = td.exec(a[0]);
                null != b && 4 == b.length && (this.c = b[1] || "t0", this.K = b[2] || "", this.C = b[3], this.a = [].slice.call(a, 1), this.K || (this.A = "create" == this.C, this.i = "require" == this.C, this.g = "provide" == this.C, this.ba = "remove" == this.C), this.i && (3 <= this.a.length ? (this.X = this.a[1], this.W = this.a[2]) : this.a[1] && (isString(this.a[1]) ? this.X = this.a[1] : this.W = this.a[1])));
                b = a[1];
                a = a[2];
                if (!this.C) throw "abort";
                if (this.i && (!isString(b) || "" == b)) throw "abort";
                if (this.g && (!isString(b) || "" == b || !isFunction(a))) throw "abort";
                if (ud(this.c) || ud(this.K)) throw "abort";
                if (this.g && "t0" != this.c) throw "abort";
            }
        };

    function ud(a) {
        return 0 <= a.indexOf(".") || 0 <= a.indexOf(":")
    };
    var Yd, Zd, $d, A;
    Yd = new SomeMap;
    $d = new SomeMap;
    A = new SomeMap;
    Zd = {
        ec: 45,
        ecommerce: 46,
        linkid: 47
    };
    var u = function (a, b, c) {
            b == N || b.get(V);
            var d = Yd.get(a);
            if (!isFunction(d)) return false;
            b.plugins_ = b.plugins_ || new SomeMap;
            if (b.plugins_.get(a)) return true;
            b.plugins_.set(a, new d(b, c || {}));
            return true
        },
        y = function (a, b, c, d, e) {
            if (!isFunction(Yd.get(b)) && !$d.get(b)) {
                Zd.hasOwnProperty(b) && unavailable(Zd[b]);
                if (p.test(b)) {
                    unavailable(52);
                    a = N.j(a);
                    if (!a) return true;
                    c = d || {};
                    d = {
                        id: b,
                        B: c.dataLayer || "dataLayer",
                        ia: !!a.get("anonymizeIp"),
                        na: e,
                        G: false
                    };
                    a.get("&gtm") == b && (d.G = true);
                    var g = String(a.get("name"));
                    "t0" != g && (d.target = g);
                    Aa(String(a.get("trackingId"))) || (d.ja = String(a.get(Q)),
                        d.ka = Number(a.get(n)), a = c.palindrome ? r : q, a = (a = document.cookie.replace(/^|(; +)/g, ";").match(a)) ? a.sort().join("").substring(1) : void 0, d.la = a);
                    a = d.B;
                    c = (new Date).getTime();
                    window[a] = window[a] || [];
                    c = {
                        "gtm.start": c
                    };
                    e || (c.event = "gtm.js");
                    window[a].push(c);
                    c = t(d)
                }
                !c && Zd.hasOwnProperty(b) ? (unavailable(39), c = b + ".js") : unavailable(43);
                c && (c && 0 <= c.indexOf("/") || (c = (Ba || isHTTPS() ? "https:" : "http:") + "//www.google-analytics.com/plugins/ua/" + c), d = ae(c), a = d.protocol, c = document.location.protocol, ("https:" == a || a == c || ("http:" != a ? 0 : "http:" == c)) && B(d) && (wa(d.url, void 0,
                    e), $d.set(b, true)))
            }
        },
        v = function (a, b) {
            var c = A.get(a) || [];
            c.push(b);
            A.set(a, c)
        },
        C = function (a, b) {
            Yd.set(a, b);
            for (var c = A.get(a) || [], d = 0; d < c.length; d++) c[d]();
            A.set(a, [])
        },
        B = function (a) {
            var b = ae(document.location.href);
            if (startsWith(a.url, "https://www.google-analytics.com/gtm/js?id=")) return true;
            if (a.query || 0 <= a.url.indexOf("?") || 0 <= a.path.indexOf("://")) return false;
            if (a.host == b.host && a.port == b.port) return true;
            b = "http:" == a.protocol ? 80 : 443;
            return "www.google-analytics.com" == a.host && (a.port || b) == b && startsWith(a.path, "/plugins/") ? true : false
        },
        ae = function (a) {
            function b(a) {
                var b = (a.hostname || "").split(":")[0].toLowerCase(),
                    c = (a.protocol || "").toLowerCase(),
                    c = 1 * a.port || ("http:" == c ? 80 : "https:" == c ? 443 : "");
                a = a.pathname || "";
                startsWith(a, "/") || (a = "/" + a);
                return [b, "" + c, a]
            }

            var c = document.createElement("a");
            c.href = document.location.href;
            var d = (c.protocol || "").toLowerCase(),
                e = b(c),
                g = c.search || "",
                ca = d + "//" + e[0] + (e[1] ? ":" + e[1] : "");
            startsWith(a, "//") ? a = d + a : startsWith(a, "/") ? a = ca + a : !a || startsWith(a, "?") ? a = ca + e[2] + (a || g) : 0 > a.split("/")[0].indexOf(":") && (a = ca + e[2].substring(0, e[2].lastIndexOf("/")) + "/" +
                a);
            c.href = a;
            d = b(c);
            return {
                protocol: (c.protocol || "").toLowerCase(),
                host: d[0],
                port: d[1],
                path: d[2],
                query: c.search || "",
                url: a || ""
            }
        };
    var Z = {
        ga: function () {
            Z.f = []
        }
    };
    Z.ga();
    Z.D = function (a) {
        var b = Z.J.apply(Z, arguments),
            b = Z.f.concat(b);
        for (Z.f = []; 0 < b.length && !Z.v(b[0]) && !(b.shift(), 0 < Z.f.length););
        Z.f = Z.f.concat(b)
    };
    Z.J = function (a) {
        for (var b = [], c = 0; c < arguments.length; c++) try {
            var d = new sc(arguments[c]);
            d.g ? C(d.a[0], d.a[1]) : (d.i && (d.ha = y(d.c, d.a[0], d.X, d.W)), b.push(d))
        } catch (e) {
        }
        return b
    };
    Z.v = function (a) {
        try {
            if (a.u) a.u.call(window, N.j("t0"));
            else {
                var b = a.c == gb ? N : N.j(a.c);
                if (a.A) "t0" == a.c && N.create.apply(N, a.a);
                else if (a.ba) N.remove(a.c);
                else if (b)
                    if (a.i) {
                        if (a.ha && (a.ha = y(a.c, a.a[0], a.X, a.W)), !u(a.a[0], b, a.W)) return true
                    } else if (a.K) {
                        var c = a.C,
                            d = a.a,
                            e = b.plugins_.get(a.K);
                        e[c].apply(e, d)
                    } else b[a.C].apply(b, a.a)
            }
        } catch (g) {
        }
    };
    var N = function (a) {
        unavailable(1);
        Z.D.apply(Z, [arguments])
    };
    N.h = {};
    N.P = [];
    N.L = 0;
    N.answer = 42;
    var uc = [Na, W, V];
    N.create = function (a) {
        var b = za(uc, [].slice.call(arguments));
        b[V] || (b[V] = "t0");
        var c = "" + b[V];
        if (N.h[c]) return N.h[c];
        b = new pc(b);
        N.h[c] = b;
        N.P.push(b);
        return b
    };
    N.remove = function (a) {
        for (var b = 0; b < N.P.length; b++)
            if (N.P[b].get(V) == a) {
                N.P.splice(b, 1);
                N.h[a] = null;
                break
            }
    };
    N.j = function (a) {
        return N.h[a]
    };
    N.getAll = function () {
        return N.P.slice(0)
    };
    N.N = function () {
        "ga" != gb && unavailable(49);
        var a = window[gb];
        if (!a || 42 != a.answer) {
            N.L = a && a.l;
            N.loaded = true;
            var b = window[gb] = N;
            X("create", b, b.create);
            X("remove", b, b.remove);
            X("getByName", b, b.j, 5);
            X("getAll", b, b.getAll, 6);
            b = pc.prototype;
            X("get", b, b.get, 7);
            X("set", b, b.set, 4);
            X("send", b, b.send);
            X("requireSync", b, b.ma);
            b = Ya.prototype;
            X("get", b, b.get);
            X("set", b, b.set);
            if (!isHTTPS() && !Ba) {
                a: {
                    for (var b = document.getElementsByTagName("script"), c = 0; c < b.length && 100 > c; c++) {
                        var d = b[c].src;
                        if (d && 0 == d.indexOf("https://www.google-analytics.com/analytics")) {
                            unavailable(33);
                            b = true;
                            break a
                        }
                    }
                    b = false
                }
                b && (Ba = true)
            }
            isHTTPS() || Ba || !Ed() || (unavailable(36), Ba = true);
            (window.gaplugins = window.gaplugins || {}).Linker = Dc;
            b = Dc.prototype;
            C("linker", Dc);
            X("decorate", b, b.ca, 20);
            X("autoLink", b, b.S, 25);
            C("displayfeatures", fd);
            C("adfeatures", fd);
            a = a && a.q;
            isArray(a) ? Z.D.apply(N, a) : unavailable(50)
        }
    };
    N.da = function () {
        for (var a = N.getAll(), b = 0; b < a.length; b++) a[b].get(V)
    };
    var E = N.N,
        F = window[gb];
    F && F.r ? E() : z(E);
    z(function () {
        Z.D(["provide", "render", noop])
    });

    function La(a) {
        var b = 1,
            c, d;
        if (a) {
            for (b = 0, d = a.length - 1; 0 <= d; d--) {
                c = a.charCodeAt(d);
                b = (b << 6 & 0xFFFFFFF) + c + (c << 14);
                c = b & 0xFE00000;
                b = 0 != c ? b ^ c >> 21 : b
            }
        }
        return b
    }
})(window);
