'use strict';

const qs = require('querystring');
const utils = require('../utils');
const errors = require('../errors');
const mongoose = require('mongoose');
const ObjectID = require('mongodb').ObjectID;
const _ = require('underscore');

module.exports = {
    processTask: function (task, bundle) {
        const collection = this.collection(task.collection);
        task.isUpdate = task.$set || task.$unset;
        if (true === task.select) {
            task.select = this.select(false, false, true);
        }
        else if (task.select instanceof Array) {
            task.select = this.select([], task.select, true);
        }
        if ('function' == typeof task.query) {
            task.query = task.query(bundle);
        }
        if (task.isUpdate) {
            if (!task.$set) {
                task.$set = {};
            }
            task.$set.time = new Date();
            return collection.update(task.query, _.pick(task, '$set', '$unset'), task.options);
        }
        else {
            if (!(task.query instanceof Array) && !task.count) {
                task.query = [{$match: task.query}];
            }
            if (task.select) {
                task.query.push({$project: task.select});
            }
            const order = this.order;
            if (order) {
                task.query.push({$sort: order});
            }

            if (task.limit) {
                task.query.push({$skip: this.skip});
                task.query.push({$limit: 'number' == typeof task.limit ? task.limit : this.limit});
            }

            if (task.count) {
                return collection.count(task.query);
            }
            else {
                return collection.aggregate(task.query);
            }
        }
    },

    serve: function () {
        if (!this.req.url.route[0]) {
            return this.send(this.server.getDescription(this.user));
        }

        const path = this.req.url.route.slice(0);
        const last = path[path.length - 1];
        if (last && /^[a-z0-9]{24}$/.test(last)) {
            this.req.url.query.id = last;
            path.pop();
        }
        this.walk(this.server.modules, path);
    },

    processResult: function (result) {
        const self = this;
        switch (typeof result) {
            case 'object':
                if (Object === result.constructor) {
                    if (!result.single) {
                        result.limit = true;
                    }
                    result.collection = result.collection || this.req.url.route[0];
                    const r = this.processTask(result, !config.dev);
                    if ('function' === typeof r.then) {
                        r
                            .then(function (result) {
                                self.send(result);
                            })
                            .catch(function (err) {
                                self.send(code.INTERNAL_SERVER_ERROR, {error: err});
                            });
                    }
                    else {
                        r.toArray(function (err, array) {
                            if (err) {
                                self.send(code.INTERNAL_SERVER_ERROR, {error: err});
                            }
                            else {
                                if (result.single) {
                                    if (array.length > 0) {
                                        self.send(array[0]);
                                    }
                                    else {
                                        self.sendStatus(code.NOT_FOUND);
                                    }
                                }
                                else {
                                    self.send(array);
                                }
                            }
                        });
                    }
                }
                else if (result instanceof Array) {
                    const bundle = {};
                    const tasks = result;
                    const run = function (result) {
                        const task = tasks.shift();
                        if ('function' == typeof task) {
                            result = task(result, bundle);
                            if (result) {
                                self.send(result);
                            }
                        }
                        else if (Object === task.constructor) {
                            task.collection = task.collection || self.req.url.route[0];
                            const process_task = function (task) {
                                task.collection = task.collection || self.req.url.route[0];
                                const cursor = self.processTask(task, bundle);
                                if (task.cursor) {
                                    run(cursor);
                                }
                                else {
                                    const process_result = function (result) {
                                        result = task.single ? result[0] : result;
                                        if (task.pick) {
                                            result = _.pick(result, task.pick);
                                        }
                                        else if (task.pluck) {
                                            result = _.pluck(result, task.pluck);
                                        }
                                        else if (task.get) {
                                            result = result[task.get];
                                        }
                                        if (tasks.length > 0) {
                                            run(result);
                                        }
                                        if (task.name) {
                                            bundle[task.name] = result;
                                        }
                                        else {
                                            if (result) {
                                                self.send(result);
                                            }
                                            else {
                                                self.sendStatus(code.NOT_FOUND);
                                            }
                                        }
                                    };
                                    if (cursor.then) {
                                        cursor.then(process_result).catch(function (err) {
                                            self.send(code.INTERNAL_SERVER_ERROR, {error: err});
                                        });
                                    }
                                    else {
                                        cursor.toArray(self.wrap(process_result));
                                    }
                                }
                            };

                            const permission = task.allow || task.deny;
                            if (permission) {
                                self.collection(task.collection).count(permission, self.wrap(function (count) {
                                    const allow = task.deny || count > 0;
                                    if (allow) {
                                        process_task(tasks.shift());
                                    }
                                    else {
                                        self.send(code.FORBIDDEN, {
                                            error: permission.error || {
                                                message: 'Access Deny'
                                            }
                                        });
                                    }
                                }));
                            }
                            else {
                                process_task(task);
                            }
                        }
                    };
                    run();
                }
                else if (result instanceof mongoose.Query || result instanceof mongoose.Aggregate) {
                    if ('find' == result.op || result instanceof mongoose.Aggregate) {
                        const order = this.order;
                        if (order) {
                            result.sort(order);
                        }
                        result.skip(this.skip);
                        result.limit(this.limit);
                    }
                    result = result.exec();
                }
                if ('Promise' == result.constructor.name) {
                    result
                        .then(function (c, r) {
                            if ('number' != typeof c) {
                                r = c;
                                c = code.OK;
                            }
                            else if (!r) {
                                return self.sendStatus(c);
                            }
                            if (r) {
                                if ('GET' !== self.req.method) {
                                    const success = [
                                        code.OK,
                                        code.CREATED,
                                        code.ACCEPTED
                                    ];
                                    if (undefined === r.success && success.indexOf(c) >= 0) {
                                        r.success = true;
                                    }
                                }
                                else if (self.req.since && r.time && new Date(r.time).getTime() <= self.req.since.getTime()) {
                                    return self.sendStatus(code.NOT_MODIFIED);
                                }

                                self.send(r);
                            }
                            else if (arguments.length > 0) {
                                console.error('Undefined promise result', self.req.method, self.req.url.original);
                            }
                            else {
                                self.sendStatus(code.NOT_FOUND);
                            }
                        })
                        .catch(function (r, object) {
                            if ('number' === typeof r) {
                                if (object) {
                                    self.send(r, object);
                                }
                                else {
                                    self.sendStatus(r);
                                }
                            }
                            else {
                                const error = {
                                    class: r.constructor.name,
                                    message: r.toString()
                                };
                                ['code', 'name', 'message', 'errors'].forEach(function (name) {
                                    if (r[name]) {
                                        error[name] = r[name];
                                    }
                                });
                                if (config.error.stack) {
                                    error.stack = r.stack
                                        .split('\n')
                                        .map(s => s.trim().replace('/usr/local/site/socex/server/', ''));
                                }
                                self.send(code.INTERNAL_SERVER_ERROR, {
                                    error: error
                                });
                            }
                        });
                }
                else if (null === result) {
                    this.sendStatus(code.NOT_FOUND);
                }
                break;
            case 'boolean':
                this.send({success: result});
                break;
            case 'number':
                this.sendStatus(result);
                break;
            case 'string':
                this.send(code.BAD_REQUEST, {
                    success: false,
                    error: {
                        message: result
                    }
                });
                break;
            default:
                if (undefined !== result) {
                    this.send(result);
                }
        }
    },

    walk: function (object, path) {
        const route = path.shift() || this.req.method;
        if ('_' === route[0]) {
            this.sendStatus(code.NOT_FOUND);
        }
        else if (route in object) {
            object = object[route];
            switch (typeof object) {
                case 'object':
                    if (!this.module) {
                        this.module = object;
                    }
                    return this.walk(object, path, route);
                case 'function':
                    return this.exec(object);
                default:
                    return object;
            }
        }
        else {
            this.sendStatus(code.NOT_FOUND);
        }
    },

    exec: function (action) {
        const canAnonymous = /^.(agent|user)/.test(this.req.url.original);

        if (this.isAuthenticated || canAnonymous || this.isCache) {
            const size = this.bodySize;
            if (this.isUpdate && 'content-type' in this.req.headers && size > 0) {
                const mime_name = this.req.headers['content-type'].split(';')[0];
                const mime = constants.mimes[mime_name];
                if (mime) {
                    if (size > mime.size) {
                        this.sendStatus(code.REQUEST_TOO_LONG, {
                            max: mime.size,
                            size: size,
                            mime: mime_name
                        });
                        return;
                    }
                    if ('file' !== this.req.url.route[0]) {
                        utils.receive(this.req, data => this.receive(data, action));
                        return;
                    }
                }
                else {
                    this.sendStatus(code.UNSUPPORTED_MEDIA_TYPE, {mime: mime_name});
                    return;
                }
            }
            this.runAction(action);
        }
        else {
            this.send(code.UNAUTHORIZED, {error: {auth: 'required'}});
        }
    },

    receive: function (data, action) {
        if (this.req.headers['content-type'].indexOf('x-www-form-urlencoded') > 0) {
            try {
                this.body = qs.parse(data.toString('utf8'));
                this.params = this.merge(this.params, this.body);
            }
            catch (ex) {
                console.error('INVALID_URLENCODED', data);
                this.send(code.BAD_REQUEST, {
                    error: ex.getMessage()
                });
            }
        }
        else if (this.req.headers['content-type'].indexOf('json') > 0 || 'test' == this.req.url.route[0]) {
            try {
                data = data.toString('utf8');
                this.body = JSON.parse(data);
                this.params = utils.merge(this.params, this.body);
                for (const key in this.params) {
                    const value = this.params[key];
                    if (value.replace && /[<>"']/.test(value)) {
                        this.params[key] = value
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/'([^']+)'/g, '«$1»')
                            .replace(/'/g, '&quot;')
                            .replace(/'/g, '’');
                    }
                }
                // console.log(data);
            }
            catch (ex) {
                console.error('INVALID_JSON', data);
                this.send(code.BAD_REQUEST, {
                    error: ex
                });
            }
        }
        else {
            console.error('UNPROCESSED_DATA', data);
        }
        this.runAction(action);
    },

    runAction: function (action) {
        const self = this;
        if (this.isStatic) {
            console.log('\t' + this.req.method + ' ' + this.req.url.original);
            if (this.body) {
                console.log(this.body);
            }
        }
        const module = this.module;
        let _action;
        if (module._before) {
            const promise = module._before(this);
            if ('Promise' === promise.constructor.name) {
                _action = function () {
                    promise.then(function (allow) {
                        if (allow) {
                            self.processResult(action(self));
                        }
                        else {
                            self.send(code.FORBIDDEN, {
                                success: false,
                                error: {
                                    message: 'Forbidden'
                                }
                            });
                        }
                    })
                        .catch(function (err) {
                            if ('number' === typeof err) {
                                self.sendStatus(err);
                            }
                            else {
                                self.send(code.INTERNAL_SERVER_ERROR, err);
                            }
                        });
                };
            }
            else if (promise) {
                _action = function () {
                    self.processResult(action(self));
                };
            }
            else {
                this.sendStatus(code.FORBIDDEN);
                return;
            }
        }
        else {
            _action = function () {
                self.processResult(action(self));
            };
        }

        if (config.dev) {
            _action(this);
        }
        else {
            try {
                _action(this);
            }
            catch (ex) {
                if (ex.invalid) {
                    this.send(code.BAD_REQUEST, ex);
                }
                else if (ex instanceof errors.Response) {
                    this.send(ex.code, ex.data);
                }
                else {
                    const error = {
                        message: ex.message
                    };
                    if (ex.code) {
                        error.code = ex.code;
                    }
                    if (ex.stack && config.error.stack) {
                        error.stack = ex.stack.split(/\s*\n\s*at\s*/).map(function (trace) {
                            return trace.replace(/[\/\w]+socex\/server\//, '/');
                        });
                    }
                    this.send(code.INTERNAL_SERVER_ERROR, {error: error});
                }
            }
        }
    },

    accessUser: function (user_id) {
        user_id = user_id instanceof Array ? user_id.map(ObjectID) : ObjectID(user_id);
        var where = {deny: {$ne: this.user._id}};
        if (user_id instanceof Array && 1 === user_id.length) {
            user_id = user_id[0];
        }
        where._id = user_id instanceof Array ? {$in: user_id} : user_id;
        return new Promise((resolve, reject) => {
            if (user_id instanceof ObjectID && user_id.equals(this.user._id)) {
                resolve(1);
            }
            else {
                this.collection('user').count(where, function (err, count) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(count);
                    }
                });
            }
        });
    },

    canManage: function (user_id) {
        return new Promise((resolve, reject) => {
            if (this.isAuthenticated) {
                const id = this.user._id;
                if (user_id.equals(id)) {
                    resolve(1);
                }
                else {
                    const where = {
                        $and: [
                            {_id: user_id},
                            {
                                $or: [
                                    {admin: id},
                                    {deny: {$ne: id}}
                                ]
                            }
                        ]
                    };
                    this.collection('user').count(where, function (err, count) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(count);
                        }
                    });
                }
            }
            else {
                resolve(0);
            }
        });
    }
};
