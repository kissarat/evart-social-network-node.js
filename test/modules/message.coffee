faker = require 'faker'

module.exports =
  _anybody: () ->
    @GET 'user'

  user: ($) ->
    receivers = $.response.body
    for receiver in receivers
      data =
        target: receiver._id
        text: faker.lorem.sentences()
      @POST 'message', data
    return

  message: ($) ->
#    console.log $.response.toString().yellow
    process.exit()
