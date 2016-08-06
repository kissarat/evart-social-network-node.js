'use strict';

const request = require('supertest');
const chai = require('chai');
const faker = require('faker/locale/ru');
const _ = require('lodash');
const bandom = require('bandom');
const qs = require('querystring');
const expect = chai.expect;
const assert = chai.assert;

const ObjectIDRegex = /[0-9a-f]{24}/;

global.chats = [];

describe('chat', function () {
    users.forEach(function (user) {
        const chat = {
            name: faker.name.title()
        };
        chats.push(chat);
        it('create ' + chat.name, function () {
            request(server).post('/api/chat').send(chat)
                .set('Cookie', cookies(user))
                .expect(200)
                .end(function (err, res) {
                    const data = JSON.parse(res.text);
                    if (data.error && 'AGENT_NOT_FOUND' === data.error.status) {
                        console.error('AGENT_NOT_FOUND', data.cookies);
                        process.exit(1);
                    }
                    expect(data._id).to.match(ObjectIDRegex);
                    assert.isArray(data.admin);
                    expect(data.admin).to.contain(user._id);
                    assert.isArray(data.follow);
                    assert(0 === data.follow.length);
                    _.defaults(chat, _.pick(data, ['_id', 'admin', 'follow']));
                })
        });
    });
});
