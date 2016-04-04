random = (model, query, number, cb) ->
  model.count query, (err, c) ->
    q = model.find query
    if !number
      number = c
    if number < c
      q.skip Math.round Math.random() * (c - number)
      q.limit number
    q.exec(cb)

module.exports =
  code: ($) ->
    User.findById $.param('user_id'), $.wrap (user) ->
      $.send code: user.code

  random: ($) ->
    model = global[$.get('entity')]
    query = if $.has 'query' then JSON.parse atob $.get 'query' else {}
    random model, query, $.req.url.query.number, $.wrap (result) ->
      $.send result
