god = require 'mongoose'


global.schema.Message = god.Schema
  source:
    type: god.Schema.Types.ObjectId
    ref: 'User'
    required: true

  target:
    type: god.Schema.Types.ObjectId
    ref: 'User'
    required: true

  time:
    type: Date,
    required: true
    default: Date.now

  read:
    type: Boolean
    default: false

  text:
    type: String
    required: true


module.exports =
  POST: ($) ->
    message = new Message $.body
    message.source = $.user._id
    message.save null, $.answer

  GET: ($) ->
    target_id = $.get('target_id')
    me = $.user._id
    User.find
      $or: [
        {source: me, target: target_id},
        {source: target_id, target: me}
      ]
