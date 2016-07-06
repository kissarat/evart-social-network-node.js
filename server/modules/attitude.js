'use strict';

var utils = require('../utils');

var fields = {
    like: 'hate',
    hate: 'like'
};

module.exports = {
    POST: function ($) {
        var me = $.user._id;
        var attitude = $.inArray('name', Object.keys(fields));
        var changes = {
            $addToSet: utils.associate(attitude, me),
            $pull: utils.associate(fields[attitude], me)
        };
        $.collection($.inArray('entity', config.client.attitude.entities))
            .update({_id: $.param('id')}, changes, $.answer);
    },

    DELETE: function ($) {
        var attitudes = {
            like: $.user._id,
            hate: $.user._id
        };
        $.collection($.inArray('entity', config.client.attitude.entities))
            .update({_id: $.id}, {$pull: attitudes}, $.answer);
    }
};
