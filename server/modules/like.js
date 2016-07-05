'use strict';

var utils = require('../utils');

var fields = {
    like: 'hate',
    hate: 'like'
};

module.exports = {
    _before: function ($) {
        $._attitude = $.inArray('attitude', Object.keys(fields));
        $._collection = $.collection($.inArray('entity', config.client.attitude.entities));
        return true;
    },

    POST: function ($) {
        var me = $.user._id;
        var changes = {};
        changes.$addToSet = utils.associate($._attitude, me);
        changes.$pull = utils.associate(fields[$._attitude], me);
        $._collection.update({_id: $.param('id')}, changes, $.answer);
    },

    DELETE: function ($) {
        $._collection.update({_id: $.id}, {$pull: utils.associate($._attitude, $.user._id)}, $.answer);
    }
};
