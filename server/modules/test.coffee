random = (model, query, populate, number, cb) ->
  model.count query, (err, c) ->
    q = model.find query
    if !number
      number = c
    if number < c
      q.skip Math.round Math.random() * (c - number)
      q.limit number
    populate.forEach (name) ->
      q.populate(name)
    q.exec(cb)

module.exports =
#  _before: ($) ->
#    console.log($.req.url.query)

  code: ($) ->
    User.findById $.param('user_id'), $.wrap (user) ->
      $.send code: user.code

  random: ($) ->
    model = global[$.get('entity')]
    if $.has 'query'
      query = $.get 'query'
      query = new Buffer query, 'base64'
      query = JSON.parse query.toString()
    if !query
      query = {}
    populate = if $.has 'populate' then $.get('populate').split '.' else []
    random model, query, populate, $.req.url.query.number, $.wrap (result) ->
      result.sort () -> 0.5 - Math.random()
      $.send result
    return

  socket: ($) ->
    subscribers = $.getSubscribers();
    keys = {}
    for user_id, subscriber of subscribers
      keys[user_id] = Object.keys subscriber
    $.send keys
    return
