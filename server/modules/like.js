'use strict';

var fields = {
    like: 'hate',
    hate: 'like'
};

function _get($) {
    var entity = $.param('entity');
    return $.db.collection(entity).findOne({_id: $.id}, {like: 1, hate: 1});
}

module.exports = {
    POST: function ($) {
        var field = $.param('field');
        var entity = $.param('entity');
        if (fields[field]) {
            var o = {};
            o[field] = $.user._id;
            return $.collection(entity).updateOne({_id: $.id}, {$addToSet: o})
                .then(function () {
                    var o = {};
                    o[fields[field]] = $.user._id;
                    return $.collection(entity).updateOne({_id: $.id}, {$pull: o})
                })
                .then(() => _get($));
        }
        else {
            $.invalid('field');
        }
    },

    GET: _get,

    DELETE: function ($) {
        var field = $.param('field');
        if (fields[field]) {
            var o = {};
            o[field] = $.user._id;
            return $.collection($.param('entity')).updateOne({_id: $.param('id')}, {$pull: o})
                .then(() => _get($))
        }
        else {
            $.invalid('field');
        }
    }
};
