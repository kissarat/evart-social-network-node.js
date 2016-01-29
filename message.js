var ObjectID = require('mongodb').ObjectID;

module.exports = {
    post: function(_) {
        var data = {
            source_id: _.user.id,
            target_id: ObjectID(_.req.body.target_id),
            text: _.req.body.text,
            time: Date.now()
        };
        _.db.collection('message').insertOne(data, _.answer);
    },

    history: function(_) {
        var q = _.req.url.query;
        var source_id = q.source_id ? ObjectID(q.source_id) : _.user.id;
        var target_id = ObjectID(q.target_id);
        _.db.collection('message').find({$or: [
            {source_id: source_id, target_id: target_id},
            {source_id: target_id, target_id: source_id}
        ]})
            .toArray(_.answer);
    }
};
