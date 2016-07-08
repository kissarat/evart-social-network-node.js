"use strict";

module.exports = {
    _before: function ($) {
        return 'admin' === $.user.type;
    },

    POST: function ($) {
        $.collection($.get('c'))
            .update(
                {_id: $.get('id')},
                {$set: $.body},
                $.answer
            );
    },

    DELETE: function ($) {
        $.collection($.get('c'))
            .remove({_id: $.get('id')}, $.answer);
    }
};
