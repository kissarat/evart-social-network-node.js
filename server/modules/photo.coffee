fs = require 'fs'
god = require 'mongoose'
code = require __dirname + '/../../client/code.json'
dir = __dirname + '/../../static/photo'


global.schema.Photo = new god.Schema
  time:
    type: Date,
    required: true
    default: Date.now

  user:
    type: god.Schema.Types.ObjectId
    ref: 'User'

module.exports =
  POST: ($) ->
    tmpfile = '/tmp/' + process.hrtime().join('') + '.jpg'
    stream = fs.createWriteStream tmpfile,
      flags: 'w'
      mode: 0o400
      autoClose: true
    $.req.pipe stream
    $.req.on 'end', ()->
      photo = new Photo()
      photo.user = $.user._id
      photo.save null, $.wrap (result) ->
        console.log result
        if result.n > 0
          file = dir + '/' + photo._id + '.jpg'
          fs.rename tmpfile, file, () ->
            $.send code.CREATED, photo.toObject()
