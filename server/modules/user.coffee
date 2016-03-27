rs = require 'randomstring'
god = require 'mongoose'
code = require __dirname + '/../../client/code.json'

global.schema.User = new god.Schema
  phone:
    type: String
    match: /^\d{9,15}$/
  password:
    type: String
  name:
    type: String


module.exports =
  login: ($) ->
    if $.user
      $.sendStatus code.FORBIDDEN, 'User is authorized'
    else
      conditions =
        phone: $.post('login')
        password: $.post('password')
      User.find conditions, $.wrap (user) ->
        if user
          auth =
            user_id: user._id
            time: Date.now()
          Agent.update auth: $.auth, $set: auth, $.wrap () ->
            $.send User.toObject()
        else
          $.sendStatus code.FORBIDDEN

  PUT: ($) ->
    if $.user
      $.sendStatus code.FORBIDDEN, 'User is authorized'
    else
      user = new User $.body
      user.save $.wrap () ->
        $.sendStatus code.CREATED
