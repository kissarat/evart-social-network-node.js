'use strict';

var fields = {
    like: 'hate',
    hate: 'like'
};

module.exports = {
    PUT: function($) {
        var field = $.param('field');
        if (fields[field]) {
            var o = {};
            o[field] = $.user._id;
            $.data.updateOne($.param('entity'), $.param('target_id'), {$addToSet: o}, function() {
                var o = {};
                o[fields[field]] = $.user._id;
                $.data.updateOne($.param('entity'), $.param('target_id'), {$pull: o});
            });
        }
        else {
            $.invalid('field');
        }
    },

    DELETE: function($) {
        var field = $.param('field');
        if (fields[field]) {
            var o = {};
            o[field] = $.user._id;
            $.data.updateOne($.param('entity'), $.param('target_id'), {$pull: o})
        }
        else {
            $.invalid('field');
        }
    }
};
