'use strict';

var crypto = require('crypto');
var ObjectID = require('mongodb').ObjectID;

function password_hash(data) {
    var hash = crypto.createHash('sha224');
    //console.log(data);
    hash.update(data.toString());
    return hash.digest('hex');
}

module.exports = {
    login: function (_) {
        _.db.collection('user').findOne({email: _.body.email}, _.wrap(function (doc) {
            if (doc && password_hash(_.body.password + _.body.email) == doc.auth) {
                _.res.send(200, {
                    _id: doc._id,
                    auth: doc.auth
                });
            }
            else {
                _.res.writeHead(404);
                _.res.end();
            }
        }));
    },

    signup: function (_) {
        _.body.auth = password_hash(_.body.password + _.body.email);
        _.db.collection('user').insertOne(_.body, _.answer);
    },

    me: function (_) {
        _.res.send(_.user);
    },

    many: function (_) {
        var ids = _.req.url.query.ids.split('.').filter(function(id) {
            return /^[0-9a-f]{24}$/.test(id)
        })
            .map(function (id) {
            return ObjectID(id);
        });
        _.db.collection('user').find({_id: {$in: ids}}, {auth: 0, password: 0, email: 0}).toArray(_.answer);
    },

    add: function(_) {
        var source_id = ObjectID(_.req.url.query.source_id);
        var target_id = ObjectID(_.req.url.query.target_id);
        if (source_id == target_id) {
            _.res.send(400, {error: "cannot add himself"});
        }
        else {
            _.db.collection('user').updateOne({_id: source_id}, {$addToSet: {friend: target_id}}, _.answer);
        }
    },

    friends: function(_) {
        _.db.collection('user').findOne(ObjectID(_.req.url.query.id), _.wrap(function(user) {
            _.db.collection('user')
                .find({_id: {$in: user.friend}}, {auth: 0, password: 0, email: 0})
                .toArray(_.answer);
        }))
    }
};
