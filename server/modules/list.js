'use strict';
var ObjectID = require('mongodb').ObjectID;
var _ = require('underscore');

function valid(name) {
    return _.contains(['friend', 'follower', 'follow'], name);
}

module.exports = {
    GET: function ($) {
        var name = $.param('name');
        if (!valid(name)) {
            $.invalid(name);
        }
        var id = $.has('id') ? $.get('id') : $.user._id;
        var aggregate = [{
            $match: _.contains(['friend', 'follower']) ? {follow: id} : {_id: id}
        }];
        if ('friend' == name) {
            aggregate.push({
                $unwind: '$follow'
            });
            aggregate.push({
                $lookup: {
                    'as': 'follow',
                    localField: 'follow',
                    from: 'user',
                    foreignField: '_id'
                }
            });
            aggregate.push({
                $unwind: '$follow'
            });
            aggregate.push({
                $match: {
                    'follow.follow': id
                }
            });
        }
        User.filter($, aggregate);
        aggregate.push({
            $project: $.select(['domain'], User.fields.select.user, true)
        });
        return {
            collection: 'user',
            query: aggregate
        }
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
