"use strict";

var ObjectID = require('mongodb').ObjectID;

module.exports = {
    GET: function($) {
        if ($.has('id')) {
            $.data.findOne('chat', $.param('id'));
        }
        else {
            var member_id = $.has('member_id') ? $.param('member_id') : $.user._id;
            $.data.find('chat', {members: member_id});
        }
    },

    PUT: function($) {
        var data = {
            owner_id: $.user._id,
            title: $.param('title'),
            members: $.param('members').map(ObjectID),
            created: Date.now()
        };
        $.data.insertOne('chat', data, function(result) {
            if (result.insertedCount > 0) {
                result.id = data._id;
                $.send(201, {
                    ok: 1,
                    id: data._id
                });
            }
            else {
                $.send(500);
            }
        });
    },

    POST: function(_) {

    },

    DELETE: function(_) {
        if (_.has('id')) {
            _.db.collection('chat').deleteOne({_id: _.params.id}, _.answer);
        }
        else if (_.has('members')) {

        }
        else {
            _.sendStatus(401);
        }
    }
};
