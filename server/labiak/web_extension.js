'use strict';
var qs = require('querystring');
var utils = require('../utils');
var mongoose = require('mongoose');
var _ = require('underscore');

module.exports = {
    process: function (task, bundle) {
        var collection = this.collection(task.collection);
        var isUpdate = task.$set || task.$unset;
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
        if (!isUpdate && !(task.query instanceof Array) && !task.count) {
            task.query = [{$match: task.query}];
        }
        if (task.select) {
            task.query.push({$project: task.select});
        }
        if (task.limit) {
            task.query.push({$skip: this.skip});
            task.query.push({$limit: 'number' == typeof task.limit ? task.limit : this.limit});
        }
        else if (isUpdate) {
            return collection.update(task.query, _.pick(task, '$set', '$unset'), task.options);
        }
        if (task.count) {
            return collection.count(task.query);
        }
        else {
            return collection.aggregate(task.query);
        }
    },

    serve: function () {
        var self = this;
        if (!this.req.url.route[0]) {
            return this.send(this.getDescription());
        }

        var path = this.req.url.route.slice(0);
        var last = path[path.length - 1];
        if (last && /^[a-z0-9]{24}$/.test(last)) {
            this.req.url.query.id = last;
            path.pop();
        }
        var result = this.walk(this.server.modules, path);

        switch (typeof result) {
            case 'object':
                if (Object === result.constructor) {
                    if (!result.single) {
                        result.limit = true;
                    }
                    result.collection = result.collection || this.req.url.route[0];
                    this.process(result, true).toArray(function (err, array) {
                        self.answer(err, result.single ? array[0] : array);
                    });
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
                                let cursor = self.process(task, bundle);
                                if (task.cursor) {
                                    run(cursor);
                                }
                                else {
                                    let process_result = function (result) {
                                        if (task.name) {
                                            bundle[task.name] = result;
                                        }
                                        result = task.single ? result[0] : result;
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
                                            self.send(result);
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
                                        $.send(code.FORBIDDEN, {
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
                        var order = this.order;
                        if (order) {
                            result.sort(order);
                        }
                        result.skip(this.skip);
                        result.limit(this.limit);
                    }
                    result = result.exec();
                }
                else if ('Promise' == result.constructor.name) {
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
                                    var success = [
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
                            if ('number' == typeof r) {
                                self.sendStatus(r)
                            }
                            else {
                                self.send(code.INTERNAL_SERVER_ERROR, {
                                    error: {
                                        class: r.constructor.name,
                                        message: r.toString()
                                    }
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
                this.res.writeHead(result);
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
        //var methods = ["OPTIONS", "GET", "HEAD", "POST", "PUT", "DELETE", "TRACE", "CONNECT"];
        if ('_' == route[0]) {
            return false;
        }
        else if (route in object) {
            object = object[route];
            switch (typeof object) {
                case 'object':
                    if (!this.module) {
                        this.module = object;
                        if ('function' == typeof this.module._before) {
                            this.module._before(this);
                        }
                    }
                    return this.walk(object, path, route);
                case 'function':
                    return this.exec(object);
                default:
                    return object;
            }
        }
        else if ('_' in object) {
            return object._(this);
        }
        else {
            return false;
        }
    },

    exec: function (action) {
        var is_unauthoried_route = /^.(agent|user.(login|phone|code|personal|exists|avatar))/.test(this.req.url.original);
        var must_upload_route = /^.(photo|file)/.test(this.req.url.original);

        if (this.user || is_unauthoried_route || ('GET' == this.req.method && this.isCache)) {
            if (this.isUpdate) {
                var mime_name = this.req.headers['content-type'];
                mime_name = mime_name.split(';')[0];
                var mime = constants.mimes[mime_name];
                if (!mime) {
                    this.sendStatus(code.UNSUPPORTED_MEDIA_TYPE, {
                        mime: mime_name
                    });
                    return;
                }
            }
            var size = this.bodySize;
            if (size > 0) {
                if (size > mime.size) {
                    this.sendStatus(code.REQUEST_TOO_LONG, {
                        max: mime.size,
                        size: size,
                        mime: mime_name
                    });
                    return;
                }
                if (!must_upload_route) {
                    return this.receive(action);
                }
            }
            else {
                return this.runAction(action);
            }
        }
        else {
            this.send(code.UNAUTHORIZED, {
                error: {
                    auth: 'required'
                }
            });
        }
    },

    receive: function (action) {
        var self = this;
        return utils.receive(this.req, function (data) {
            if (self.req.headers['content-type'].indexOf('x-www-form-urlencoded') > 0) {
                try {
                    self.body = qs.parse(data.toString('utf8'));
                    self.params = self.merge(self.params, self.body);
                }
                catch (ex) {
                    self.send(code.BAD_REQUEST, {
                        error: ex.getMessage()
                    })
                }
            }
            else if (self.req.headers['content-type'].indexOf('json') > 0 || 'test' == self.req.url.route[0]) {
                try {
                    data = data.toString('utf8');
                    self.body = JSON.parse(data);
                    self.params = self.merge(self.params, self.body);
                    for (var key in self.params) {
                        var value = self.params[key];
                        if (value.replace && /[<>"']/.test(value)) {
                            self.params[key] = value
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/"([^"]+)"/g, '«$1»')
                                .replace(/"/g, '&quot;')
                                .replace(/'/g, '’');
                        }
                    }
                }
                catch (ex) {
                    console.log(ex);
                    self.send(code.BAD_REQUEST, {
                        error: ex
                    })
                }
            }
            else {
                console.error('UNPROCESSED_DATA', data);
            }
            return self.runAction(action);
        });
    },

    runAction: function (action) {
        var self = this;
        if (this.req.headers['user-agent'] && this.req.headers['user-agent'].indexOf('PhantomJS') > 0) {
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
                            action(self);
                        }
                    })
                        .catch(function (err) {
                            self.send(code.INTERNAL_SERVER_ERROR, err);
                        })
                }
            }
            else if (promise) {
                _action = action
            }
            else {
                return;
            }
        }
        else {
            _action = action;
        }
        if (config.dev) {
            return _action(this);
        }
        else {
            try {
                return _action(this);
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
        var self = this;
        var id = $.user._id;
        var where = {
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
        return new Promise(function (resolve, reject) {
            if (user_id.equals(self.user._id)) {
                resolve(1);
            }
            else {
                self.collection('user').count(where, function (err, count) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(count)
                    }
                })
            }
        });
    }
};
