module.exports =
  code: ($) ->
    User.findById $.param('user_id'), $.wrap (user) ->
      $.send code: user.code
