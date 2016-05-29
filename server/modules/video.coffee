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
    if $.has 'url'
      load($)
    else if $.has 'id'
      Video.findOne $.id
    else
      s = {}
      if $.has('owner_id')
        s.owner_id = $.get('owner_id')
      else if q = $.search
        s.title = $regex: q
      Video.find s

  POST: ($) ->
    load($).then (video) ->
      video = new Video video
      video.url = $.param 'url'
      video.owner = $.user._id
      video.save()
