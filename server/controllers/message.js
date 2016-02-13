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
    post: function (_) {
        var data = {
            source_id: _.user._id,
            target_id: ObjectID(_.body.target_id),
            text: _.body.text,
            time: Date.now()
        };

        if (_.req.headers.geo) {
            data.geo = JSON.parse(_.req.headers.geo);
        }

        _.db.collection('message').insertOne(data, _.wrap(function (result) {
            data.type = 'message';
            _.send(_.body.target_id, data);
            _.res.send(result);
        }));
    },

    history: function (_) {
        var q = _.req.url.query;
        var source_id = q.source_id ? ObjectID(q.source_id) : _.user._id;
        var target_id = ObjectID(q.target_id);
        _.db.collection('message').aggregate([
                {
                    $match: {
                        $or: [
                            {source_id: source_id, target_id: target_id},
                            {source_id: target_id, target_id: source_id}
                        ]
                    }
                },
                {$sort: {time: 1}}
            ])
            .toArray(_.wrap(function (messages) {
                var user_ids = new Set();
                messages.forEach(function (message) {
                    user_ids.add(ObjectID(message.source_id));
                    user_ids.add(ObjectID(message.target_id));
                });
                _.db.collection('user')
                    .find({_id: {$in: Array.from(user_ids)}}, secret_projection)
                    .toArray(_.wrap(function (users) {
                        _.res.send({
                            users: keyed(users),
                            messages: messages
                        });
                    }))
            }));
    }
};
