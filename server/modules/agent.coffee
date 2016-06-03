rs = require 'randomstring'
god = require 'mongoose'
utils = require '../utils'
code = require '../../client/code.json'
client = require '../client.json'


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

  code:
    type: String
    match: /^\d{6}$/
    trim: true

  phone:
    type: String
    trim: true
    match: /^\d{9,15}$/

  user:
    type: god.Schema.Types.ObjectId
    ref: 'User'

extract = (agent) ->
  if agent.toObject
    agent = agent.toObject()
  result =
    _id: agent._id
    auth: agent.auth
  if agent.user
    result.user =
      _id: agent.user._id
      domain: agent.user.domain
      type: agent.user.type
  result

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
        agent = extract agent
        agent.config = client
        $.send agent

    if $.req.auth
      Agent.findOne(auth: $.req.auth).populate('user').exec $.wrap update
    else
      update()
    return

  GET: ($) ->
    $.send extract $.agent
