@App.module 'User', (User, App) ->
  class User.Controller extends Marionette.Controller
    login: ->
      App.mainRegion.show new User.LoginForm model: new User.Login()
      $(document.body).addClass('login')

    logout: () ->
      App.logout()

    signup: (step) ->
      signup = new User.SignupForm model: new User.Signup()
      App.mainRegion.show signup
      signup.loginRegion.show new User.LoginForm model: new User.Login()

  class User.Router extends Marionette.AppRouter
    appRoutes:
      'login': 'login'
      'logout': 'logout'
      'signup/:step': 'signup'

  # Models
  class User.Login extends Backbone.Model
    url: '/api/user/login'

    behaviors:
      Bindings: {}

    validation:
      login:
        required: true
        pattern: /^[\w\-_]|\d{9,16}|[0-9a-f]{24}$/i
      password:
        required: true
#        pattern: /(?=.*[a-z])(?=.*\d)\w{8,}/i

  class User.Signup extends Backbone.Model

    behaviors:
      Bindings: {}

    validation:
      phone:
        required: true
        pattern: /^\w{9,16}$/
      code:
        required: true
        pattern: /^\d{6}$/
      domain:
        required: true
      email:
        required: true
      password:
        required: true
      passwordRepeat:
        equalTo: 'password'
      forename:
        required: true
      surname:
        required: true

  # Forms

  class User.LoginForm extends Marionette.LayoutView
    template: '#form-login'
    tagName: 'form'

    initialize: () ->
      Backbone.Validation.bind(this)

    behaviors:
      Bindings: {}

    bindings:
      '[name=login]': 'login'
      '[name=password]': 'password'

    events:
      'click [type=submit]': 'submit'

    submit: (e) ->
      e.preventDefault()
      return @login()

    login: () ->
      @model.set @el.serialize()
      if @model.isValid(true)
        @model.save null, success: (model, data) ->
          App.login()

  class User.SignupForm extends Marionette.LayoutView
    template: '#layout-signup'

    initialize: () ->
      Backbone.Validation.bind(this)

    regions:
      loginRegion: '.login-region'

    behaviors:
      Bindings: {}

    ui:
      form: '.form-signup'

    bindings:
      '.form-signup [name=phone]': 'phone'
      '.form-signup [name=code]': 'code'
      '.form-signup [name=domain]': 'domain'
      '.form-signup [name=email]': 'email'
      '.form-signup [name=password]': 'password'
      '.form-signup [name=repeat]': 'repeat'
      '.form-signup [name=forename]': 'forename'
      '.form-signup [name=surname]': 'surname'

    events:
      'click fieldset.phone button': 'phone'
      'click fieldset.code button': 'code'
      'click fieldset.personal button': 'personal'
      'invalid': 'invalid'

    phone: () ->
      @model.set('phone', @model.get('phone').replace(/[^\d]/g, ''))
      if @model.isValid('phone')
        if not _.find(codes, (code) => @model.get('phone').indexOf(code) == 0)
          @$el.report('phone', T('Phone number must starts with country code'), 'error')
        else
          $.sendJSON 'POST', '/api/user/phone', {phone: @model.get('phone')}, (xhr) =>
            response = xhr.responseJSON
            if response.success
              App.navigate('/signup/code')
            else if response.error
              message = if twilio.INVALID_NUMBER = response.error.code then 'Invalid phone number' else response.error.message
              @$el.report('phone', T(message), 'error')

    code: () ->
      if @model.isValid('code')
        $.sendJSON 'POST', '/api/user/code', {code: @model.get('code')}, (xhr) ->
          if xhr.responseJSON.success
            App.navigate('/signup/personal')

    personal: () ->
      @model.set @el.serialize()
      fields = ['password', 'domain', 'email', 'forename', 'surname']
      if @model.isValid(fields)
        data = {}
        for i in fields
          data[i] = @model.get(i)
        $.sendJSON 'POST', '/api/user/personal',  data, (xhr) =>
          result = xhr.responseJSON
          if result.success
            App.navigate '/login'
          else if code.BAD_REQUEST == xhr.status and result.invalid
            for name, info of result.invalid
              @$el.report(name, info.message, 'error')


    onRender: () ->
      step = location.pathname.split('/')
      step = _.last(step)
      @$el.attr('data-step', step)

    new User.Router
      controller: new User.Controller
