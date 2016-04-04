faker = require 'faker'

module.exports =
  _init: () ->
    @request
      url: 'test/random'
      qs:
        entity: 'Agent'
        number: 1
        query: new Buffer(JSON.stringify user: $exists: true).toString('base64')

  test:
    random: ($) ->
      '1'
