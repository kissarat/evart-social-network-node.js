var crypto = require('crypto');

function password_hash(data) {
    var hash = crypto.createHash('sha224');
    hash.update(data);
    return hash.digest('hex');
}

module.exports = {
    login: function(_) {
        _.db.collection('user').findOne({email: _.body.email}, _.wrap(function(doc) {
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

    signup: function(_) {
        var data = _.body;
        data.auth = password_hash(_.body.password + _.body.email);
        _.db.collection('user').insertOne(data, _.answer);
    },

    me: function(_) {
        _.res.send(_.user);
    }
};
