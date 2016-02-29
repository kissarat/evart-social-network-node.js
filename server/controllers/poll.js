'use strict';

module.exports = {
    GET: function ($) {
        if (!$.req.since) {
            $.sendStatus(400);
            return;
        }
        var uid = $.user._id;
        var cid = $.req.client_id;
        var subscriber = $.subscribers[uid];
        if (subscriber) {
            if (subscriber[cid]) {
                var res = subscriber[cid];
                res.writeHead(409);
                res.end();
            }
        }
        else {
            $.subscribers[uid] = subscriber = {};
        }
        $.data.find('queue', {time: {$gt: $.req.since}}, function (events) {
            if (events.length > 0) {
                $.send({
                    type: 'queue',
                    queue: events
                })
            }
            else {
                subscriber[cid] = $;
                var close = function () {
                    delete $.subscribers[uid][cid];
                };
                $.req.on('close', close);
                $.res.on('finish', close);
            }
        });
    },

    POST: function ($) {
        var data = $.body;
        data.source_id = $.user._id;
        if (!data.time) {
            data.time = Date.now();
        }
        if ('chat_id' in $.params) {
            $.db.collection('chat').findOne({_id: $.params.chat_id}, $.wrap(function (result) {
                if (result) {
                    result.members.forEach(function (member) {
                        $.notify(member, data);
                    });
                    $.res.end();
                }
                else {
                    $.sendStatus(404);
                }
            }));
        }
        else {
            $.notify($('target_id'), data);
            $.res.end();
        }
    }
};
