'use strict';

const dbname = 'socex-test';
const dropDatabase = true;

require('../server/server');
const qs = require('querystring');
const Lviv = require('lviv');
global.validator = require('validator');
global.bandom = require('bandom');
global._ = require('lodash');
global.assert = require('assert');
global.faker = require('faker/locale/ru');

function test(name) {
    require(__dirname + `/unit/${name}.test`);
}

global.cookies = function cookies(user) {
    return qs.stringify(user.cookies, '; ');
};

global.ObjectIDRegex = /[0-9a-f]{24}/;

_.each(validator, function (fn, name) {
    if (/^is/.test(name)) {
        assert[name] = function () {
            assert(fn.apply(validator, arguments), name);
        }
    }
});

before(function (done) {
    global.lviv = new Lviv({
        host: 'localhost',
        port: server.address().port
    });
    config.mongo.uri = "mongodb:///tmp/mongodb-27017.sock/" + dbname;
    server.test = true;
    server.on('start', done);
    server.start();
});

test('user');
// test('list');
// test('message');

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
