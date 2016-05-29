@App.module 'User', (User, App) ->
  class User.Controller extends Marionette.Controller
    login: ->
      if App.user
        App.navigate 'profile'
      else
        App.mainRegion.show new App.User.LoginForm model: new App.User.Login()

    signup: (step) ->
      App.mainRegion.show new App.User.SignupForm model: new App.User.Signup()

  class User.Router extends Marionette.AppRouter
    appRoutes:
      'login': 'login'
      'signup/:step': 'signup'

  # Models
  class User.Login extends Backbone.Model
    url: '/api/user/login'

    validation:
      login:
        required: true
        pattern: /^[\w\-_]|\w{9,16}|[0-9a-f]{24}$/i
      password:
        required: true
#        pattern: /(?=.*[a-z])(?=.*\d)\w{8,}/i

  class User.Signup extends Backbone.Model

  # Forms

  class User.LoginForm extends Marionette.ItemView
    template: '#form-login'
    tagName: 'form'

    initialize: () ->
      Backbone.Validation.bind(this)

    behaviors:
      Bindings: {}

    events:
      'click [type=submit]': 'submit'

    submit: (e) ->
      e.preventDefault()
      return @login()

    login: () ->
      @model.set @el.serialize()
      if @model.isValid(true)
        @model.save null, success: (model, data) ->
          if data.verified
            App.navigate '/code'
          else
          console.log arguments

  class User.SignupForm extends Marionette.ItemView
    template: '#form-signup'
    tagName: 'form'

    initialize: () ->
      Backbone.Validation.bind(this)

    behaviors:
      Bindings: {}

    events:
      'click [type=submit]': 'submit'

    submit: (e) ->
      e.preventDefault()
      return signup()

    signup: () ->
      @model.set @el.serialize()
      if @model.isValid(true)
        @model.save null, success: (model, data) ->
          if data.verified
            App.navigate '/code'
          else
          console.log arguments

    onRender: () ->
      step = location.pathname.split('/')
      step = _.last(step)
      @$el.attr('data-step', step)

    new User.Router
      controller: new User.Controller
