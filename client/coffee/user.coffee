@App.module 'User', (User, App) ->
  class User.Router extends Marionette.AppRouter
    routes:
      'login': 'login'
      'logout': 'logout'
      'signup/:step': 'signup'
      'profile': 'view'
      'view/:id': 'view'
      'edit/:id': 'edit'
      'group/create': 'create'

    login: () ->
      App.mainRegion.show new User.LoginForm model: new User.Login()
      $(document.body).addClass('login')

    logout: () ->
      App.logout()

    signup: (step) ->
      signup = new User.SignupForm model: new User.Signup()
      App.mainRegion.show signup
      signup.loginRegion.show new User.LoginForm model: new User.Login()

    view: (domain) ->
      if not domain
        domain = App.user.domain
      $.get '/api/user?domain=' + domain, (user) ->
        user = new App.User.Model user
        profile = new App.User.View model: user
        profile.$el.addClass('scroll')
        profile.$el.addClass(user.get('type'))
        App.mainRegion.show profile
        profile.messagesRegion.show App.Message.ListView.wall(user.get('_id'))
      return

    edit: (id) ->
      model = new User.Model _id: id
      model.fetch()
      App.mainRegion.show new User.EditForm model: model

    create: () ->
      model = new User.Model type: App.route[0]
      form = new User.EditForm model: model
      App.mainRegion.show form

  # Models

  class User.Login extends Backbone.Model
    url: '/api/user/login'

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

  class User.Model extends Backbone.Model
    urlRoot: '/api/user'

    validation:
      domain:
        pattern: /^[\w\._\-]{4,23}$/
        required: true
      phone:
        pattern: /^\w{9,16}$/

    toString: () ->
      @getName()

    getName: () ->
      name = []
      if @get('name')
        @get('name')
      else
        if @get('forename')
          name.push @get('forename')
        if @get('surname')
          name.push @get('surname')
      if name.length > 0
        name.join(' ')
      else
        @get('domain')

  class User.List extends App.PageableCollection

    model: (attributes, options) ->
      new User.Model(attributes, options)

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
      phone = @model.get('phone');
      if phone
        @model.set('phone', phone.replace(/[^\d]/g, ''))
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
        $.sendJSON 'POST', '/api/user/personal', data, (xhr) =>
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

  class User.EditForm extends Marionette.ItemView
    template: '#form-edit'
    tagName: 'form'

    attributes:
      class: 'scroll'

    behaviors:
      Bindings: {}

    bindings:
      '[name=type]': 'type'
      '[name=name]': 'name'
      '[name=phone]': 'phone'
      '[name=domain]': 'domain'
      '[name=email]': 'email'
      '[name=about]': 'about'

    ui:
      title: 'h1 .title'
      domain: '[name=domain]'
      button: 'button'
      avatar: '.field-avatar'
      origin: '.origin'

    events:
#      'change [name=avatar]': 'loadAvatar'
      'submit': 'submit'

    submit: (e) ->
      e.preventDefault()
      $.sendJSON 'POST', '/api/user', @$el.serialize(), (xhr) ->
        data = xhr.responseJSON
        if data.success
          App.navigate '/view/' + data.domain
        else
          alert T('Something wrong happend')

    onRender: () ->
      if @model.id
        document.title = @model.getName() + ' - ' + T('Settings')
      else
        document.title = T('Create Group')
        @ui.title.html document.title
        @ui.button.html T('Create')
        @ui.avatar.hide()
        @$('.create-only').removeClass('create-only')
        @ui.domain.change () =>
          $.getJSON '/api/user/exists?domain=' + @ui.domain.val(), (data) =>
            if data.success
              @ui.domain.val(data.value)
              if data.exists
                @$el.report 'domain', T('Address already in use'), 'error'
              else
                @$el.report 'domain', '', false
        @ui.origin.html(location.origin)

  class User.View extends Marionette.LayoutView
    template: '#layout-user'

    regions:
      messagesRegion: '.messages'

    behaviors:
      Bindings: {}

    ui:
      background: '.background'
      header: 'header'
      avatar: '.big-avatar'
      edit: '.edit'
      status: '.status'

    events:
      'dragenter .big-avatar': preventDefault
      'dragover .big-avatar': preventDefault
      'drop .big-avatar': 'dropAvatar'
      'click .edit': () -> App.navigate '/edit/' + @model.get('_id')
      'change .status': 'changeStatus'
      'keyup .status': 'keyupStatus'
      'click .logout': () -> App.logout()

    bindings:
      '.name': 'name'
      '.status': 'status'

    changeStatus: () ->
      $.sendJSON 'POST', '/api/user/status?id=' + @model.get('_id'), status: @model.get('status'), () =>
        @ui.status.blur()

    keyupStatus: (e) ->
      if KeyCode.ENTER == e.keyCode
        @changeStatus()

    dropAvatar: (e) ->
      e.preventDefault()
      file = e.originalEvent.dataTransfer.files[0]
      xhr = new XMLHttpRequest()
      xhr.open 'POST', '/api/photo'
      xhr.onload = () =>
        if xhr.status < 300
          response = JSON.parse xhr.responseText
          $.post '/api/user/change?field=avatar&value=' + response._id, () =>
            @ui.avatar[0].setBackground response._id
      xhr.send file

    onRender: () ->
      document.title = @model.getName()
      back = @ui.background[0]
      back.setBackground @model.get 'background'
      @ui.header.find('.photo').each (i, p) ->
        r = (Math.round(Math.random() * 35))
        r = ('000000000000000000000000' + r).slice(-24)
        p.setAttribute('draggable', 'true')
        p.style.backgroundImage = 'url("/photo/' + r + '.jpg")'
        App.draggable p
        p.addEventListener 'dragleave', (e) ->
          $.sendJSON 'POST', '/api/user/change?field=background&value=' + r, {}, () ->
            back.setBackground r
      @setAvatar()

    setAvatar: () ->
      @ui.avatar.css 'background-image', 'url("' + (App.avatarUrl @model.id) + '")'

    success: (data) ->
      if data.verified
        App.navigate 'login'
      else
        @report 'code', 'Invalid code'

  class User.Thumbnail extends Marionette.ItemView
    template: '#thumbnail-user'
    ui:
      avatar: '.avatar'
      name: '.name'
      country: '.country'
      city: '.city'

    events:
      'click': 'open'

    behaviors:
      Bindings: {}

    message: () ->
      App.navigate 'dialog/' + @model.get('_id')

    onRender: () ->
      @ui.name.text @model.getName()
      @ui.avatar[0].setBackground('/api/user/avatar?id=' + @model.get('_id'))
      @ui.country.text @model.get('country')
      @ui.city.text @model.get('city')

    open: () ->
      App.navigate '/view/' + @model.get('domain')

  class User.ListView extends Marionette.CollectionView
    childView: User.Thumbnail

    new User.Router
      controller: {}
