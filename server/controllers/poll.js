'use strict';

module.exports = {
    GET: function (_) {
        var uid = _.user._id;
        var cid = _.req.client_id;
        var subscriber = _.subscribers[uid];
        if (subscriber) {
            subscriber = subscriber[cid];
        }
        if (subscriber && 'queue' == subscriber.type) {
            delete _.subscribers[uid][cid];
            _.res.send(subscriber);
        }
        else {
            if (!_.subscribers[uid]) {
                _.subscribers[uid] = {}
            }
            _.subscribers[uid][cid] = _.res;
            var close = function () {
                delete _.subscribers[uid][cid];
            };
            _.req.on('close', close);
            _.res.on('finish', close);
        }
    },

    POST: function (_) {
        var data = _.body;
        data.source_id = _.user._id;
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
            _.send(_.req.url.query.target_id, data);
            _.res.end();
        }
    }
};
