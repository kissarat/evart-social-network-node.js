@App.module 'User', (User, App) ->
  class User.Controller extends Marionette.Controller
    login: ->
      App.mainRegion.show new App.User.LoginForm model: new App.User.Login()

  class User.Router extends Marionette.AppRouter
    appRoutes:
      'login': 'login'

  class User.Login extends Backbone.Model
    url: '/api/user/login'

    validation:
      login:
        required: true
        pattern: /^[\w\-_]|\w{9,16}|[0-9a-f]{24}$/i
      password:
        required: true
#        pattern: /(?=.*[a-z])(?=.*\d)\w{8,}/i

  class User.LoginForm extends Marionette.ItemView
    template: '#form-login'
    tagName: 'form'

    initialize: () ->
      Backbone.Validation.bind(this)

    events:
      'click [type=submit]': 'submit'

    submit: (e) ->
      e.preventDefault()
      return @login()

    login: () ->
      @model.set @el.serialize()
      if @model.isValid(true)
        @model.save()

    new User.Router
      controller: new User.Controller
