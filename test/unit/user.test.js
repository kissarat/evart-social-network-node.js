'use strict';

const supertest = require('supertest');
const chai = require('chai');
const faker = require('faker/locale/ru');
const _ = require('lodash');
const bandom = require('bandom');
const qs = require('querystring');
const expect = chai.expect;
const assert = chai.assert;

const ObjectIDRegex = /[0-9a-f]{24}/;

function post(uri) {
    return supertest(server)
        .post('/api/' + uri)
        .set('Accept', 'application/json')
}

function sortUsers(users) {
    return users.sort((a, b) => a.domain.localeCompare(b.domain));
}

function registration() {
    const domain = 'user_' + bandom.inc(2);
    var user = {
        domain: domain,
        // password: bandom.letters(8),
        password: '1',
        email: domain + '@yopmail.com',
        phone: _.random(123456789, 1234567890123456).toString(),
        surname: faker.name.firstName(),
        forename: faker.name.lastName(),
        cookies: {}
    };

    it('agent for user ' + domain, function (done) {
        post('agent').send({
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
                expect(data).to.have.all.keys(
                    ['success', '_id', 'auth', 'config', 'headers', 'ip', 'spend']);
                assert(true === data.success, 'success: false');
                expect(data._id).to.match(ObjectIDRegex);
                expect(data.auth).to.match(/\w{40}/);
                user.cookies.cid = data._id;
                user.cookies.auth = data.auth;
                done(err);
                if (err) {
                    reject(err);
                }
            })
    });

    it('user ' + domain, function (done) {
        post('user').send(_.omit(user, 'cookies'))
            .set('content-type', 'application/json')
            .set('cookie', cookies(user))
            .expect(200)
            .end(function (err, res) {
                var data = JSON.parse(res.text);
                const registering = _.omit(user, 'phone', 'password', 'cookies');
                const registeringKeys = Object.keys(registering);
                const allKeys = registeringKeys.concat(['_id', 'country', 'created', 'time', 'tiles', 'sex']);
                data = _.pick(data, allKeys);
                expect(data).to.have.all.keys(allKeys);
                expect(data._id).to.match(ObjectIDRegex);
                user._id = data._id;
                expect(_.pick(data, registeringKeys)).to.be.deep.equal(registering);
                expect(data.tiles).to.be.deep.equal({
                    '0': '050000000000000000000000',
                    '1': '050000000000000000000001',
                    '2': '050000000000000000000002',
                    '3': '050000000000000000000003',
                    '4': '050000000000000000000004',
                    '5': '050000000000000000000005',
                    '6': '050000000000000000000006'
                });
                done(err);
                if (err) {
                    reject(err);
                }
            });
    });

    it('login ' + domain, function (done) {
        post('user/login').send({
            login: user.domain,
            password: user.password
        })
            .set('Cookie', cookies(user))
            .expect(200)
            .end(function (err, res) {
                const data = JSON.parse(res.text);
                assert(true === data.success, 'success: false');
                done(err);
                if (err) {
                    reject(err);
                }
                else {
                    resolve(user);
                }
            });
    });
    return user;
}

const users = [];
describe('registration', function () {
    for (var i = 0; i < 4; i++) {
        users.push(registration());
    }
});