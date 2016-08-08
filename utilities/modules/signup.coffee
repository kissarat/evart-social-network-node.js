faker = require 'faker'

phone = null

module.exports =
  _init: () ->
    phone = '0000000' + faker.random.number()
    @POST 'user',
      domain: faker.internet.domainWord()
      phone: phone
      password: '1'

  user:
    _: ($) ->
      if 'POST' == $.method && 201 == $.response.statusCode
        @POST 'test/code',
          user_id: $.post('_id')
      else
        console.error 'user._ invalid route'

    verify: ($) ->
      if $.post('verified')
        @POST 'user/login',
          login: phone
          password: '1'
      else
        console.error 'User is not verified'

  test:
    code: ($) ->
      @POST 'user/verify',
        user_id: $.params.user_id
        code: $.post('code')
