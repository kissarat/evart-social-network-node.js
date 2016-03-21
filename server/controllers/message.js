'use strict';

var ObjectID = require('mongodb').ObjectID;
var validate = require(__dirname + '/../../client/coffee/validate.js');

module.exports = {
    PUT: function ($) {
        var text = validate.fields.text($.get('text'));
        var data = {
            source_id: $.user._id,
            type: $.param('type'),
            text: text,
            time: Date.now()
        };

        if ($.has('owner_id')) {
            data.owner_id = $.param('owner_id');
        }
        if ($.has('target_id')) {
            data.target_id = $.param('target_id');
        }
        if ($.has('chat_id')) {
            data.chat_id = $.param('chat_id');
        }
        /*
         if (_.body.target_id) {
         data.target_id = ObjectID(_.body.target_id)
         }
         */
        if ($.req.geo) {
            data.geo = $.req.geo;
        }

        if ($.has('medias')) {
            data.medias = $.param('medias').map(function(media) {
                media.id = ObjectID(media.id);
                return media;
            });
        }

        $.data.insertOne('message', data, function (result) {
            $.send(result);
            if (data.chat_id) {
                $.data.findOne('chat', data.chat_id, function (chat) {
                    chat.members.forEach(function (member) {
                        $.notify(member, data);
                    });
                });
            }
            else {
                $.notify(data.owner_id, data);
            }
        });
    },

    GET: function ($) {
        var match = {
            type: $.param('type')
        };
        if ($.has('owner_id')) {
            match.owner_id = $.param('owner_id');
            if ('video' == match.type) {
                match.video_id = $.param('video_id');
            }
        }
        else if ('message' == match.type) {
            var or;
            if ($.has('chat_id')) {
                match.chat_id = $.param('chat_id');
            }
            else {
                if ($.has('target_id')) {
                    var target_id = $.param('target_id');
                    or = [
                        {
                            source_id: $.user._id,
                            target_id: target_id
                        },
                        {
                            source_id: target_id,
                            target_id: $.user._id
                        }
                    ];
                }
                else {
                    or = [
                        {source_id: $.user._id},
                        {target_id: $.user._id}

                    ];
                }
                match = [
                    {
                        $match: {
                            chat_id: {$exists: false},
                            type: 'message',
                            $or: or
                        }
                    }
                ];
            }

            //if ($.has('show')) {
            //    match.push({
            //        $group: {
            //            _id: {$source_id: '$source_id', $target_id: '$target_id'},
            //            text: {$first: '$text'},
            //            time: {$first: '$time'}
            //        }
            //    });
            //}


            //match.push({
            //    $lookup: {
            //        from: 'user',
            //        localField: 'source_id',
            //        foreignField: '_id',
            //        as: 'source'
            //    }
            //});
            //match.push({
            //    $lookup: {
            //        from: 'user',
            //        localField: 'target_id',
            //        foreignField: '_id',
            //        as: 'target'
            //    }
            //});

        }
        $.data.find('message', match);
    }
};
