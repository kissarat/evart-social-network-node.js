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
                $.res.send({
                    type: 'queue',
                    queue: events
                })
            }
            else {
                subscriber[cid] = $.res;
                var close = function () {
                    delete $.subscribers[uid][cid];
                };
                $.req.on('close', close);
                $.res.on('finish', close);
            }
        });
    },

    POST: function ($) {
        var data = _.body;
        data.source_id = $.user._id;
        if (!data.time) {
            data.time = Date.now();
        }
        if ('chat_id' in _.params) {
            _.db.collection('chat').findOne({_id: _.params.chat_id}, _.wrap(function (result) {
                if (result) {
                    result.members.forEach(function (member) {
                        _.send(member, data);
                    });
                    _.res.end();
                }
                else {
                    _.sendStatus(404);
                }
            }));
        }
        else {
            data =
            _.send($('target_id'), data);
            _.res.end();
        }
    }
};
