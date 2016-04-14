god = require 'mongoose'
ObjectID = require('mongodb').ObjectID


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

  unread:
    type: Number
    default: 1

  text:
    type: String
    required: true


module.exports =
  POST: ($) ->
    message = new Message $.body
    message.source = $.user._id
    message.save $.answer

  GET: ($) ->
    target_id = $.get('target_id')
    me = $.user._id
    Message.find
      $or: [
        {source: me, target: target_id},
        {source: target_id, target: me}
      ]

  read: ($) ->
    if $.has('id')
      Message.update {_id: $.param('id')}, {unread: 0}
    else
      return false

  dialogs: ($) ->
    me = $.user._id
#    console.log $.user._id.constructor.name

    Message.aggregate [
      {$sort: time: -1},
      {$match: target: me}
      {
        $group:
          _id: '$source'
          text: $first: '$text'
          time: $first: '$time'
          unread: $sum: '$unread'
      }
    ]
    .exec $.wrap (source_messages) ->
      Message.aggregate [
        {$sort: time: -1},
        {$match: source: me},
        {
          $group:
            _id: '$target'
            text: $first: '$text'
            time: $first: '$time'
            unread: $sum: '$unread'
        }
      ]
      .exec $.wrap (target_messages) ->
        dialogs = source_messages.concat target_messages
        conditions =
          _id:
            $in: dialogs.map((dialog) -> ObjectID(dialog._id))
        User.find conditions, '_id domain', $.wrap (results) ->
          users = {}
          for user in results
            users[user._id] = user.toJSON()
          for dialog in dialogs
            dialog.user = users[dialog._id]
          $.send dialogs
    return
