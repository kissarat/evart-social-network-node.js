'use strict';

module.exports = {
    PUT: $ => $.data.updateOne($('entity'), $('target_id'), {$addToSet: {likes: $.user._id}}),

    DELETE: $ => $.data.updateOne($('entity'), $('target_id'), {$pull: {likes: $.user._id}})
};
