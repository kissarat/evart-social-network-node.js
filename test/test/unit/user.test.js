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

function cookies(user) {
    return qs.stringify(user.cookies, '; ');
}

function registration() {
    return new Promise(function (resolve, reject) {
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
                .set('Cookie', cookies(user))
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
    })
}

function follow(user, targets) {
    var promise = [];
    targets.sort((a, b) => a.domain.localeCompare(b.domain));
    targets.forEach(function (target) {
        it('add ' + user.domain + ' ' + target.domain, function (done) {
            promise.push(new Promise(function (resolve, reject) {
                post('list').send({
                    name: 'follow',
                    target_id: target._id
                })
                    .set('Cookie', cookies(user))
                    .expect(200)
                    .end(function (err, res) {
                        const data = JSON.parse(res.text);
                        assert(true === data.success, 'success: false');
                        done(err);
                        if (err) {
                            reject(err)
                        }
                        else {
                            resolve(target);
                        }
                    });
            }));
        });
    });

    Promise.all(promise).then(function (targets) {
        it('follow informer ' + user.domain, function (done) {
            const url = '/api/list?' + qs.stringify({
                    target_id: target
                });
            supertest(server)
                .get(url)
                .set('Cookie', cookies(user))
                .end(function (err, res) {
                    const data = JSON.parse(res.text);
                    assert(data.follows === target.length);
                    done(err);
                })
        });

        const target = bandom.choice(targets)._id;
        it('remove ' + target, function (done) {
            const url = '/api/list?' + qs.stringify({
                    name: 'follow',
                    target_id: target
                });
            supertest(server)
                .delete(url)
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
}

var users = [];
describe('registration', function () {
    for (var i = 0; i < 20; i++) {
        users.push(registration());
    }
});

Promise.all(users).then(function (users) {
    describe('follow', function () {
        users.forEach(function (user) {
            follow(user, bandom.sample(users, bandom.randint(2, users.length - 1)))
        })
    });
});
