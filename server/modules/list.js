'use strict';
var ObjectID = require('mongodb').ObjectID;
var _ = require('underscore');

function valid(name) {
    return _.contains(['friend', 'follower', 'follow', 'chat'], name);
}

module.exports = {
    GET: function ($) {
        var name = $.param('name');
        if (!valid(name)) {
            $.invalid(name);
        }
        var id = $.has('id') ? $.get('id') : $.user._id;
        var aggregate;
        var collection;
        if ('chat' == name) {
            collection = 'chat';
            aggregate = [{
                $match: {_id: id}
            }, {
                $project: {
                    member: {$setUnion: ['$admin', '$follow']}
                }
            }, {
                $unwind: {
                    path: '$member',
                    includeArrayIndex: 'n'
                }
            }, {
                $lookup: {
                    as: 'member',
                    localField: 'member',
                    from: 'user',
                    foreignField: '_id'
                }
            }, {
                $unwind: '$member'
            }, {
                $project: {
                    _id: '$member._id',
                    domain: '$member.domain',
                    type: '$member.type',
                    forename: '$member.forename',
                    surname: '$member.surname',
                    sex: '$member.sex',
                    lang: '$member.lang',
                    avatar: '$member.avatar',
                    online: '$member.online',
                    time: '$member.time',
                    country: '$member.country',
                    city_id: '$member.city_id',
                    city: '$member.city',
                    languages: '$member.languages',
                    n: 1
                }
            }];
        }
        else {
            aggregate = [{
                $match: _.contains(['friend', 'follower'], name) ? {follow: id} : {_id: id}
            }];
            if ('friend' == name) {
                aggregate.push({
                    $unwind: '$follow'
                });
                aggregate.push({
                    $lookup: {
                        as: 'follow',
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
        }
        User.filter($, aggregate);
        // aggregate.push({
        //     $project: $.select(['domain', 'role'], User.fields.select.user, true)
        // });
        return {
            collection: collection,
            query: aggregate
        }
    }
    ,

    POST: modify('$addToSet'),
    DELETE: modify('$pull')
};

function modify(method) {
    return function ($) {
        return User.update({_id: $.user._id}, {
            [method]: {[$.param('name')]: $.param('target_id')}
        });
    }
}