'use strict';

const supertest = require('supertest');
const bandom = require('bandom');
const faker = require('faker/locale/ru');
const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');

describe('chat', function () {
    it('create', loadTest(
        {user: queries.user()},
        function (results) {
            return results[0].map(function (user) {
                return {
                    user: user,
                    chat: {
                        name: faker.name.title()
                    }
                }
            })
        },
        function (task, done) {
            supertest(server)
                .post('/api/chat')
                .set('content-type', 'application/json')
                .set('cookie', cookies(task.user))
                .send(task.chat)
                .expect(200)
                .end(function (err, res) {
                    const data = JSON.parse(res.text);
                    assert.isMongoId(data._id);
                    expect(data.admin).to.include(task.user._id.toString());
                    assert(data.follow.isEmpty());
                    _.defaults(task.chat, _.pick(data, ['_id', 'admin', 'follow']));
                    console.log(task.chat.name);
                    done(err);
                });
        }));
    
    it('message', loadTest(
        {chat: queries.chat()},
        function (results) {
            return results[0].map(function (user) {
                return {
                    user: user,
                    chat: {
                        name: faker.name.title()
                    }
                }
            })
        },
        function (task, done) {
            supertest(server)
                .post('/api/chat')
                .set('content-type', 'application/json')
                .set('cookie', cookies(task.user))
                .send(task.chat)
                .expect(200)
                .end(function (err, res) {
                    const data = JSON.parse(res.text);
                    assert.isMongoId(data._id);
                    expect(data.admin).to.include(task.user._id.toString());
                    assert(data.follow.isEmpty());
                    _.defaults(task.chat, _.pick(data, ['_id', 'admin', 'follow']));
                    console.log(task.chat.name);
                    done(err);
                });
        }));
});
