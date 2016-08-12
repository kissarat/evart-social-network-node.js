'use strict';

const supertest = require('supertest');
const bandom = require('bandom');
const qs = require('querystring');
const faker = require('faker/locale/ru');
// const chai = require('chai');
// const expect = chai.expect;
const _ = require('lodash');

describe('dialog', function () {
    const users = {};
    const userDialogs = {};

    it('message', function (done) {
        loadUsers(done, function (_users) {
            const tasks = [];
            _.each(_users, function (user) {
                user._id = user._id.toString();
                users[user._id] = user;
                const length = _.random(0, 100);
                for (let i = 0; i < length; i++) {
                    tasks.push({
                        user: user,
                        type: 'dialog',
                        target: bandom.choice(_users)._id,
                        text: faker.lorem.sentence()
                    });
                }
            });

            loop(done, _.shuffle(tasks), function (task, done) {
                const cookie = cookies(task.user);
                delete task.user;
                supertest(server)
                    .post('/api/message')
                    .set('content-type', 'application/json')
                    .set('cookie', cookie)
                    .send(task)
                    .expect(200)
                    .end(function (err, res) {
                        const data = JSON.parse(res.text);
                        assert.isMongoId(data._id);
                        assert.equal(data.type, Message.Type.DIALOG);
                        assert.equal(data.text, task.text);
                        done(err);
                    });
            });
        });
    });

    it('list', function (done) {
        loop(done, _.shuffle(_.values(users)), function (user, done) {
            supertest(server)
                .get('/api/message/dialogs?id=' + user._id)
                .set('content-type', 'application/json')
                .set('cookie', cookies(user))
                .expect(200)
                .end(function (err, res) {
                    const data = JSON.parse(res.text);
                    assert.isArray(data);
                    const dialogs = {};
                    data.forEach(function (dialog) {
                        assert(['chat', 'dialog'].includes(dialog.type), 'Invalid dialog type ' + dialog.type);
                        assert.equal(dialog.type, dialog.chat ? 'chat' : 'dialog');
                        dialogs[dialog._id] = dialog;
                    });
                    userDialogs[user._id] = {user: user, dialogs: dialogs};
                    done(err);
                });
        });
    });

    it('read', function (done) {
        function checkRead(err) {
            if (err) {
                done(err);
            }
            else {
                loop(done, _.values(userDialogs), function (dialogs, done) {
                    const user = dialogs.user;
                    dialogs = dialogs.dialogs;
                    supertest(server)
                        .get('/api/message/dialogs?id=' + user._id)
                        .set('content-type', 'application/json')
                        .set('cookie', cookies(user))
                        .expect(200)
                        .end(function (err, res) {
                            const data = JSON.parse(res.text);
                            assert.isArray(data);
                            const dialogs = {};
                            data.forEach(function (dialog) {
                                assert.equal(dialog.count, 0);
                                dialogs[dialog._id] = dialog;
                            });
                            userDialogs[user._id].dialogs = dialogs;
                            done(err);
                        });
                });
            }
        }

        loop(checkRead, _.shuffle(_.values(userDialogs)), function (dialogs) {
            const user = dialogs.user;
            dialogs = dialogs.dialogs;
            const unread = _.shuffle(_.filter(dialogs, dialog => dialog.unread > 0));
            assert(_.size(unread) >= _.size(users));
            loop(done, unread, function (dialog, done) {
                supertest(server)
                    .post('/api/message/read?target_id=' + dialog._id)
                    .set('content-type', 'application/json')
                    .set('cookie', cookies(user))
                    .expect(200)
                    .end(function (err, res) {
                        const data = JSON.parse(res.text);
                        assert(data.success);
                        assert.equal(data.type, 'read');
                        done(err);
                    });
            });
        });
    });
    
    after(closeSockets(users));
});
