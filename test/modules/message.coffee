faker = require 'faker'

module.exports =
  _anybody: ($) ->
    $.GET 'user'

  user: ($) ->
    ids = $.response.body.forEach((user) -> user._id).shuffle()
    for id of ids
      data =
        target: id
        text: faker.lorem.sentences()
      $.POST '/api/message', data

  message: ($) ->
    console.log $.response.toString().yellow
