@App.module 'Views', (Views) ->
  class App.Behaviors.Bindings extends Marionette.Behavior
    onRender: ->
      document.title = _.result(@view, 'title') || @view.constructor.name
      @view.$('a').click (e) ->
        e.preventDefault()
        App.navigate this.getAttribute 'href'
        return
      @view.$el.addClass @view.template.replace '#view-', 'view '
      el = @view.el
      if dictionary
        ['h1', 'legend', 'span', 'label', 'button', 'a'].forEach (name) ->
          _.each el.querySelectorAll(name), (elements) ->
            text = elements.childNodes.item 0
            if 1 == elements.childNodes.length && Node.TEXT_NODE == text.nodeType
              text.textContent = T text.textContent
#      @view.$el.find(':input').change (e) =>
#        @view.model.set e.target.getAttribute('name'), e.target.value
      @view.stickit()

    onShow: ->
      if window.callPhantom
        callPhantom JSON.stringify
          show: @view.template.replace '#view-', ''

  class Views.Error extends Marionette.ItemView
    template: '#view-error'

    behaviors:
      Bindings: {}

    ui:
      status: 'h1'
      text: 'p'

    bindings:
      'h1': 'status'
      '.text': 'text'

  class Views.Form extends Marionette.LayoutView
    tagName: 'form'

    attributes:
      method: 'post'

    report: (name, message) ->
      if !message
        message = name
        name = null
      if @el[name] || !name
        field = if name then @el[name].parentNode else @el
        $('<div></div>')
        .attr('class', 'error')
        .html(T message)
        .appendTo(field)
      else
        console.error name + ' field not found'

    events:
      submit: 'submit'

    submit: (e) ->
      if e
        e.preventDefault()
      @$el.find('.error').remove()
      @model.save null,
        patch: !@model.isNew()
        error: (_1, ajax) =>
          if code.BAD_REQUEST == ajax.status && ajax.responseJSON.invalid
            for name, error of ajax.responseJSON.invalid
              @report name, error.message
          else if @error
            @error ajax
        success: (model, data) =>
          if @success
            @success data, model

    behaviors:
      Bindings: {}

    bindings: ->
      b = {}
      @$el.find('[name]').each (i, input) ->
        name = input.getAttribute('name')

        if 'file' == input.type
          console.warn 'File input: ' + name
        else
          b["[name=#{name}]"] = name
      return b

  class Views.Login extends Views.Form
    template: '#view-login'
    error: (ajax) ->
      switch ajax.status
        when code.UNAUTHORIZED then @report 'Phone or password not found'
        when code.FORBIDDEN then App.navigate 'profile'
    success: (data) ->
      App.user = data
      App.navigate 'profile'

  class Views.Signup extends Views.Form
    template: '#view-signup'

    success: (data, model) ->
      App.navigate 'verify/' + model.id

  class Views.Verify extends Views.Form
    template: '#view-code'

  class Views.Profile extends Marionette.ItemView
    template: '#view-profile'

    behaviors:
      Bindings: {}

    ui:
      avatar: '.avatar'

    bindings:
      '.domain': 'domain'

    onRender: () ->
      @ui.avatar.attr 'src', App.avatarUrl @model.id
      for k, v of @model.attributes
        if '_' != k[0] and k not in ['domain', 'phone', 'password', 'avatar', 'created']
          if v
            label = T k[0].toUpperCase() + k.slice 1
            $("<div><strong>#{label}</strong> <div class='value'>#{v}</div></div>")
            .attr('data-name', k)
            .appendTo @$el

    success: (data) ->
      if data.verified
        App.navigate 'login'
      else
        @report 'code', 'Invalid code'

  class Views.Settings extends Views.Form
    template: '#view-settings'

    ui:
      avatar: '.avatar'

    events:
      'change [name=avatar]': 'loadAvatar',
      submit: 'submit'

    loadAvatar: (e) ->
      file = e.target.files[0]
      if file
        App.upload('/api/photo', file).then (photo) ->
          $.post '/api/user/avatar', {photo_id: photo._id}, (result) ->
            @ui.avatar.attr 'src', App.avatarUrl result.user_id

    success: () ->
      App.navigate 'profile'

    onRender: () ->
      if @model.get 'avatar'
        @ui.avatar.attr 'src', App.avatarUrl @model.id

  class Views.Message extends Marionette.ItemView
    template: '#view-message'

    behaviors:
      Bindings: {}

    ui:
      info: '.info'
      avatar: '.avatar'
      time: '.time'
      ip: '.ip'
      top: '.top'
      middle: '.middle'
      bottom: '.bottom'

    bindings:
      '.text': 'text'
      '.ip': 'ip'

    onRender: () ->
      @$el.attr('id', @model.get '_id')
      source_id = App.id @model.get 'source'
      @ui.info.attr('data-id', source_id)
      if source_id
        @ui.avatar.attr 'src', '/api/user/avatar?id=' + source_id
      if source_id == App.user._id
        @$el.addClass 'me'
        $('<div class="fa fa-times"></div>')
        .appendTo(@ui.top)
        .click () =>
          $.ajax
            url: '/api/message?id=' + @model.get '_id'
            type: 'DELETE'
            success: () =>
              @el.remove()

      if @model.get('unread')
        @$el.addClass 'unread'
        setTimeout () =>
          $.get '/api/message/read?id=' + @model.get('_id'), (result) =>
            if result.nModified > 0
              @$el.removeClass 'unread'
        , 3000
      @ui.time.html moment.utc(@model.get 'time').fromNow()
      return

  class Views.Dialog extends Marionette.CollectionView
    template: '#view-dialog'
    childView: Views.Message
    childViewContainer: '.messages'

    onRender: () ->
      App.dialog = @

    onDestroy: () ->
      App.dialog = null

  class Views.Editor extends Views.Form
    template: '#view-message-editor'

    ui:
      text: '.text'

    success: () ->
      target = @model.get 'target'
      if target._id
        target = target._id
      localStorage.removeItem 'draft_' + target
      App.dialog.collection.add @model
      @model = new App.Models.Message target
      @ui.text.html('')

  @show = (name, options) ->
    if options?
      options =
        model: if _instanceof(options, Backbone.Model) then options else new App.Models[name](options)
    view = new Views[name] options
    App.mainRegion.show view
