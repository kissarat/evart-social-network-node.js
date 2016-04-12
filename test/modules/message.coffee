faker = require 'faker'

module.exports =
  _anybody: () ->
    @GET 'user'

  user: ($) ->
    receivers = $.response.body
    for receiver of receivers
      data =
        target: receiver
        text: faker.lorem.sentences()
      console.log data
      @POST 'message', data
    return

  message: ($) ->
    console.log $.response.toString().yellow
