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
    it('create', function (done) {
        loadUsers(done, function (_users) {
            const tasks = _users.map(user => ({
                user: user,
                chat: {
                    name: faker.name.title()
                }
            }));
            loop(done, tasks, function (task, done) {
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
                        done(err);
                    });
            });
        });
    });

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
        });
    });

    function sendMessage(insert, done) {
        const message = {
            type: 'chat',
            chat: insert.chat._id,
            text: faker.lorem.sentences(35)
        };
        supertest(server)
            .post('/api/message')
            .set('content-type', 'application/json')
            .set('cookie', cookies(insert.user))
            .send(message)
            .expect(200)
            .end(function (err, res) {
                const data = JSON.parse(res.text);
                assert.isMongoId(data._id);
                assert.equal(data.type, Message.Type.CHAT);
                assert.equal(data.chat, message.chat);
                assert.equal(data.text, message.text);
                assert.isArray(data.online);
                assert.isDate(data.time);
                message.online = data.online;
                done(err);
            });
    }

    it('message', function (done) {
        const inserts = [];
        chats.forEach(function (chat) {
            const members = chat.admin.concat(chat.follow);
            const length = _.random(0, 10);
            const sender = users[_.sample(members)];
            for (let i = 0; i < length; i++) {
                inserts.push({
                    user: sender,
                    chat: chat
                });
            }
        });
        loop(done, _.shuffle(inserts), sendMessage);
    });


    it('WebSocket', function (done) {
        const sample = bandom.sample(_.values(chats), _.random(1, 4));
        loop(done, sample, function (chat, done) {
            const members = chat.admin.concat(chat.follow).map(member => users[member]);
            assert.equal(_.uniq(members).length, members.length, 'Excessive targets');
            assert(members.length > 1);
            const senders = bandom.sample(members, _.random(1, 3));
            // console.log(members.map(m => m._id).join(' '));
            loop(done, senders, function send(sender, done) {
                const insert = {
                    user: sender,
                    chat: chat
                };

                var messageSend = false;

                loop(done, members, function (member) {
                    if (member._id === sender._id) {
                        done();
                    }
                    else {
                        member.subscribe(function (data) {
                            if (messageSend) {
                                const message = JSON.parse(data);
                                assert.isMongoId(message._id);
                                assert(message.source, sender._id);
                                done();
                            }
                        });
                    }
                });

                sendMessage(insert, function (err) {
                    if (err) {
                        done(err);
                    }
                    else {
                        messageSend = true;
                    }
                });
            });
        });
    });

    // after(closeSockets(users));
});
