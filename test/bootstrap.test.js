'use strict';

const dbname = 'socex-test';
const dropDatabase = true;

require('../server/server');
const qs = require('querystring');
const _ = require('lodash');
global.validator = require('validator');
global.assert = require('assert');
require('chai').use(require('chai-http'));

function test(name) {
    require(__dirname + `/unit/${name}.test`);
}

global.cookies = function cookies(user) {
    return qs.stringify(user.cookies, '; ');
};

_.each(validator, function (fn, name) {
    if (/^is/.test(name)) {
        assert[name] = function () {
            assert(fn.apply(validator, arguments), name);
        };
    }
});

/*
const desc = server.getDescription().schema;

_.each(schema, function (schema, name) {
   function validate(value, schema, name) {
       if ('string' === typeof schema.type) {
           var valid = false;
           switch (schema.type) {
               case 'String':
                   valid = 'string' == typeof value;
                   if (valid && schema.match) {
                       valid = new RegExp(schema.match).test(value);
                   }
                   break;

               case 'Number':
                   valid = 'number' == typeof value;
                   break;

               case 'ObjectID':
                   valid = validator.isMongoId(valid);
                   break;

               case 'Boolean':
                   valid = 'boolean' == typeof value;
                   break;

               case 'Date':
                   valid = validator.isDate(value);
                   break;
           }
           return valid;
       }
       else {
       }
   }
});
*/

before(function (done) {
    config.mongo.uri = 'mongodb:///var/run/mongodb-27017.sock/' + dbname;
    server.test = true;
    server.on('start', done);
    server.start();
});

test('user');
// test('list');
// test('message');

after(function (done) {
    if (dropDatabase) {
        server.db.dropDatabase(done);
    }
    else {
        done();
    }
});
