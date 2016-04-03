faker = require 'faker'

module.exports = () ->
  @start 'http://localhost/signup', () ->
    @on 'remote.callback', () ->
      path = @get_path()
      switch path
        when 'signup' then @form_submit
            domain: faker.internet.domainWord()
            phone: '0000000' + faker.random.number()
            password: '1'
        else @echo path + ' not found'
      return
