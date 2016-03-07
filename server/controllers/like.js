'use strict';

module.exports = {
    PUT: $ => $.data.updateOne($.param('entity'), $.param('target_id'), {$addToSet: {likes: $.user._id}}),

    DELETE: $ => $.data.updateOne($.param('entity'), $.param('target_id'), {$pull: {likes: $.user._id}})
};
