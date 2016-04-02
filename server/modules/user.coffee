rs = require 'randomstring'
god = require 'mongoose'
code = require __dirname + '/../../client/code.json'

global.schema.User = new god.Schema
  phone:
    type: String
    required: true
    unique: true
    trim: true
    match: /^\d{9,15}$/
    unique: true
#    index:
#      unique: true
  password:
    type: String
    required: true
  domain:
    type: String
    required: true
    match: /^[\w\._]{4,23}$/
    lowercase: true
    trim: true
    unique: true
#    index:
#      unique: true
  code:
    type: String
    match: /^\d{6}$/
    trim: true
    default: ->
      rs.generate
        length: 6
        charset: 'numeric'
  created:
    type: Date
    default: Date.now
  verified:
    type: Boolean
    get: ->
      !@code

module.exports =
  login: ($) ->
    if $.user
      $.sendStatus code.FORBIDDEN, 'User is authorized'
    else
      conditions =
        phone: $.post 'login'
        password: $.post 'password'
      User.findOne conditions, $.wrap (user) ->
        if user
          auth =
            user_id: user._id
            time: Date.now()
          Agent.update auth: $.auth, $set: auth, $.wrap () ->
            $.send user.toObject()
        else
          $.sendStatus code.FORBIDDEN
    return

  POST: ($) ->
    if $.user
      $.sendStatus code.FORBIDDEN, 'User is authorized'
    else
      user = new User $.body
      user.save $.wrap () ->
        $.send code.CREATED, _id: user._id
    return

  verify:
    POST: ($) ->
      conditions =
        _id: $.post('user_id'),
        code: $.post('code')
      changes = $unset:
        code: ''
      User.update conditions, changes, $.wrap (result) ->
        $.send verified: !!result.ok

    _: ($) ->
      User.findById $.param('user_id'), $.wrap (user) ->
        $.send code: user.code
