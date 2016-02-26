module.exports = {
    GET: function($) {
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
    }
};
