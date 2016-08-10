'use strict';
const dbname = 'socex-test';
const dropDatabase = true;

require('../server/server');
const qs = require('querystring');
const _ = require('lodash');
const async = require('async');
global.assert = require('assert');
global.validator = require('validator');

function test(name) {
    require(__dirname + `/unit/${name}.test`);
}

global.cookies = function cookies(user) {
    return qs.stringify(user.cookies || user.agent, '; ');
};

_.each(_, function (fn, name) {
    if (/^is/.test(name)) {
        assert[name] = function () {
            assert(fn.apply(validator, arguments), name);
        };
    }
});

_.each(validator, function (fn, name) {
    if (/^is/.test(name)) {
        assert[name] = function () {
            assert(fn.apply(validator, arguments), name);
        };
    }
});

global.queries = {
    user: function (size) {
        if (!size) {
            size = 5
        }
        return [
            {
                $lookup: {
                    as: 'agent',
                    localField: '_id',
                    from: 'agent',
                    foreignField: 'user'
                }
            },
            {
                $unwind: '$agent'
            },
            {
                $sample: {
                    size: size
                }
            }
        ]
    },

    chat: function (size) {
        if (!size) {
            size = 15
        }
        return [
            {
                $lookup: {
                    as: 'chat',
                    localField: 'chat',
                    from: 'chat',
                    foreignField: 'admin'
                }
            },
            {
                $lookup: {
                    as: 'chat',
                    localField: 'chat',
                    from: 'chat',
                    foreignField: 'follow'
                }
            },
            {
                $unwind: '$chat'
            },
            {
                $sample: {
                    size: size
                }
            }
        ]
    },

    sample: function (size) {
        if (!size) {
            size = 5
        }
        return [
            {
                $sample: {
                    size: size
                }
            }
        ]
    }
};

function queue(done, tasks, executor) {
    if (tasks.length > 0) {
        executor(tasks.pop(), function (err) {
            if (err) {
                done(err);
            }
            else {
                queue(done, tasks, executor);
            }
        })
    }
    else {
        done();
    }
}

global.loadTest = function (collections, taskGenerator, executor) {
    return function (done) {
        const series = [];
        _.each(collections, function (elem, key) {
            if ('function' === typeof elem) {
                series.push(elem);
            }
            else {
                series.push(function (done) {
                    server.db.collection(key)[elem instanceof Array ? 'aggregate' : 'find'](elem, done);
                })
            }
        });
        async.series(series, function (err, results) {
            if (err) {
                done(err);
            }
            else {
                queue(done, taskGenerator(results), executor);
            }
        });
    };
};

global.loadTestUsers = function (executor) {
    return loadTest(
        {user: queries.user()},
        function (results) {
            return results[0].map(function (user) {
                return {
                    user: user,
                    chat: {
                        name: faker.name.title()
                    }
                }
            })
        });
};

before(function (done) {
    config.mongo.uri = "mongodb:///var/run/mongodb-27017.sock/" + dbname;
    server.test = true;
    server.on('start', done);
    server.start();
});

if (!Array.prototype.includes) {
    Array.prototype.includes = function (a) {
        return this.indexOf(a) >= 0;
    }
}

Array.prototype.isEmpty = function () {
    return 0 === this.length;
};

test('user');
test('message');

after(function (done) {
    if (dropDatabase) {
        server.db.dropDatabase(function (err) {
            done(err);
        })
    }
    else {
        done();
    }
});
