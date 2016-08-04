'use strict';

require('../../server/server');

function test(name) {
    require(__dirname + `/unit/${name}.test`);
}

test('user');

console.log(process.cwd());
before(function (done) {
    config.mongo.uri = "mongodb:///tmp/mongodb-27017.sock/socex-test";
    server.test = true;
    server.on('start', done);
    server.start();
});

after(function (done) {
    server.db.dropDatabase(function (err) {
        done(err);
    })
});
