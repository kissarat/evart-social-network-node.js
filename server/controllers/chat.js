'use strict';
var ObjectID = require('mongodb').ObjectID;

module.exports = {
    PUT: function(_) {
        var data = {
            owner_id: _.user._id,
            members: 'members' in _.params ? _.params.members.map(ObjectID) : [],
            created: Date.now()
        };
        _.db.collection('chat').insertOne(data, _.answer);
    },

    POST: function(_) {

    },

    DELETE: function(_) {
        if ('id' in _.params) {
            _.db.collection('chat').deleteOne({_id: _.params.id}, _.answer);
        }
        else if ('members' in _.params) {

        }
        else {
            _.sendStatus(401);
        }
    }
};
