rs = require 'randomstring'
god = require 'mongoose'

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


module.exports =
  POST: ($) ->
    agent = new Agent about: $.body
    ($.model 'Agent').findOneAndUpdate auth: $.auth, agent, upsert: true, $.wrap ->
      $.setCookie 'auth', @auth, $.config.forever
      $.send agent.toObject()
