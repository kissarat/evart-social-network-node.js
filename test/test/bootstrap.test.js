'use strict';
const dbname = 'socex-test';
const dropDatabase = true;

require('../../server/server');

function test(name) {
    require(__dirname + `/unit/${name}.test`);
}

before(function (done) {
    config.mongo.uri = "mongodb:///tmp/mongodb-27017.sock/" + dbname;
    server.test = true;
    server.on('start', done);
    server.start();
});

test('user');

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
