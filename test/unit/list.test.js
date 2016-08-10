'use strict';

const supertest = require('supertest');
const bandom = require('bandom');
const faker = require('faker/locale/ru');
const _ = require('lodash');

describe('follow', function () {
    return;
    targets.forEach(function (target) {
        it('add ' + user.domain + ' ' + target.domain, function (done) {
            chai.request(server)
                .post('/api/agent')
                .set('Accept', 'application/json')
                .set('Cookie', cookies(user))
                .send({
                    name: 'follow',
                    target_id: target._id
                })
                .expect(200)
                .end(function (err, res) {
                    const data = JSON.parse(res.text);
                    if (data.error || !data.success) {
                        throwJSON(data);
                    }
                    else {
                        assert(true === data.success, 'success: false');
                        done(err);
                    }
                });
        });
    });

    it('follow informer ' + user.domain, function (done) {
        const url = '/api/user/informer?' + qs.stringify({
                id: user._id,
                select: 'follows.followers.groups.video.audio.friends.photo'
            });
        chai.request(server)
            .set('Accept', 'application/json')
            .set('Cookie', cookies(user))
            .get(url)
            .end(function (err, res) {
                const data = JSON.parse(res.text);
                assert(data.follows === targets.length);
                done(data.error || err);
            })
    });

    const target = bandom.choice(targets);
    it('remove ' + target.domain, function (done) {
        const url = '/api/list?' + qs.stringify({
                name: 'follow',
                target_id: target._id
            });
        chai.request(server)
            .delete(url)
            .set('Accept', 'application/json')
            .set('Cookie', cookies(user))
            .expect(200)
            .end(function (err, res) {
                const data = JSON.parse(res.text);
                assert(true === data.success, 'success: false');
                done(data.error || err);
            });
    });
});
