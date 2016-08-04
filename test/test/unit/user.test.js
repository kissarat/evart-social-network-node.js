'use strict';

const supertest = require('supertest');
const _ = require('lodash');
const chai = require('chai');
const faker = require('faker/locale/ru');
const bandom = require('bandom');
const expect = chai.expect;
const assert = chai.assert;

const ObjectIDRegex = /[0-9a-f]{24}/;

function post(uri, data) {
    return supertest(server)
        .post('/api/' + uri)
        .set('Accept', 'application/json')
        .send(data)
}

function registration() {
    var auth;
    var user;
    it('POST agent', function (done) {
        post('agent', {
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
                expect(data.success).to.be.true;
                expect(data._id).to.match(ObjectIDRegex);
                expect(data.auth).to.match(/\w{40}/);
                auth = 'auth=' + data.auth;
                done(err);
            })
    });

    it('POST user', function (done) {
        var domain = bandom.micro('user-');
        user = {
            domain: domain,
            password: bandom.letters(8),
            email: domain + '@yopmail.com',
            phone: bandom.randint(123456789, 1234567890123456).toString(),
            surname: faker.name.firstName(),
            forename: faker.name.lastName()
        };
        post('user', user)
            .set('Cookie', auth)
            .expect(200)
            .end(function (err, res) {
                var data = JSON.parse(res.text);
                const registering = _.omit(user, 'phone', 'password');
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
}

describe('User', function () {
    registration();
});
