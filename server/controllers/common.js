'use strict';

var ObjectID = require('mongodb').ObjectID;

module.exports = {
    like: function(_) {
        var target_id = ObjectID(_.req.url.query.target_id);
        var entity = _.req.url.query.entity;
        _.db.collection(entity).findOne({_id: target_id}, {likes: 1}, _.wrap(function(result) {
            var _set = {};
            var contains = result.likes.indexOf(_.req.url.query.target_id) >= 0;
            _set[contains ? '$pull' : '$addToSet'] = {likes: _.user._id};
            _.db.collection(entity).update({_id: target_id}, _set, _.wrap(function() {
                _.res.send({
                    likes_count: result.likes.length + (contains ? -1 : 1)
                });
            }));
        }));
    },

    add_like: function(_) {
        var target_id = ObjectID(_.req.url.query.target_id);
        var entity = _.req.url.query.entity;
        _.db.collection(entity).update({_id: target_id}, {$addToSet: {likes: _.user._id}}, _.answer);
    },

    remove_like: function(_) {
        var target_id = ObjectID(_.req.url.query.target_id);
        var entity = _.req.url.query.entity;
        _.db.collection(entity).update({_id: target_id}, {$pull: {likes: _.user._id}}, _.answer);
    }
};
