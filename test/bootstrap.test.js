'use strict';
const dbname = 'socex-test';
const dropDatabase = true;
const parallel = -1;

require('../server/server');
const qs = require('querystring');
const _ = require('lodash');
const async = require('async');
const WebSocket = require('ws');
global.assert = require('assert');
global.validator = require('validator');

function test(name) {
    require(__dirname + `/unit/${name}.test`);
}

global.cookies = function cookies(user) {
    return qs.stringify(user.auth ? user : user.cookies || user.agent, '; ');
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
        const array = [
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
            }
        ];
        if (size) {
            array.push({
                $sample: {
                    size: size
                }
            });
        }
        return array;
    }
};

function queue(cb, array, executor) {
    var i = array.length;

    function iterate(err) {
        if (err || i-- <= 0) {
            cb(err);
        }
        else {
            executor(array[i], iterate);
        }
    }

    iterate();
}

if (parallel >= 0) {
    global.loop = function (cb, array, executor) {
        let i = 0;
        const count = array.length;
        const timers = {};

        function done2(err) {
            i++;
            if ((i >= count) || err) {
                cb(err);
                cb = null;
                _.each(timers, function (fn, timer) {
                    clearTimeout(timer);
                    delete timers[timer];
                });
            }
        }

        array.forEach(function (task) {
            function fn() {
                if (cb) {
                    try {
                        executor(task, done2);
                    }
                    catch (ex) {
                        cb(ex);
                        cb = null;
                    }
                }
                delete timers[timer];
            }

            var timer = setTimeout(fn, Math.random() * count * parallel);
            timers[timer] = fn;
        });
    };
}
else {
    global.loop = queue;
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
                });
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
            return results[0];
        },
        executor
    );
};

global.loadUsers = function (done, cb) {
    User.aggregate(
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
        })
        .then(function (users) {
            const fn = function fn(err) {
                if (err) {
                    done(err);
                }
                else {
                    cb(users);
                }
            };
            loop(fn, users, function (user, done) {
                const websocket = new WebSocket('ws://localhost:8091/socket', null, {
                    headers: {
                        cookie: 'auth=' + user.agent.auth
                    }
                });
                websocket.on('open', function () {
                    // console.log('open', user._id);
                    user.websocket = websocket;
                    done();
                });
                websocket.on('error', function (err) {
                    done(err);
                });
                websocket.on('close', function () {
                    // console.warn(`Socket ${user.domain} closed`);
                });
            });
        })
        .catch(done);
};

global.closeSockets = function (users) {
    return function (done) {
        // console.log(_.size(users), _.map(users, user => user.domain).join(' '));
        loop(done, _.values(users), function (user, done) {
            user.websocket.on('close', function () {
                done();
            });
            user.websocket.close();
            user.websocket = null;
        });
    };
};

before(function (done) {
    config.mongo.uri = 'mongodb:///var/run/mongodb-27017.sock/' + dbname;
    server.test = true;
    server.on('start', done);
    server.start();
});

if (!Array.prototype.includes) {
    Array.prototype.includes = function (a) {
        return this.indexOf(a) >= 0;
    };
}

Array.prototype.isEmpty = function () {
    return 0 === this.length;
};

test('user');
test('chat');
test('dialog');
test('list');
// const tests = ['dialog', 'list', 'chat'];
// tests.forEach(test);
// _.shuffle(tests).forEach(test);

after(function (done) {
    if (dropDatabase) {
        server.db.dropDatabase(function (err) {
            done(err);
        });
    }
    else {
        done();
    }
});
