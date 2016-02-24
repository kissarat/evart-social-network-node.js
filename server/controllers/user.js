'use strict';

var crypto = require('crypto');
var ObjectID = require('mongodb').ObjectID;
var user_list_fields = {_id: 1, surname: 1, forename: 1, avatar: 1};

function password_hash(data) {
    var hash = crypto.createHash('sha224');
    //console.log(data);
    hash.update(data.toString());
    return hash.digest('hex');
}

module.exports = {
    login: function ($) {
        $.data.findOne('user', {email: $.body.email}, user => {
            if (user && password_hash(_.body.password + _.body.email) == user.auth) {
                $.send(200, {
                    id: user._id,
                    auth: user.auth
                });
            }
            else {
                $.sendStatus(404);
            }
        });
    },

    signup: function (_) {
        _.body.auth = password_hash(_.body.password + _.body.email);
        _.db.collection('user').insertOne(_.body, _.answer);
    },

    me: function (_) {
        _.send(_.user);
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

    view: function($) {
        $.db.collection('user')
            .findOne(
                {_id: $('id')},
                {auth: 0, password: 0, email: 0},
                $.wrap(function(user) {
                    if (user.blacks && user.blacks.indexOf($.user._id) >= 0) {
                        $.send(403, {
                            surname: user.surname,
                            forename: user.forename,
                            avatar: user.avatar,
                            error: "You blocked"
                        });
                    }
                    else {
                        $.send(user);
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
            _.send(400, {error: "cannot himself"});
        }
        else {
            _.db.collection('user').updateOne({_id: source_id}, _set, _.answer);
        }
    },

    subme: function(_) {
        _.db.collection('user').find({friends: [_.user._id]}, user_list_fields).toArray(_.answer);
    },

    subto: function(_) {
        _.db.collection('user').findOne({_id: ObjectID(_.req.url.query.id)}, {friends: 1}, _.wrap(function(user) {
            if (user.friends && user.friends.length > 0) {
                _.db.collection('user').find({_id: {$in: user.friends}}, user_list_fields).toArray(_.answer);
            }
            else {
                _.send([]);
            }
        }));
    },

    unset: function(_) {
        var _set = {};
        _set[_.req.url.query.field] = 1;
        _.db.collection('user').updateOne({_id: _.user._id}, {$unset: _set}, _.answer);
    },

    GET: function($) {
        var q = {$regex: $('q')};
        var fields = $.has('fields') ? $('fields').split(',') : ['surname', 'forename'];
        var or = [];
        fields.forEach(field => {
            var part = {};
            part[field] = q;
            or.push(part)
        });
        $.data.find('user', {$or: or});
    }
};
