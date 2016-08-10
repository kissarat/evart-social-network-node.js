'use strict';

global.chats = [];
var users;

describe('chat', function () {
    before(function () {
        User.find({}).sort({domain: 1}).populate('agent').exec().then(function (_users) {
            users = _users;
        });
    });

    const chat = {
        name: faker.name.title()
    };
    it('create ' + chat.name, function (done) {
        const user = bandom.choice(users);
        request(server).post('/api/chat').send(chat)
            .set('Cookie', cookies(user))
            .expect(200)
            .end(function (err, res) {
                const data = JSON.parse(res.text);
                expect(data._id).to.match(ObjectIDRegex);
                assert.isArray(data.admin);
                expect(data.admin).to.contain(user._id);
                assert.isArray(data.follow);
                assert(0 === data.follow.length);
                _.defaults(chat, _.pick(data, ['_id', 'admin', 'follow']));
                done(data.error || err);
            })
    });
});
