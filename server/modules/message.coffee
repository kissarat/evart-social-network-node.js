god = require 'mongoose'
ObjectID = require('mongodb').ObjectID
code = require __dirname + '/../../client/code.json'


global.schema.Message = god.Schema
#  type:
#    type: String
#    enum: ['wall']

  source:
    type: god.Schema.Types.ObjectId
    ref: 'User'
    required: true

  target:
    type: god.Schema.Types.ObjectId
    ref: 'User'

  owner:
    type: god.Schema.Types.ObjectId
    ref: 'User'

  like: [
    type: god.Schema.Types.ObjectId
    ref: 'User'
  ]

  hate: [
    type: god.Schema.Types.ObjectId
    ref: 'User'
  ]

  photo:
    type: god.Schema.Types.ObjectId
    ref: 'Photo'

  photos: [
    type: god.Schema.Types.ObjectId
    ref: 'Photo'
  ]

  video:
    type: god.Schema.Types.ObjectId
    ref: 'Video'

  videos: [
    type: god.Schema.Types.ObjectId
    ref: 'Video'
  ]

  time:
    type: Date,
    required: true
    default: Date.now

  unread:
    type: Number
    default: 1

  text:
    type: String

  ip:
    type: String

  geo:
    type: Array

  repost:
    type: god.Schema.Types.ObjectId
    ref: 'Message'

  children: [
    type: god.Schema.Types.ObjectId
    ref: 'Message'
  ]


module.exports =
  POST: ($) ->
    message = new Message $.body
    message.source = $.user._id
    message.ip = $.req.connection.remoteAddress
    if $.has 'parent_id'
      parent_id = $.param 'parent_id'
      message.save () ->
        $.collection('messages').update {_id: parent_id}, {$push: {children: message._id}}
    else
      if $.has 'repost_id'
        repost_id = $.param 'repost_id'
        Message.findOne(repost_id)
        .then (repost) ->
          message.repost = if repost.repost then repost.repost else repost._id
          message.owner = message.source
          message.save()
      else
        message.save()

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
    else if $.has 'owner_id'
      r = Message.find owner: $.param 'owner_id'
    if r
      r
      .populate('source', '_id domain avatar')
      .populate('target', '_id domain avatar')
      .populate('videos', '_id thumbnail_url thumbnail_width thumbnail_height')
      .populate('repost', '_id source target photos videos text')
      .populate('children', '_id source target photos videos text time')
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
      {
        $sort:
          time: -1
      },
      {
        $match:
          target: me
      }
      {
        $group:
          _id: '$source'
          text:
            $first: '$text'
          time:
            $first: '$time'
          unread:
            $sum: '$unread'
      }
    ]
    .exec $.wrap (source_messages) ->
      Message.aggregate [
        {
          $sort:
            time: -1
        },
        {
          $match:
            source: me
        },
        {
          $group:
            _id: '$target'
            text:
              $first: '$text'
            time:
              $first: '$time'
            unread:
              $sum: '$unread'
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
