"use strict";

const domains = require('../domains').slice(0, 20);
const faker = require('faker/locale/ru');
const utils = require('../../server/utils');
const _ = require('underscore');

module.exports = function (db) {
    db.collection('user').find({domain: {$in: domains}}).toArray(function (err, users) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        var user_ids = users.map(u => u._id);
        generate_chats(db, user_ids).then(function () {
            generate_message(db, user_ids);
        });
    })
};

var chats = [];

function generate_chats(db, users) {
    for(var i = 0; i < 10; i++) {
        var time = new Date().toISOString();
        var chat = {
            _id: utils.id12('Chat'),
            admin: [_.sample(users)],
            name: faker.name.title(_.random(1, 4)),
            create: time,
            time: time
        };
        chats.push(chat);
        console.log(chat)
    }
    return new Promise(function (resolve, reject) {
        db.collection('chat').insert(chats, function (err, ok) {
            if (err) {
                reject(err);
            }
            else {
                chats = chats.map(chat => chat._id);
                resolve(ok);
            }
        })
    })
}

var message_number = 300000;

function generate_message(db, users) {
    message_number--;
    if (message_number > 0) {
        var time = new Date().toISOString();
        var message = {
            _id: utils.id12('Message'),
            source: _.sample(users),
            chat: _.sample(chats),
            text: faker.lorem.sentence(),
            create: time,
            time: time
        };
        db.collection('message').insert(message, function (err) {
            if (err) {
                console.error(err);
                process.exit(-1);
            }
            if (0 === message_number % 1000) {
                console.log(message_number);
            }
            generate_message(db, users);
        })
    }
    else {
        process.exit();
    }
}
