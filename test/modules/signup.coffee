faker = require 'faker'

module.exports =
  _init: () ->
    @POST 'user',
      domain: faker.internet.domainWord()
      phone: '0000000' + faker.random.number()
      password: '1'

  user:
    _: ($) ->
      if 201 == $.response.statusCode
        @POST 'test/code',
          user_id: $.post('_id')

    verify: ($) ->
      console.log $.response.statusCode

  test:
    code: ($) ->
      @POST 'user/verify',
        user_id: $.params.user_id
        code: $.post('code')
