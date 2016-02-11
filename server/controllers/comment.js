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
            owner_id: ObjectID(_.body.owner_id),
            text: _.body.text,
            time: Date.now(),
            type: _.body.type
        };
        if (_.body.target_id) {
            data.target_id = ObjectID(_.body.target_id)
        }

        _.db.collection('comment').insertOne(data, _.wrap(function (result) {
            _.send(_.body.owner_id, data);
            _.res.send(result);
        }));
    },

    history: function (_) {
        var q = _.req.url.query;
        var owner_id = ObjectID(q.owner_id);
        _.db.collection('comment').aggregate([
                {$match: {
                    type: q.type,
                    owner_id: owner_id
                }},
                {$sort: {time: 1}}
            ])
            .toArray(_.answer);
    }
};
