rs = require 'randomstring'
god = require 'mongoose'
ObjectID = require('mongodb').ObjectID
utils = require '../utils'


global.schema.User = new god.Schema
  _id: utils.idType('User')

  phone:
    type: String
    trim: true
    match: /^\d{9,15}$/

  password:
    type: String

  hash:
    type: String
    match: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/

  domain:
    type: String
    required: true
    match: /^[\w\._\-]{4,23}$/
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

  avatar:
    type: god.Schema.Types.ObjectId
    ref: 'Photo'

  background:
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

  request: [
    type: god.Schema.Types.ObjectId
    ref: 'User'
  ]

  deny: [
    type: god.Schema.Types.ObjectId
    ref: 'User'
  ]

extract = (user) ->
  success: true
  _id: user._id
  domain: user.domain

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
          conditions =
            auth: $.req.auth
          changeset =
            $set:
              user: user._id
              time: Date.now()
          Agent.update conditions, changeset, $.wrap (result) ->
            if result.nModified > 0
              $.send extract result
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
    User.update {_id: $.id}, {
      $set:
        status: status
    }

  POST: ($) ->
    data = $.allowFields(group_fields, admin_fields)
    data.type = 'group'
    user = new User data
    user.save $.wrap () ->
      $.send code.CREATED,
        success: true
        _id: user._id
        domain: user.domain
        type: user.type
    return

  PATCH: ($) ->
    data = $.allowFields(user_fields, admin_fields)
    User.findByIdAndUpdate $.id, {$set: data}, {new: true}

  GET: ($) ->
    params = ['id', 'domain']
    fields = 'domain status type city country address phone avatar background name birthday languages relationship'
    if $.hasAny(params) and not $.has 'list'
      return User.findOne($.paramsObject params)
      .select(fields)
    else if $.has 'ids'
      return User.find(
        _id:
          $in: $.ids('ids')
      )
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

  exists:
    GET: ($) ->
      key = null
      value = null
      conditions = {}
      for key in ['domain', 'phone', 'email']
        if $.has(key)
          value = $.get(key)
          conditions[key] = value
          break
      if key and value
        User.find(conditions, conditions).count $.wrap (result) ->
          $.send
            success: true
            exists: result > 0
            key: key
            value: value
      else
        $.sendStatus code.BAD_REQUEST
      return

  phone: ($) ->
    if $.user
      return $.sendStatus(code.FORBIDDEN, 'User is authorized');
    $.agent.phone = $.param('phone')
    if config.sms.enabled
      $.agent.code = rs.generate
        length: 6
        charset: 'numeric'
    User.findOne {phone: $.agent.phone}, $.wrap (user) ->
      if user
        $.send error:
          message: 'The phone number already registered'
      else
        save = () ->
          $.agent.save($.success)
        if config.sms.enabled
          $.sendSMS $.agent.phone, 'Code: ' + $.agent.code, save
        else
          save()
    return

  code: ($) ->
    if $.user
      return $.sendStatus(code.FORBIDDEN, 'User is authorized');
    if $.param('code') == $.agent.code
      $.agent.code = null
      $.agent.save($.success)
    else
      success: false
    return

  personal: ($) ->
    if $.user
      return $.sendStatus(code.FORBIDDEN, 'User is authorized');
    user = new User
      phone: $.agent.phone
      domain: $.param('domain')
      email: $.param('email')
      forename: $.param('surname')
      surname: $.param('surname')
      hash: utils.hash($.param('password'))
    user.save($.success)
    return

  avatar:
    GET: ($) ->
      User.findOne $.id, $.wrap (user) ->
        if user
          $.sendStatus code.MOVED_TEMPORARILY, 'Avatar found',
            location: if user.avatar then "/photo/#{user.avatar}.jpg" else "/images/avatar.png"
        else
          $.sendStatus code.NOT_FOUND, 'User not found'
      return

  change:
    POST: ($) ->
      field = $.param 'field'
      changes = {}
      fields = ['avatar', 'background']
      if field in fields
        changes[field] = ObjectID($.param 'value')
      else
        $.invalid 'field', field
      User.findOneAndUpdate({_id: $.user._id}, changes).select(fields.join ' ')

  list:
    GET: ($) ->
      name = $.param 'name'
      if not list_fields.hasOwnProperty name
        $.invalid 'name'
      fields = {}
      fields[if 'friend' == name then 'follow' else name] = 1
      id = if $.has('id') then $.id else $.user._id
#      select = $.select(['_id', 'domain'], user_fields)
      User.findOne id, fields, $.wrap (user) ->
        if 'friend' == name
          search $, _id: $in: user.follow
        else
          search $, user[name]

    POST: ($) ->
      name = $.param 'name'
      if not list_fields.hasOwnProperty name
        $.invalid 'name'
      target_id = $.param 'target_id'
      id = if $.has('id') then $.id else $.user._id
      opposite = list_fields[name]


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
  friend: null
  request: null

user_fields = ["name", "surname", "forename", "city", "country", "address", "phone",
  "password", "avatar", "name", "birthday", "languages", "relationship"];
schema.User.user_public_fields = ["name", "surname", "forename", "city", "country",
  "address", "phone", "avatar", "name", "birthday", "languages", "relationship"];
group_fields = ["domain", "name", "about", "avatar"];
admin_fields = ['domain', 'type'];

search = ($, cnd, send = false) ->
  ORs = []
  if $.has 'q'
    q = $.search;
    for name in ['domain', 'surname']
      d = {}
      d[name] =
        $regex: q
      ORs.push d
  ands = if cnd and cnd.constructor == Array then cnd else {}
  if ORs.length > 0
    ands.$or = ORs
  for param in ['country', 'city', 'sex', 'forename', 'relationship', 'type']
    if $.has param
      ands[param] = $.param param
  fields = '_id type forename surname domain name type city address avatar sex'
  if cnd and cnd.constructor == Array
    ands._id =
      $in: cnd.map (id) -> ObjectID(id)
  if $.has('type')
    ands.type = $.get('type')
  r = User.find ands
  r.select fields
  if send
    r.exec $.wrap (users) ->
      $.send users
