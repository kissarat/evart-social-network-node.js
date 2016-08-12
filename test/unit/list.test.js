'use strict';

const supertest = require('supertest');
const bandom = require('bandom');
const qs = require('querystring');
const faker = require('faker/locale/ru');
const _ = require('lodash');

describe('follow', function () {
    var users;

    it('add', function (done) {
        User.aggregate(queries.user()).exec().then(function (_users) {
            users = _users;
            const follows = [];
            users.forEach(function (user) {
                _.shuffle(users).slice(0, _.random(0, users.length)).forEach(function (follower) {
                    const record = {
                        user: user,
                        follow: follower
                    };
                    record.user._id = record.user._id.toString();
                    record.follow._id = record.follow._id.toString();
                    follows.push(record);
                });
            });
            loop(done, follows, function (record, done) {
                supertest(server)
                    .post('/api/list')
                    .set('content-type', 'application/json')
                    .set('Cookie', cookies(record.user))
                    .send({
                        name: 'follow',
                        target_id: record.follow._id
                    })
                    .expect(200)
                    .end(function (err, res) {
                        const data = JSON.parse(res.text);
                        assert(true === data.success, 'success: false');
                        if (data.success) {
                            record.user.follow.push(record.follow._id);
                        }
                        done(err);
                    });
            });
        })
            .catch(done);

    });

    it('follow informer', function (done) {
        loop(done, _.shuffle(users), function (user, done) {
            const url = '/api/user/informer?' + qs.stringify({
                    id: user._id,
                    select: 'follows.followers.groups.video.audio.friends.photo'
                });
            supertest(server)
                .get(url)
                .set('Accept', 'application/json')
                .set('Cookie', cookies(user))
                .expect(200)
                .end(function (err, res) {
                    const data = JSON.parse(res.text);
                    assert.equal(data.follows, user.follow.length);
                    done(err);
                });
        });
    });

    it('remove ', function (done) {
        loop(done, _.shuffle(users), function (user, done) {
            if (user.follow.length > 0) {
                const url = '/api/list?' + qs.stringify({
                        name: 'follow',
                        target_id: bandom.choice(user.follow)
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
            }
            else {
                done();
            }
        });
    });
});
