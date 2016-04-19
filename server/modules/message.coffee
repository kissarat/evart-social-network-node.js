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

  photo:
    type: god.Schema.Types.ObjectId
    ref: 'Photo'

  video:
    type: god.Schema.Types.ObjectId
    ref: 'Video'

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

  ip:
    type: String

  geo:
    type: Array


module.exports =
  POST: ($) ->
    message = new Message $.body
    message.source = $.user._id
    message.ip = $.req.connection.remoteAddress
    message.save $.answer

  GET: ($) ->
    r = null
    if $.has 'target_id'
      target_id = $.param 'target_id'
      me = $.user._id
      r = Message.find
        $or: [
          {source: me, target: target_id},
          {source: target_id, target: me}
        ]
    else if $.has 'video_id'
      r = Message.find video: $.param 'video_id'
    else if $.has 'photo_id'
      r = Message.find photo: $.param 'photo_id'
    if r
      r
      .populate('source', '_id domain avatar')
      .populate('target', '_id domain avatar')
    else
      $.sendStatus code.BAD_REQUEST
      return

  DELETE: ($) ->
    Message.remove _id: $.id

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
