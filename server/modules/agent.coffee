rs = require 'randomstring'
god = require 'mongoose'
utils = require '../utils'
code = require __dirname + '/../../client/code.json'


global.schema.Agent = new god.Schema
  _id: utils.idType('Agent')

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
      if not agent
        agent = new Agent about: $.body
        if $.req.auth
          agent.auth = $.req.auth
      agent.time = Date.now()
      agent.save $.wrap () ->
        if (Math.random() > (1 - config.auth_generation)) and not $.req.auth
          $.setCookie 'auth', agent.auth, config.FOREVER
        if agent.user
          $.send agent.user.toObject()
        else
          $.res.end()

    if $.req.auth
      Agent.findOne(auth: $.req.auth).populate('user').exec $.wrap update
    else
      update()
    return
