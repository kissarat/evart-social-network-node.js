faker = require 'faker'

module.exports =
  _init: () ->
    @POST 'user',
      domain: faker.internet.domainWord()
      phone: '0000000' + faker.random.number()
      password: '1'

  user:
    _: ($) ->
      if 200 == $.response.statusCode
        @POST 'user/verify',
          user_id: $.post('_id')
          code: '11111'

    verify: ($) ->
      console.log $.response.statusCode
