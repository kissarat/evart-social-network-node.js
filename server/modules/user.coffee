rs = require 'randomstring'
god = require 'mongoose'
code = require __dirname + '/../../client/code.json'
ObjectID = require('mongodb').ObjectID


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

  skype:
    type: String

  email:
    type: String

  country:
    type: String

  city:
    type: String

  address:
    type: String

  name:
    type: String

  birthday:
    type: Date

  languages:
    type: String

  about:
    type: String

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
          conditions = auth: $.req.auth
          changeset =
            $set:
              user: user._id
              time: Date.now()
          Agent.update conditions, changeset, $.wrap (result) ->
            if result.n > 0
              $.send
                _id: user._id
                domain: user.domain
                verified: user.verified
            else
              $.send code.INTERNAL_SERVER_ERROR, error:
                message: 'Invalid result'
                result: result
                query: conditions
        else
          $.sendStatus code.FORBIDDEN
    return

  logout: ($) ->
    conditions =
      user:
        $exists: true
      auth: $.req.auth
    change =
      $unset:
        user: ''
    Agent.update conditions, change

  status: ($) ->
    conditions = auth: $.req.auth
    Agent.findOne(conditions).populate('user').exec $.wrap (agent) ->
      result = found: false
      if agent
        result.agent_id = agent._id
        if agent.user
          result.user_id = agent.user._id
          result.domain = agent.user.domain
          result.phone = agent.user.phone
          result.found = true
      $.send result
    return

  POST: ($) ->
    if $.user
      $.sendStatus code.FORBIDDEN, 'User is authorized'
    else
#      console.log $.body
      user = new User $.body
      user.save $.wrap () ->
        $.send code.CREATED, _id: user._id
    return

  GET: ($) ->
    if $.has 'ids'
      ids = $.param('ids').split('.').map (id) -> ObjectID(id)
      User.find id: $in: ids
    if $.has 'id'
      User.findOne $.param 'id'
    else
      User.find()

  verify:
    POST: ($) ->
      conditions =
        _id: $.post('user_id'),
        code: $.post('code')
      changes = $set: code: null
      User.update conditions, changes, $.wrap (result) ->
        $.send verified: result.n > 0
