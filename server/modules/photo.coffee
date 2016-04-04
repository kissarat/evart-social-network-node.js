fs = require 'fs'
god = require 'mongoose'
easyimage = require 'easyimage'
code = require __dirname + '/../../client/code.json'
md5file = require 'md5-file'
dir = __dirname + '/../../static/photo'
thumb = __dirname + '/../../static/photo-thumb'


global.schema.Photo = new god.Schema
  time:
    type: Date,
    required: true
    default: Date.now

  user:
    type: god.Schema.Types.ObjectId
    ref: 'User'

  md5:
    type: String

module.exports =
  POST: ($) ->
    tmpfile = '/tmp/' + process.hrtime().join('') + '.jpg'
    stream = fs.createWriteStream tmpfile
    #      flags: 'w'
    #      mode: 0o600
    #      autoClose: true

    internal_error = (error) ->
      $.send code.INTERNAL_SERVER_ERROR,
        error: error

    create = (checksum) ->
      photo = new Photo()
      photo.user = $.user._id
      photo.md5 = checksum

      photo.save $.wrap (result) ->
        if result
          file = dir + '/' + photo._id + '.jpg'
          easyimage.info tmpfile
          .then (info) ->
            easyimage.resize
              src: tmpfile
              dst: file
              width: Math.min info.width, $.config.photo.width
              quality: $.config.photo.quality
            .then () ->
              $.send code.CREATED, photo.toObject()
            , internal_error
          , internal_error
        else
          $.send code.INTERNAL_SERVER_ERROR,
            result: result
            error:
              message: 'Cannot save photo'

    $.req.on 'end', () -> md5file tmpfile, $.wrap create
    stream.on 'error', internal_error
    $.req.pipe stream