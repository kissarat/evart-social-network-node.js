module.exports = {
    post: function(_) {
        _.body.source_id = _.user.id;
        _.db.collection('message').insertOne(_.body, _.answer);
    },

    history: function(_) {
        var q = _.req.query;
        _.db.collection('message').find({$or: [
            {source_id: q.source_id, target_id: q.target_id},
            {source_id: q.target_id, target_id: q.source_id},
        ]},
            _.answer)
    }
};
