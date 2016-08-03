"use strict";

const domains = require('../domains');
const utils = require('../../server/utils');
const _ = require('underscore');

var loop_user_ids;
var user_ids;

function exitOnError(error) {
    if (error) {
        setTimeout(function () {
            process.exit(1)
        }, 0);
        throw new Error(error);
    }
}

module.exports = function (db, $) {
    db.collection('user').find({domain: {$in: domains}}).toArray(function (err, users) {
        exitOnError(err);
        user_ids = users.map(u => u._id).reverse();
        loop_user_ids = user_ids.slice(0);
        follow(db, $);
    })
};

function follow(db, $) {
    const user_id = loop_user_ids.pop();
    const follows = _.sample(user_ids, _.random(0, user_ids.length));
    db.collection('user').update({_id: user_id}, {$set: {follow: follows}}, function (err, result) {
        exitOnError(err);
        $.increment(100);
        if (loop_user_ids.length > 0) {
            follow(db, $);
        }
        else {
            process.exit();
        }
    });
}
