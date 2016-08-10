'use strict';

const supertest = require('supertest');
const bandom = require('bandom');
const faker = require('faker/locale/ru');
const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');

describe('chat', function () {
    var chats = [];
    var users = {};
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
                    data.user = task.user;
                    data.user._id = data.user._id.toString();
                    users[data.user._id] = data.user;
                    chats.push(data);
                    // console.log(data);
                    done(err);
                });
        }));

    it('follow', function (done) {
        const _chats = chats;
        const ids = _chats.map(chat => chat.user._id);
        const changeset = [];
        _chats.forEach(function (chat) {
            ids.forEach(function (id) {
                if (chat.user._id !== id) {
                    changeset.push({
                        chat: chat,
                        follow: id
                    });
                }
            });
        });
        loop(done, _.shuffle(changeset), function (changes, done) {
            supertest(server)
                .patch('/api/chat')
                .set('content-type', 'application/json')
                .set('cookie', cookies(changes.chat.user))
                .send({
                    id: changes.chat._id,
                    action: 'add',
                    name: 'follow',
                    user_id: changes.follow
                })
                .expect(200)
                .end(function (err, res) {
                    const data = JSON.parse(res.text);
                    assert.isMongoId(data._id);
                    expect(data.follow).to.include(changes.follow);
                    assert(_.intersection(changes.chat.admin, data.follow).isEmpty());
                    changes.chat.follow = data.follow;
                    done(err);
                });
        })
    });

    it('message', function (done) {
        const inserts = [];
        chats.forEach(function (chat) {
            const sources = chat.admin.concat(chat.follow);
            const length = _.random(0, 10);
            for (let i = 0; i < length; i++) {
                inserts.push({
                    user: users[bandom.choice(sources)],
                    message: {
                        chat: chat._id,
                        text: faker.lorem.sentences(35)
                    }
                })
            }
        });
        loop(done, _.shuffle(inserts), function (insert, done) {
            supertest(server)
                .post('/api/message')
                .set('content-type', 'application/json')
                .set('cookie', cookies(insert.user))
                .send(insert.message)
                .expect(200)
                .end(function (err, res) {
                    const data = JSON.parse(res.text);
                    assert.isMongoId(data._id);
                    assert.equal(data.chat, insert.message.chat);
                    assert.equal(data.text, insert.message.text);
                    assert.isDate(data.time);
                    done(err);
                });
        })
    });
});
