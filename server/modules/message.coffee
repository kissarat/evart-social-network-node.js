god = require 'mongoose'
ObjectID = require('mongodb').ObjectID
code = require __dirname + '/../../client/code.json'
_ = require 'underscore'

global.schema.Message = god.Schema
#  type:
#    type: String
#    enum: ['wall']

  source:
    type: god.Schema.Types.ObjectId
    ref: 'User'
    required: true
    index:
      unique: false

  target:
    type: god.Schema.Types.ObjectId
    ref: 'User'
    index:
      unique: false

  owner:
    type: god.Schema.Types.ObjectId
    ref: 'User'
    index:
      unique: false

  like: [
    type: god.Schema.Types.ObjectId
    ref: 'User'
    default: null
  ]

  hate: [
    type: god.Schema.Types.ObjectId
    ref: 'User'
    default: null
  ]

  photo:
    type: god.Schema.Types.ObjectId
    ref: 'Photo'

  photos: [
    type: god.Schema.Types.ObjectId
    ref: 'Photo'
    default: null
  ]

  video:
    type: god.Schema.Types.ObjectId
    ref: 'Video'

  videos: [
    type: god.Schema.Types.ObjectId
    ref: 'Video'
    default: null
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
    default: null
  ]

populate = (r) ->
  r
  .populate('source', '_id domain avatar')
  .populate('target', '_id domain avatar')
  .populate('videos', '_id thumbnail_url thumbnail_width thumbnail_height')
  .populate('repost', '_id source target photos videos text')
  .populate('children', '_id source target photos videos text time')

module.exports =
  POST: ($) ->
    message = new Message $.body
    message.source = $.user._id
    message.ip = $.req.connection.remoteAddress
    if message.target
      $.notifyOne message.target, $.merge(message.toJSON(), type: 'message')
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
    # wall
    else if $.has 'owner_id'
      r = Message.find owner: $.param 'owner_id'
    if r
      r.sort('-time')
      populate r
    else
      $.sendStatus code.BAD_REQUEST
      return

  DELETE: ($) ->
    Message.remove _id: $.id

  read: ($) ->
    if $.has('id')
      Message.update {_id: $.param('id')}, {$set: unread: 0}
    if $.has('target_id')
      conditions = {target: $.user._id, source: $.param('target_id')} #, unread: 1}
      $.notifyOne(conditions.source, {
        type: 'read',
        target_id: conditions.source
      });
      Message.update conditions, {$set: unread: 0}, { multi: true }
    else
      return false

  feed: ($) ->
    friends = $.user.friend.map (f) -> ObjectID f
#    console.log friends
    Message.find owner: $in: friends

  dialogs: ($) ->
    me = $.user._id
    source_messages = null
    target_messages = null

    Message.aggregate [
      {
        $sort:
          time: -1
      }
      {
        $match:
          source: me
          target: $ne: null
      }
      {
        $group:
          _id: '$target'
          message_id:
            $first: '$_id'
          unread:
            $sum: '$unread'
          count:
            $sum: 1
      }
    ]
#    .skip($.skip)
#    .limit($.limit / 2)
    .exec $.wrap (_source_messages) ->
      source_messages = _source_messages
      Message.aggregate [
        {
          $sort:
            time: -1
        },
        {
          $match:
            target: me
        },
        {
          $group:
            _id: '$source'
            message_id:
              $first: '$_id'
            unread:
              $sum: '$unread'
            count:
              $sum: 1
        }
      ]
#      .skip($.skip)
#      .limit($.limit / 2)
      .exec $.wrap (_target_messages) ->
        target_messages = _target_messages
        dialogs_array = source_messages.concat target_messages
#        dialogs = _.uniq dialogs, false, (dialog, i, dialogs) ->
#          _.findLastIndex(dialogs, (dialog) -> dialog.target) == i
        dialogs = {}
        conditions =
          _id:
            $in: []
        for dialog in dialogs_array
          dialogs[dialog.message_id] = dialog
          conditions._id.$in.push ObjectID(dialog.message_id)
        fields =
          source: 1
          target: 1
          text: 1
          time: 1
        Message.find(conditions, fields)
        .populate('source target', '_id domain')
        .exec $.wrap (results) ->
          messages = []
          for message in results
            message = message.toJSON()
            dialog = dialogs[message._id]
            message.unread = dialog.unread || 0
            message.dialog_id = dialog._id
            message.count = dialog.count
            messages.push message
          $.send messages
        return
      return
    return
