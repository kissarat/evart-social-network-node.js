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

  avatar:
    type: god.Schema.Types.ObjectId
    ref: 'Photo'

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

  relationship:
    type: Number

  languages:
    type: String

  about:
    type: String

  verified:
    type: Boolean
    get: ->
      !@code

  friend: [
    type: god.Schema.Types.ObjectId
    ref: 'User'
  ]

  block: [
    type: god.Schema.Types.ObjectId
    ref: 'User'
  ]


module.exports =
  login: ($) ->
    if $.user
      $.sendStatus code.FORBIDDEN, 'User is authorized'
    else
      conditions =
        password: $.post 'password'
      login = $.post('login').replace /[\(\)\s]/, ''
      if '@' in login
        conditions.email = login
      else if /^[\d\-]+$/.exec login
        login = login.replace '-', ''
        conditions.phone = login
      else
        conditions.domain = login
      User.findOne conditions, $.wrap (user) ->
        if user
          conditions = auth: $.req.auth
          changeset =
            $set:
              user: user._id
              time: Date.now()
          Agent.update conditions, changeset, $.wrap (result) ->
            if result.nModified > 0
              $.send
                _id: user._id
                domain: user.domain
                verified: user.verified
            else
              $.send code.INTERNAL_SERVER_ERROR, error:
                message: 'Unregistered agent'
        else
          $.sendStatus code.UNAUTHORIZED
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
      data = $.just $.body, ['domain', 'phone', 'password']
      user = new User data
      user.save $.wrap () ->
        $.send code.CREATED, _id: user._id
    return

  PATCH: ($) ->
    data = $.just $.body, ["domain", "city", "country", "address", "phone",
      "password", "avatar", "name", "birthday", "languages", "relationship"]
    User.findOneAndUpdate {_id: $.id}, {$set: data}, {new: true}

  GET: ($) ->
    if $.has 'id'
      return User.findOne($.param 'id').select('domain city country address phone'
      + ' avatar name birthday languages relationship')
    else if $.has 'ids'
      ids = $.param('ids').split('.').map (id) -> ObjectID(id)
      r = User.find(_id: $in: ids)
    else
      conditions = []
      if $.has 'search'
        search = $.param 'search'
        search = search.replace /\s+/g, '.*'
        conditions.push domain: $regex: search
      ands = []
      for param in ['country', 'city', 'sex', 'relationship']
        if $.has param
          condition = {}
          condition[param] = $.param param
          ands.push condition
      if ands.length > 0
        conditions.push $and: ands
      if conditions.length > 0
        r = User.find($or: conditions)
      else
        r = User.find()
      console.log conditions
    r.select '_id domain name'

  verify:
    POST: ($) ->
      conditions =
        _id: $.post('user_id'),
        code: $.post('code')
      changes = $set: code: null
      User.update conditions, changes, $.wrap (result) ->
        $.send verified: result.n > 0

  avatar:
    GET: ($) ->
      User.findOne $.param('id'), $.wrap (user) ->
        if user
          $.sendStatus code.MOVED_TEMPORARILY, 'Avatar found',
            location: if user.avatar then "/photo/#{user.avatar}.jpg" else "/images/avatar.jpg"
        else
          $.sendStatus code.NOT_FOUND, 'User not found'

    POST: ($) ->
      User.findOneAndUpdate({_id: $.user._id}, {avatar: $.param('photo_id')}).select('_id avatar').exec $.wrap (user) ->
        if user
          $.send
            user_id: user._id
            photo_id: user.avatar
        else
          $.sendStatus code.NOT_FOUND

  list:
    GET: ($) ->
      name = $.param 'name'
      if not list_fields[name]
        $.invalid 'name'
      fields = {domain: 1}
      fields[name] = 1
      User.findOne($.id, fields)
      .populate(name, '_id domain')

    POST: ($) ->
      name = $.param 'name'
      target_id = $.param 'target_id'
      opposite = list_fields[name]
      if not opposite
        $.invalid 'name'
      User.find(target_id).then (target) ->
        if target
          User.findOne($.id).then (user) ->
            result = {}
            result[name] = toggle user[name], target_id
            if not result[name]
              result[opposite] = toggle user[opposite], target_id
            user.save().then () ->
              $.send result
        else
          $.invalid 'target_id'

toggle = (array, element) ->
  i = array.indexOf(element)
  result = i < 0
  if result
    array.push element
  else
    array.splice i, 1
  result

list_fields =
  friend: 'block'
  block: 'friend'

