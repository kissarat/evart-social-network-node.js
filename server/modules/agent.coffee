rs = require 'randomstring'
god = require 'mongoose'
code = require __dirname + '/../../client/code.json'


global.schema.Agent = new god.Schema
  auth:
    type: String
    required: true
    match: /^\w{40}$/
    index:
      unique: true
    trim: true
    default: ->
      rs.generate 40
  start:
    type: Date,
    required: true
    default: Date.now
  time:
    type: Date,
    required: true
    default: Date.now
  about:
    os:
      name: String
      version: Number
      device: String
      vendor: String
    name: String
    version: Number

  user:
    type: god.Schema.Types.ObjectId
    ref: 'User'

module.exports =
  POST: ($) ->
    update = (agent) ->
      if !agent
        agent = new Agent about: $.body
      agent.time = Date.now()
      agent.save $.wrap () ->
        $.setCookie 'auth', agent.auth, $.config.FOREVER
        if agent.user
          $.send agent.user.toObject()
        else
          $.res.end()

    if $.req.cookies.auth
      Agent.findOne auth: $.cookie.auth, $.wrap update
    else
      update()
