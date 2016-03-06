module.exports = {
    GET: function ($) {
        $.data.find('log', [{
            $match: {time: {$gt: 1}}
        },
            {
                $lookup: {
                    from: 'client',
                    localField: 'client_id',
                    foreignField: '_id',
                    as: 'client'
                }
            }]);
    },

    subscribers: function ($) {
        var s = {};
        for (var uid in $.subscribers) {
            var user;
            for (var cid in $.subscribers[uid]) {
                user = $.subscribers[uid][cid];
                break;
            }
            s[uid] = {
                user_id: user._id,
                clients: Object.keys($.subscribers[uid])
            };
        }
        $.send(s);
    }
};
