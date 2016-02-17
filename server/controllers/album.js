var ObjectID = require('mongodb').ObjectID;

module.exports = {
    PUT: function(_) {
        var data = {
            owner_id: _.user._id,
            title: _.body.title
        };
        _.db.collection('album').insertOne(data, _.answer);
    },

    GET: function(_) {
        _.db.collection('album').find({owner_id: ObjectID(_.req.url.query.owner_id)}).toArray(_.answer);
    },

    DELETE: function(_) {
        _.db.collection('album').deleteOne({_id: ObjectID(_.req.url.query.id)}, _.answer);
    }
};
