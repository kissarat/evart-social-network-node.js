"use strict";

module.exports = {
    _before: function ($) {
        return $.isAdmin;
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
    },

    exit: function () {
        console.log('admin/exit');
        process.exit();
    },

    throw: function () {
        throw new Error();
    }
};
