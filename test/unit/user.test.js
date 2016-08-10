'use strict';

const supertest = require('supertest');
const bandom = require('bandom');
const faker = require('faker/locale/ru');
const _ = require('lodash');

describe('user', function () {
    const domain = 'user_' + bandom.inc(2);
    var user = {
        domain: domain,
        password: bandom.letters(8),
        email: domain + '@yopmail.com',
        phone: _.random(123456789, 1234567890123456).toString(),
        surname: faker.name.firstName(),
        forename: faker.name.lastName(),
        cookies: {}
    };

    it('agent for user ' + domain, function (done) {
        supertest(server)
            .post('/api/agent')
            .set('Accept', 'application/json')
            .send({
                agent: {
                    client: {
                        name: 'test'
                    },
                    os: {
                        name: process.platform
                    }
                }
            })
            .expect(200)
            .end(function (err, res) {
                const data = JSON.parse(res.text);
                if (!data.success) {
                    console.error(data);
                }
                assert(data.success);
                assert.equal(data.headers['content-type'], 'application/json');
                assert.isMongoId(data._id, 'Invalid ID');
                assert(/\w{40}/.test(data.auth), 'Invalid auth');
                user.cookies.cid = data._id;
                user.cookies.auth = data.auth;
                done(err);
            });
    });

    it('signup ' + domain, function (done) {
        supertest(server)
            .post('/api/agent')
            .set('Accept', 'application/json')
            .set('Cookie', cookies(user))
            .send(user)
            .end(function (err, res) {
                var data = JSON.parse(res.text);
                console.error(data);
                const registering = _.omit(user, 'phone', 'password', 'cookies');
                const registeringKeys = Object.keys(registering);
                const allKeys = registeringKeys.concat(['_id', 'country', 'created', 'time', 'tiles', 'sex']);
                data = _.pick(data, allKeys);
                assert.strictEqual(Object.keys(data), data);
                assert.isMongoId(res.data._id, 'Invalid ID');
                user._id = data._id;
                assert.strictEqual(_.pick(data, registeringKeys), registering);
                assert.strictEqual(data.tiles, {
                    '0': '050000000000000000000000',
                    '1': '050000000000000000000001',
                    '2': '050000000000000000000002',
                    '3': '050000000000000000000003',
                    '4': '050000000000000000000004',
                    '5': '050000000000000000000005',
                    '6': '050000000000000000000006'
                }, 'Invalid tails');
                done(err);
            });
    });

    it('login ' + domain, function (done) {
        supertest(server)
            .post('/api/agent')
            .set('Accept', 'application/json')
            .set('Cookie', cookies(user))
            .send({
                login: user.domain,
                password: user.password
            })
            .expect(200)
            .end(function (err, res) {
                const data = JSON.parse(res.text);
                assert(true === data.success, 'success: false');
                done(err);
            });
    });

    it('logout ' + domain, function (done) {
        supertest(server)
            .post('/api/agent')
            .set('Accept', 'application/json')
            .set('Cookie', cookies(user))
            .expect(200)
            .end(function (err, res) {
                const data = JSON.parse(res.text);
                assert(true === data.success, 'success: false');
                done(err);
            });
    });
});
