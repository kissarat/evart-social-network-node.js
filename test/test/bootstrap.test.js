'use strict';
const dbname = 'socex-test';
const dropDatabase = true;

require('../../server/server');
const qs = require('querystring');

function test(name) {
    require(__dirname + `/unit/${name}.test`);
}

global.cookies = function cookies(user) {
    return qs.stringify(user.cookies, '; ');
};

before(function (done) {
    config.mongo.uri = "mongodb:///tmp/mongodb-27017.sock/" + dbname;
    server.test = true;
    server.on('start', done);
    server.start();
});

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
