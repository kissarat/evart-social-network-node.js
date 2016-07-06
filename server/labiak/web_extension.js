'use strict';

var qs = require('querystring');
var utils = require('../utils');
var errors = require('../errors');
var mongoose = require('mongoose');
var _ = require('underscore');

module.exports = {
    processTask: function (task, bundle) {
        var collection = this.collection(task.collection);
        task.isUpdate = task.$set || task.$unset;
        // console.log(JSON.stringify(task, null, '  '));
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
                task.$set = {}
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
            var order = this.order;
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

        var path = this.req.url.route.slice(0);
        var last = path[path.length - 1];
        if (last && /^[a-z0-9]{24}$/.test(last)) {
            this.req.url.query.id = last;
            path.pop();
        }
        this.walk(this.server.modules, path);
    },

    processResult: function (result) {
        var self = this;
        switch (typeof result) {
            case 'object':
                if (Object === result.constructor) {
                    if (!result.single) {
                        result.limit = true;
                    }
                    result.collection = result.collection || this.req.url.route[0];
                    let r = this.processTask(result, !config.dev);
                    if ('function' === typeof r.then) {
                        r.then(function (result) {
                                self.send(result);
                            },
                            function (err) {
                                self.send(code.INTERNAL_SERVER_ERROR, {error: err});
                            })
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
                    let bundle = {};
                    let tasks = result;
                    let run = function (result) {
                        var task = tasks.shift();
                        if ('function' == typeof task) {
                            result = task(result, bundle);
                            if (result) {
                                self.send(result);
                            }
                        }
                        else if (Object === task.constructor) {
                            task.collection = task.collection || self.req.url.route[0];
                            let process_task = function (task) {
                                task.collection = task.collection || self.req.url.route[0];
                                let cursor = self.processTask(task, bundle);
                                if (task.cursor) {
                                    run(cursor);
                                }
                                else {
                                    let process_result = function (result) {
                                        result = task.single ? result[0] : result;
                                        if (task.name) {
                                            bundle[task.name] = result;
                                        }
                                        if (task.pick) {
                                            result = result[task.pick];
                                        }
                                        else if (task.pluck) {
                                            result = _.pluck(result, task.pluck);
                                        }
                                        if (tasks.length > 0) {
                                            run(result);
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
                                        })
                                    }
                                    else {
                                        cursor.toArray(self.wrap(process_result));
                                    }
                                }
                            };

                            var permission = task.allow || task.deny;
                            if (permission) {
                                self.collection(task.collection).count(permission, self.wrap(function (count) {
                                    var allow = task.deny || count > 0;
                                    if (allow) {
                                        process_task(tasks.shift());
                                    }
                                    else {
                                        self.send(code.FORBIDDEN, {
                                            error: permission.error || {
                                                message: 'Access Deny'
                                            }
                                        })
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
                        let order = this.order;
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
                                    let success = [
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
                        .catch(function (r) {
                            if ('number' === typeof r) {
                                self.sendStatus(r)
                            }
                            else {
                                let error = {
                                    class: r.constructor.name,
                                    message: r.toString()
                                };
                                ['code', 'name', 'message', 'errors'].forEach(function (name) {
                                    if (r[name]) {
                                        error[name] = r[name];
                                    }
                                });
                                self.send(code.INTERNAL_SERVER_ERROR, {
                                    error: error
                                })
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
        var route = path.shift() || this.req.method;
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
        var anonymous_route = /^.(agent|quorum|user.(login|phone|code|personal|exists|avatar))/.test(this.req.url.original);

        if (this.isAuthenticated || anonymous_route || this.isCache) {
            let size = this.bodySize;
            if (this.isUpdate && 'content-type' in this.req.headers && size > 0) {
                let mime_name = this.req.headers['content-type'].split(';')[0];
                let mime = constants.mimes[mime_name];
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
                })
            }
        }
        else if (this.req.headers['content-type'].indexOf('json') > 0 || 'test' == this.req.url.route[0]) {
            try {
                data = data.toString('utf8');
                this.body = JSON.parse(data);
                this.params = utils.merge(this.params, this.body);
                for (let key in this.params) {
                    let value = this.params[key];
                    if (value.replace && /[<>"']/.test(value)) {
                        this.params[key] = value
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"([^"]+)"/g, '«$1»')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '’');
                    }
                }
            }
            catch (ex) {
                console.error('INVALID_JSON', data);
                this.send(code.BAD_REQUEST, {
                    error: ex
                })
            }
        }
        else {
            console.error('UNPROCESSED_DATA', data);
        }
        this.runAction(action);
    },

    runAction: function (action) {
        var self = this;
        if (this.isStatic) {
            console.log('\t' + this.req.method + ' ' + this.req.url.original);
            if (this.body) {
                console.log(this.body);
            }
        }
        var module = this.module;
        var _action;
        if (module._before) {
            var promise = module._before(this);
            if (promise.constructor.name === 'Promise') {
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
                        })
                }
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
                    var error = {
                        message: ex.message
                    };
                    if (ex.code) {
                        error.code = ex.code;
                    }
                    if (ex.stack) {
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
        var self = this;
        user_id = user_id instanceof Array ? {$in: user_id} : user_id;
        var where = {_id: user_id, deny: {$not: user_id}};
        return new Promise(function (resolve, reject) {
            if (user_id.length = 1 && user_id.equals(self.user._id)) {
                resolve(1);
            }
            else {
                self.collection('user').count(where, function (err, count) {
                    if (err) {
                        reject(err)
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
                let id = this.user._id;
                if (user_id.equals(id)) {
                    resolve(1);
                }
                else {
                    let where = {
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
                            resolve(count)
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
