var crypto = require('crypto');
var ObjectID = require('mongodb').ObjectID;

function password_hash(data) {
    var hash = crypto.createHash('sha224');
    //console.log(data);
    hash.update(data.toString());
    return hash.digest('hex');
}

module.exports = {
    login: function (_) {
        _.db.collection('user').findOne({email: _.body.email}, _.wrap(function (doc) {
            if (doc && password_hash(_.body.password + _.body.email) == doc.auth) {
                _.res.send(200, {
                    _id: doc._id,
                    auth: doc.auth
                });
            }
            else {
                _.res.writeHead(404);
                _.res.end();
            }
        }));
    },

    signup: function (_) {
        _.body.auth = password_hash(_.body.password + _.body.email);
        _.db.collection('user').insertOne(_.body, _.answer);
    },

    me: function (_) {
        _.res.send(_.user);
    },

    many: function (_) {
        var ids = _.req.url.query.ids.split('.').map(function (id) {
            return ObjectID(id);
        });
        _.db.collection('user').find({_id: {$in: ids}}, {auth: 0, password: 0, email: 0}).toArray(_.answer);
    }
};
