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
        _.db.collection('user').find({_id: {$in: ids}}, {auth: 0, password: 0, email: 0, friends: 0, blacks: 0}).toArray(_.answer);
    },

    view: function(_) {
        _.db.collection('user')
            .findOne(
                {_id: ObjectID(_.req.url.query.id)},
                {auth: 0, password: 0, email: 0},
                _.wrap(function(user) {
                    console.log(user.blacks, _.user._id);
                    if (user.blacks && user.blacks.indexOf(_.user._id) >= 0) {
                        _.res.send(403, {
                            surname: user.surname,
                            forename: user.forename,
                            avatar: user.avatar,
                            error: "You blocked"
                        });
                    }
                    else {
                        _.res.send(user);
                    }
                }));
    },

    list: function(_) {
        var source_id = _.user._id; //ObjectID(_.req.url.query.source_id);
        var target_id = ObjectID(_.req.url.query.target_id);
        var l = _.req.url.query.l;
        var o = 'add' == _.req.url.query.do ? '$push' : '$pull';
        var _set = {};
        _set[o] = {};
        _set[o][l] = target_id;
        if (source_id == target_id) {
            _.res.send(400, {error: "cannot himself"});
        }
        else {
            _.db.collection('user').updateOne({_id: source_id}, _set, _.answer);
        }
    },

    subme: function(_) {
        _.db.collection('user').find({friends: _.user._id}, {_id: 1, surname: 1, forename: 1, avatar: 1}, _.answer);
    },

    unset: function(_) {
        var _set = {};
        _set[_.req.url.query.field] = 1;
        _.db.collection('user').updateOne({_id: _.user._id}, {$unset: _set}, _.answer);
    }
};
