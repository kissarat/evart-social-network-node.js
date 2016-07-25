'use strict';
var ObjectID = require('mongodb').ObjectID;

var list_fields = {
    follow: 'deny',
    deny: 'follow',
    friend: null,
    request: null
};

module.exports = {
    GET: function ($) {
        var name = $.param('name');
        if (!list_fields.hasOwnProperty(name)) {
            $.invalid('name');
        }
        var fields = {['friend' === name ? 'follow' : name]: 1};
        var id = $.has('id') ? $.get('id') : $.user._id;
        User.findOne(id, fields, $.wrap(function (user) {
            var query = User.search($);
            if (!query.$and) {
                query.$and = [];
            }
            if ('friend' === name) {
                query.$and.push({
                    _id: {
                        $in: user.follow.map(ObjectID)
                    },
                    follow: user._id
                })
            } else {
                console.error('invalid 29');
            }
            console.log(JSON.stringify(query));
            User.find(query, $.select(['domain'], User.fields.select.user, true)).exec($.answer);
        }));
    },

    POST: function ($) {
        return User.update({_id: $.user._id}, {
            $addToSet: {[$.param('name')]: $.param('target_id')}
        });
    },

    DELETE: function ($) {
        return User.update({_id: $.user._id}, {
            $pull: {[$.param('name')]: $.param('target_id')}
        });
    }
};

function modify_list(add) {
    return function ($) {
        var name = $.param('name');
        var source_id = $.has('source_id') ? $.get('source_id') : $.user._id;
        var target_id = $.param('target_id');
        if (!list_fields.hasOwnProperty(name)) {
            $.invalid('name');
        }
        var result = {success: true};
        return new Promise(function (resolve, reject) {
            User.findOne(source_id, {follow: 1}).catch(reject).then(function (user) {
                var index = _.findIndex(user.follow, id => id.equals(target_id));
                result.found = index >= 0;
                if (result.found == add) {
                    result.success = result.found && !add;
                    resolve(result);
                }
                else {
                    result.modified = true;
                    if (add) {
                        user.follow.push(target_id);
                    }
                    else {
                        user.follow.splice(index, 1);
                    }
                    user.save().catch(reject).then(function (user) {
                        resolve(result);
                    });
                }
            })
        });
    }
}
