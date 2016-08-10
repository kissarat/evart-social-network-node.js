'use strict';

const _ = require('underscore');
const ObjectID = require('mongodb').ObjectID;
const qs = require('querystring');
const web_extension = require('./web_extension');
const mongoose = require('mongoose');
const url_parse = require('url').parse;
const errors = require('../errors');

class Context {
    constructor(options) {
        const self = this;
        _.extend(this, options);
        const now = process.hrtime();
        const req = options.req;
        this.start = now[0] * 1000000000 + now[1];
        this.isCache = req.url.indexOf('/api-cache') == 0;
        const raw_url = req.url.replace(/^\/(api|cache)?\//, '/');
        // console.log('URL', raw_url);
        req.url = this.parseURL(raw_url);
        this.params = req.url.query;
        // req.cookies = qs.parse(req.headers.cookie, /;\s+/);
        req.cookies = {};
        if ('string' == typeof req.headers.cookie) {
            req.headers.cookie.split(/;\s+/).forEach(function (item) {
                const parts = item.split('=');
                if (2 === parts.length) {
                    req.cookies[parts[0].trim()] = parts[1].trim();
                }
                else {
                    console.error('Unknown cookie ' + item)
                }
            });
        }

        if (req.url.query.auth) {
            req.auth = req.url.query.auth;
            delete req.url.query.auth;
        }
        else if (req.cookies.auth) {
            req.auth = req.cookies.auth;
        }

        if (req.cookies.last) {
            const last = parseInt(req.cookies.last);
            if (!isNaN(last)) {
                req.last = new Date(last);
            }
        }

        let since = req.headers['if-modified-since'];
        if (since) {
            since = new Date(since);
            if (isNaN(since)) {
                this.invalid('if-modified-since');
            }
            else {
                req.since = since;
            }
        }

        const geo = req.headers.geo || this.param('geo', false);
        if (geo) {
            try {
                req.geo = JSON.parse(geo);
            }
            catch (ex) {
                this.invalid('geo');
            }
        }

        ['wrap', 'answer'].forEach(function (name) {
            self[name] = self[name].bind(self);
        });

        this.success = this.success.bind(this);
    }

    invalid(name, value) {
        if (!value) {
            value = 'invalid';
        }
        const obj = {};
        obj[name] = value;
        throw new errors.BadRequest(obj);
    }

    wrap(call) {
        const self = this;
        return function (err, result) {
            if (err) {
                if (err instanceof mongoose.Error.ValidationError) {
                    self.send(code.BAD_REQUEST, {
                        invalid: err.errors
                    });
                }
                else {
                    self.send(code.INTERNAL_SERVER_ERROR, {
                        error: err
                    });
                }
            }
            else {
                call(result);
            }
        };
    }

    wrapArray(cb) {
        const self = this;
        return self.wrap(function (reader) {
            reader.toArray(self.wrap(cb));
        });
    }

    answer(err, result) {
        if (err) {
            this.send(code.INTERNAL_SERVER_ERROR, {
                error: err.message
            });
        }
        else if (result) {
            this.send(result);
            if (result.close instanceof Function) {
                result.close();
            }
        }
        else {
            this.sendStatus(code.NOT_FOUND);
        }
    }

    success(err, result) {
        if (err) {
            if (err instanceof mongoose.Error.ValidationError) {
                this.send(code.BAD_REQUEST, {
                    invalid: err.errors
                });
            }
            else {
                this.send(code.INTERNAL_SERVER_ERROR, {
                    error: err
                });
            }
        }
        else {
            this.send({success: !!result});
        }
    }

    notifyOne(user_id, message) {
        return this.server.webSocketServer.notifyOne(user_id, message);
    }

    getSubscribers(user_id) {
        return this.server.webSocketServer.getSubscribers(user_id);
    }

    sendStatus(code, message, headers) {
        this.res.writeHead(code, message, headers);
        this.res.end();
    }

    _param(object, name, defaultValue) {
        if (name in object) {
            let value = object[name];
            if (name.length >= 2 && (name.indexOf('id') === name.length - 2) && 'string' === typeof value) {
                if (!/[\da-f]{24}/i.test(value)) {
                    this.invalid(name, 'ObjectID');
                }
                value = ObjectID(value);
            }
            if (defaultValue instanceof Array && 'string' === typeof value) {
                value = value.split('.');
            }
            return value;
        }
        if (undefined !== defaultValue) {
            return defaultValue;
        }
        this.invalid(name, 'required');
    }

    param(name, defaultValue) {
        return this._param(this.params, name, defaultValue);
    }

    get(name, defaultValue) {
        return this._param(this.req.url.query, name, defaultValue);
    }

    post(name) {
        return this._param(this.body, name);
    }

    has(name, isGet) {
        const params = isGet ? this.req.url.query : this.params;
        if (name in params) {
            const value = params[name];
            if (value instanceof Array) {
                return value.length > 0;
            }
            return true;
        }
        return false;
    }

    hasAny(array) {
        for (let i = 0; i < array.length; i++) {
            if (this.has(array[i])) {
                return true;
            }
        }
        return false;
    }

    paramsObject(array) {
        const params = {};
        for (let i = 0; i < array.length; i++) {
            const name = array[i];
            if (this.has(name)) {
                params[name] = this.param(name);
            }
        }
        if (params.id) {
            params._id = params.id;
            delete params.id;
        }
        return params;
    }

    ids(name) {
        if (!name) {
            name = 'ids';
        }
        return $.param(name).split('.').map(ObjectID);
    }

    merge() {
        const o = {};
        for (let i = 0; i < arguments.length; i++) {
            const a = arguments[i];
            for (const j in a) {
                o[j] = a[j];
            }
        }
        return o;
    }

    getUserAgent() {
        const agent = {
            ip: this.req.connection.remoteAddress
        };
        if (this.req.headers['user-agent']) {
            agent.agent = this.req.headers['user-agent'];
        }
        if (this.req.geo) {
            agent.geo = this.req.geo;
        }
        return agent;
    }

    setCookie(name, value, age, path) {
        let cookie = name + '=' + value;
        cookie += '; path=' + (path || '/');
        if (age) {
            if (true === age) {
                age = new Date();
                age.setFullYear(age.getFullYear() + 10);
            }
            else if (age instanceof Date) {
                age = age.toUTCString();
            }
            else if (!isNaN(age)) {
                age = new Date(Date.now() + age).toUTCString();
            }
            cookie += '; expires=' + age;
        }
        if (this.res.headersSent) {
            console.error(`Setting cookie when headers sent ${name}=${value}`);
        }
        else {
            if (!this.res.cookies) {
                this.res.cookies = [];
            }
            this.res.cookies.push(cookie);
        }
        // console.log(cookie);
    }

    allowFields(user_fields) {
        const data = {};
        for (const key in this.body) {
            const allow = this.isAdmin || user_fields.indexOf(key) >= 0;
            if (allow) {
                data[key] = this.body[key];
            }
        }
        return data;
    }

    get spend() {
        let now = process.hrtime();
        now = now[0] * 1000000000 + now[1];
        return (now - this.start) / 1000000;
    }

    send() {
        const self = this;
        let object;
        let status = code.OK;
        if (1 == arguments.length) {
            object = arguments[0];
        }
        else if (2 == arguments.length) {
            status = arguments[0];
            object = arguments[1];
        }

        if (this.socket) {
            this.socket.send(JSON.stringify(object));
            return;
        }

        if (this.res.finished) {
            console.error('Response already send ', this.req.url.original, object);
        }
        else {
            if ('GET' != this.req.method && 'boolean' == typeof object.success) {
                if (!object.ip) {
                    object.ip = this.req.headers.ip;
                }
                object.spend = this.spend;
            }

            let data = JSON.stringify(object);
            const jsonp = config.client.jsonp.enabled && this.get('callback', false);
            const headers = jsonp ? {
                'content-type': 'application/javascript; charset=utf-8',
                'access-control-allow-origin': '*'
            } : {
                'content-type': 'application/json; charset=utf-8'
            };
            headers['X-Powered-By'] = 'PHP/7.0';
            headers.author = 'Taras Labiak <kissarat@gmail.com>';
            if (this.res.cookies instanceof Array) {
                headers['set-cookie'] = this.res.cookies;
            }
            if (jsonp) {
                data = [jsonp, '(', data, ')'].join('');
            }
            if (code.OK !== status) {
                this.res.writeHead(status, headers);
            }
            else {
                _.each(headers, function (value, name) {
                    self.res.setHeader(name, value);
                });
            }
            this.res.end(data);
        }

        if (config.request.log && 'GET' != this.req.method) {
            const record = {
                client_id: this.req.client_id,
                route: this.req.url.route.length > 1 ? this.req.url.route : this.req.url.route[0],
                method: this.req.method,
                code: status,
                time: Date.now()
            };
            if (object) {
                record.result = object.result;
            }
            if (this.user) {
                record.user_id = this.user._id;
            }
            if (!_.isEmpty(this.req.url.query)) {
                record.params = this.req.url.query;
            }
            if (!_.isEmpty(this.body)) {
                record.body = this.body;
            }
            this.collection('log').insert(record);
        }
    }

    authorize(cb) {
        const self = this;

        function agent_not_found() {
            self.send(code.UNAUTHORIZED, {
                success: false,
                ip: self.req.headers.ip,
                error: {
                    status: 'AGENT_NOT_FOUND',
                    message: 'User agent is not registered'
                },
                cookies: self.req.cookies
            });
        }

        if (this.req.auth) {
            Agent.findOne({auth: this.req.auth}).populate('user').exec(this.wrap(function (agent) {
                if (agent) {
                    self.agent = agent;
                    cb.call(self, agent);
                }
                else if ('agent' == self.req.url.route[0]) {
                    cb.call(self);
                }
                else {
                    agent_not_found();
                }
            }));
        }
        else if (/\/agent/.test(this.req.url.original) && 'POST' === this.req.method) {
            cb.call(this);
        }
        else {
            agent_not_found();
        }
    }

    get id() {
        if (!('id' in this.req) && this.req.url.query.id) {
            try {
                this.req.id = ObjectID(this.req.url.query.id);
            }
            catch (ex) {
                this.req.id = this.req.url.query.id;
            }
        }
        return this.req.id;
    }

    get user() {
        return this.agent ? this.agent.user : null;
    }

    get db() {
        return this.server.db;
    }

    get skip() {
        let value = 0;
        if (this.has('skip')) {
            value = this.get('skip');
            if (value < 0) {
                value = 0;
            }
        }
        else if (this.has('page') && this.has('limit')) {
            value = this.get('page') - 1;
            value *= this.limit;
        }
        return value;
    }

    get limit() {
        let value = 96;
        if (this.has('limit')) {
            value = this.get('limit');
            if (value > 100000 || value <= 0) {
                value = 96;
            }
        }
        return value;
    }

    get order() {
        if (this.has('sort') && this.get('sort')) {
            const sort = this.get('sort').split('.');
            const _order = {};
            if (this.has('order')) {
                _order[sort] = 'a' == this.get('order')[0] ? 1 : -1;
            }
            else {
                sort.forEach(function (field) {
                    let direction = 1;
                    if ('-' == field[0]) {
                        field = field.slice(1);
                        direction = -1;
                    }
                    _order[field] = direction;
                });
            }
            return _order;
        }
        return false;
    }

    get search() {
        if (this.has('q')) {
            let q = this.get('q');
            q = q ? q.toString().trim().replace(/[\+\s]+/g, '.*').toLowerCase() : '';
            return q ? new RegExp(`.*${q}.*`, 'i') : false;
        }
        return false;
    }

    select(array, allow, objectify) {
        if (!array) {
            array = [];
        }
        if (this.has('select')) {
            const param = this.get('select').split('.').sort();
            if (allow) {
                const allowed_fields = [];
                allow.forEach(function (field) {
                    if (param.indexOf(field) >= 0) {
                        allowed_fields.push(field);
                    }
                });
                array = array.concat(allowed_fields);
            }
            else {
                array = array.concat(param);
            }
        }
        array.push('time');
        array = _.uniq(array);
        if (objectify) {
            const object = {};
            array.forEach(function (name) {
                name = 'boolean' === typeof objectify ? name : objectify + '.' + name;
                object[name] = 1;
            });
            return object;
        }
        else {
            return array;
        }
    }

    model() {
        this.server.mongoose.apply(this.mongoose, arguments);
    }

    get bodySize() {
        const size = this.req.headers ? this.req.headers['content-length'] : 0;
        return size > 0 ? size : 0;
    }

    get isAuthenticated() {
        return !!this.user;
    }

    maxBody(maxLength) {
        if (this.bodySize > maxLength) {
            throw new errors.EntityTooLarge(maxLength);
        }
    }

    get isUpdate() {
        const m = this.req.method;
        return 'POST' === m || 'PUT' === m || 'PATCH' === m;
    }

    get isModify() {
        return this.isUpdate || 'DELETE' === this.req.method;
    }

    collection(name) {
        return this.db.collection(name);
    }

    parseURL(url) {
        const a = url_parse(url);
        a.original = url;
        if (a.query) {
            a.query = qs.parse(a.query);
            for (const i in a.query) {
                const value = a.query[i];
                if (!value) {
                    delete a.query[i];
                }
                else if (24 != value.length && /^\-?\d+$/.test(value)) {
                    a.query[i] = parseFloat(value);
                }
            }
        }
        else {
            a.query = {};
        }
        a.route = a.pathname.split('/').slice(1);
        return a;
    }

    get isStatic() {
        return this.req.headers['user-agent'] && this.req.headers['user-agent'].indexOf('PhantomJS') >= 0;
    }

    inArray(name, array) {
        const value = this.param(name);
        if (array.indexOf(value) < 0) {
            this.invalid(name, 'Must be in ' + array.join(', '));
        }
        return value;
    }

    get isAdmin() {
        return this.user && 'admin' === this.user.type;
    }

    close() {
        if (this.socket) {

        }
    }
}

_.extend(Context.prototype, web_extension);

module.exports = {
    Context: Context
};
