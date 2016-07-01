'use strict';
var qs = require('querystring');
var utils = require('../utils');
var mongoose = require('mongoose');

module.exports = {
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
                    let collection = this.collection(result.collection || this.req.url.route[0]);
                    if (true === result.select) {
                        result.select = this.select(false, false, true);
                    }
                    else if (result.select instanceof Array) {
                        result.select = this.select([], result.select, true);
                    }
                    if (!(result.query instanceof Array)) {
                        result.query = result.query ? [{$match: result.query}] : [];
                    }
                    if (result.select) {
                        result.query.push({$project: result.select});
                    }
                    console.log(result.query);
                    result.query.push({$skip: this.skip});
                    result.query.push({$limit: this.limit});
                    collection.aggregate(result.query, this.answer);
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
        if (this.req.headers['user-agent'] && this.req.headers['user-agent'].indexOf('PhantomJS') > 0) {
            console.log('\t' + this.req.method + ' ' + this.req.url.original);
            if (this.body) {
                console.log(this.body);
            }
        }
        if (config.dev) {
            return action(this);
        }
        else {
            try {
                return action(this);
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
    }
};
