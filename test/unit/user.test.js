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
        .set('Accept', 'application/json');
}

describe('auth', function () {
    const users = _.range(1, 30).map(function (i) {
        const domain = 'user' + i;
        return {
            domain: domain,
            password: '1',
            email: domain + '@yopmail.com',
            phone: _.random(123456789, 1234567890123456).toString(),
            surname: faker.name.firstName(),
            forename: faker.name.lastName(),
            cookies: {}
        };
    });

    it('agent', function (done) {
        loop(done, users, function (user, done) {
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
                });
        });
    });

    it('signup', function (done) {
        loop(done, users, function (user, done) {
            post('user').send(_.omit(user, 'cookies'))
                .set('content-type', 'application/json')
                .set('cookie', cookies(user))
                .expect(200)
                .end(function (err, res) {
                    var data = JSON.parse(res.text);
                    if (!data._id) {
                        console.error(data);
                    }
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
                });
        });
    });

    it('login', function (done) {
        loop(done, users, function (user, done) {
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
                });
        });
    });
});
