request = require 'request'
god = require 'mongoose'

global.schema.Video = new god.Schema
  time:
    type: Date,
    required: true
    default: Date.now

  owner:
    type: god.Schema.Types.ObjectId
    ref: 'User'

  url: String,
  author_url: String,
  provider_name: String,
  version: Number,
  provider_url: String,
  author_name: String,
  thumbnail_url: String,
  width: Number,
  height: Number,
  title: String,
  thumbnail_width: Number,
  thumbnail_height: Number,
  html: String

services =
  youtube: (url) ->
    'https://www.youtube.com/oembed?format=json&url=' + url
  vimeo: (url) ->
    'https://vimeo.com/api/oembed.json?url=' + url

load = ($) ->
  a = $.param 'url'
  oembed_url = null
  for k, f of services
    if a.indexOf(k) >= 0
      oembed_url = f a
      break
  new Promise (resolve, reject) ->
    if oembed_url
      request oembed_url, (err, r, b) ->
        if err
          reject err
        else
          resolve JSON.parse b
    else
      reject 'Unknown service'

module.exports =
  GET: ($) ->
    if $.has 'owner_id'
      Video.find owner: $.param 'owner_id'
    else if $.has 'url'
      load($)
    else if $.has 'id'
      Video.findOne $.id
    else
      $.sendStatus code.BAD_REQUEST
      return

  POST: ($) ->
    load($).then (video) ->
      video = new Video video
      video.url = $.param 'url'
      video.owner = $.user._id
      video.save()
#      video.save $.wrap (result) ->
#        if result.nModified > 0
#          $.send code.CREATED, video.toObject()
#        else
#          $.send code.INTERNAL_SERVER_ERROR, result
#    .catch (err) ->
#      $.send code.INTERNAL_SERVER_ERROR, err
#    return
