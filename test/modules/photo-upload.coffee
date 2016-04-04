faker = require 'faker'

module.exports =
  _anybody: ($) ->
    console.log $.user.domain

  test:
    random: ($) ->
      '1'
