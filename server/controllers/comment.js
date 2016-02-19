'use strict';

var ObjectID = require('mongodb').ObjectID;
function keyed(array) {
    var object = {};
    for (var i = 0; i < array.length; i++) {
        object[array[i]._id] = array[i];
    }
    return object;
}

var secret_projection = {
    auth: 0,
    email: 0,
    password: 0
};

module.exports = {
    PUT: function ($) {
        var data = {
            source_id: $.user._id,
            type: $('type'),
            owner_id: $('owner_id'),
            text: $('text'),
            time: Date.now()
        };
/*
        if (_.body.target_id) {
            data.target_id = ObjectID(_.body.target_id)
        }
*/
        if ($.req.geo) {
            data.geo = $.req.geo;
        }

        if ($.has('medias')) {
            data.medias = $('medias');
        }

        $.data.insertOne('comment', data, function (result) {
            $.send(result);
            $.notify(data.owner_id, data);
        });
    },

    GET: function ($) {
        var match = {
            type: $('type'),
            owner_id: $('owner_id')
        };
        if ('video' == match.type) {
            match.video_id = $('video_id');
        }
        $.data.find('comment', match);
    }
};
