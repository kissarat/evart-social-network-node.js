rs = require 'randomstring'
god = require 'mongoose'
ObjectID = require('mongodb').ObjectID
crypto = require 'crypto'
utils = require '../utils'


global.schema.User = new god.Schema
  _id: utils.idType('User')

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

  hash:
    type: String
    required: true

  domain:
    type: String
    required: true
    match: /^[\w\._]{4,23}$/
    lowercase: true
    trim: true
    index:
      unique: true

  status:
    type: String

  type:
    type: String
    enum: ['user', 'group', 'admin']
    index:
      unique: false

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

  follow: [
    type: god.Schema.Types.ObjectId
    ref: 'User'
  ]

  deny: [
    type: god.Schema.Types.ObjectId
    ref: 'User'
  ]

module.exports =
  login: ($) ->
    if $.user
      $.sendStatus code.FORBIDDEN, 'User is authorized'
    else
      conditions = hash: utils.hash $.post('password')
      login = $.post('login').replace /[\(\)\s]/, ''
      if '@' in login
        conditions.email = login
      else if /^[\d\-]+$/.exec login
        login = login.replace '-', ''
      else if /^[0-9a-z]{24}$/i.exec login
        conditions._id = ObjectID(login)
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

  info: ($) ->
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

  status: ($) ->
    status = $.param 'status'
    status = status.trim().replace /\s+/g, ' '
    User.update {_id: $.id}, {$set: status: status}

  POST: ($) ->
    if $.user
      $.sendStatus code.FORBIDDEN, 'User is authorized'
    else
      data = $.just $.body, ['domain', 'phone', 'password']
      data.hash = $.param 'password'
      user = new User data
      user.save $.wrap () ->
        $.send code.CREATED, _id: user._id
    return

  PATCH: ($) ->
    data = $.allowFields(user_fields, admin_fields)
    User.findByIdAndUpdate $.id, {$set: data}, {new: true}

  GET: ($) ->
    params = ['id', 'domain']
    fields = 'domain status type city country address phone avatar name birthday languages relationship'
    if $.hasAny(params) and not $.has 'list'
      return User.findOne($.paramsObject params)
      .select(fields)
    else if $.has 'ids'
      return User.find(_id: $in: $.ids('ids'))
      .select(fields)
    else
      if $.has('domain') and $.has('list')
        list_name = $.param 'list'
        if list_name not in ['follow', 'deny']
          $.invalid 'list', 'is not follow or deny'
        User.findOne(domain: $.param 'domain').select(list_name).then (user) ->
          return search($, user[list_name])
      else
        return search($)
      return

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
      User.findOne $.id, $.wrap (user) ->
        if user
          $.sendStatus code.MOVED_TEMPORARILY, 'Avatar found',
            location: if user.avatar then "/photo/#{user.avatar}.jpg" else "/images/avatar.png"
        else
          $.sendStatus code.NOT_FOUND, 'User not found'
      return

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
  follow: 'deny'
  deny: 'follow'

user_fields = ["city", "country", "address", "phone",
  "password", "avatar", "name", "birthday", "languages", "relationship"];

admin_fields = ['domain', 'type'];

search = ($, ids) ->
#  new Promise (resolve, reject) ->
  ORs = []
  if $.has 'search'
    search = $.param 'search'
    search = search.replace /\s+/g, '.*'
    for name in ['domain', 'surname']
      d = {}
      d[name] = $regex: search
      ORs.push d
  ands = {}
  if ORs.length > 0
    ands.$or = ORs
  for param in ['country', 'city', 'sex', 'forename', 'relationship', 'type']
    if $.has param
      ands[param] = $.param param
  fields = '_id type forename surname domain name type city address avatar sex'
  if ids
    ands._id = $in: ids.map (id) -> ObjectID(id)
  r = User.find ands
  r.select fields
  r.exec $.wrap (users) ->
    $.send users
