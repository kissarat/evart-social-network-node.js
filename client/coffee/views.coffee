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

    behaviors:
      Bindings: {}

    bindings: ->
      b = {}
      @$el.find('[name]').each (i, input) ->
        name = input.getAttribute('name')

        if 'file' == input.type
          console.warn 'File input: ' + name
        else
          field = name
          if 'SELECT' == input.tagName
            labels = ["None selected", "Single", "In a relationship", "Engaged", "Married", "In love",
              "It's complicated", "Actively searching"]
            options = [];
            for i, label of labels
              options.push
                value: i
                label: T label
            field =
              observe: name
              selectOptions: collection: options

          b["[name=#{name}]"] = field
      return b

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
      else
        console.warn 'No file selected'

    success: (data) ->
      App.user = data
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
      photos: '.photos'

    bindings:
      '.text': 'text'
      '.ip': 'ip'

    onRender: () ->
      @$el.attr('id', @model.get '_id')
      source_id = App.id @model.get 'source'
      @ui.info.attr('data-id', source_id)
      if source_id
        @ui.avatar.attr 'src', '/api/user/avatar?id=' + source_id
      @ui.photos.append (Views.PhotoList.create @model.get 'photos').$el
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
#    childView: App.Layouts.MessageLayout
    childViewContainer: '.messages'

    onRender: () ->
      App.dialog = @

    onDestroy: () ->
      App.dialog = null

    @build: (id, target, layout) ->
      messageList = new App.Models.MessageList()
      messageList.params = {}
      messageList.params[target + '_id'] = id
      messageListView = new App.Views.Dialog collection: messageList
      draft =
        text: localStorage.getItem 'draft_' + id
      draft[target] = id
      draft = new App.Models.Message draft
      editor = new App.Views.Editor model: draft
      editorLayout = new App.Layouts.EditorLayout model: draft
      messageList.fetch()
      layout.showChildView 'middle', messageListView
      layout.showChildView 'bottom', editorLayout
      editorLayout.showChildView 'editor', editor
#      editor.$('[data-type]').click (e) ->
#        container = editor.ui.attachments.find("[data-list=#{e.target.dataset.list}]")
#        if 0 == container.length
#          $('<div></div>')
#          .attr('data-list', e.target.dataset.list)
#          .appendTo editor.ui.attachments

  class Views.Editor extends Marionette.ItemView
    template: '#view-message-editor'

    behaviors:
      Bindings: {}

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

  window.error_message = (container, message) ->
    $('<div></div>')
    .addClass('error')
    .html(message)
    .appendTo container

  class Views.Upload extends Marionette.ItemView
    template: '#view-upload'
    ui:
      file: '[type=file]'

    events:
      'change [type=file]': 'upload'

    upload: () ->
      file = @ui.file[0].files[0]
      if file
        App.upload('/api/photo', file).then (photo, e) =>
          if photo
            @trigger 'uploaded', new App.Models.Photo photo
          else
            message =
              switch e.target.status
                when code.REQUEST_TOO_LONG then 'is too large'
                else 'unknown error'
            error_message(@el, file.name + T ' ' + message)
      else
        console.warn 'No file selected'

  class Views.PhotoThumbnail extends Marionette.ItemView
    template: '#view-photo-thumbnail'
#    ui:
#      image: '.photo-thumbnail'

    attributes:
      class: 'photo-thumbnail thumbnail'

    events:
      'click': () ->
        @trigger 'select'

    onRender: () ->
      @$el.css 'background-image', "url(/photo/#{@model.get '_id'}.jpg)"

  class Views.Photo extends Marionette.ItemView
    template: '#view-photo'
    ui:
      image: 'img'

    attributes:
      class: 'photo'

    onRender: () ->
      @ui.image.attr 'src', "/photo/#{@model.get '_id'}.jpg"

  class Views.LoadVideo extends Marionette.ItemView
    template: '#view-load-video'

    ui:
      url: 'input'
      preview: '.video-preview'

    events:
      'change input': 'paste'
      'click button': 'add'

    paste: () ->
      $.getJSON '/api/video?url=' + @ui.url.val(), (video) =>
        @model = new App.Models.Video video
        @model.set 'url', @ui.url.val()
        @ui.preview.html video.html

    add: () ->
      $.post '/api/video?url=' + @model.get('url'), @model.toJSON(), () =>
        @ui.url.html ''
        @ui.preview.html ''
        @trigger 'add', @model

  class Views.PhotoList extends Marionette.CollectionView
    template: '#view-photo-list'
    childView: Views.PhotoThumbnail

    @create: (ids) ->
      new Views.PhotoList collection: new App.Models.PhotoList _.map ids, (id) -> _id: id

  class Views.VideoThumbnail extends Marionette.ItemView
    template: '#view-video-thumbnail'
    ui:
      image: 'img'

#    attributes:
#      class: 'thumbnail'

    bindings:
      '.title': 'title'

    events:
      'click img': 'select'

    behaviors:
      Bindings: {}

    select: () ->
#      App.navigate 'video/' + @model.get '_id'
      @trigger 'select', @model

    onRender: () ->
      @ui.image.attr 'src', @model.get 'thumbnail_url'

  class Views.VideoList extends Marionette.CollectionView
    childView: Views.VideoThumbnail

    @create: (videos) ->
      new Views.VideoList collection: new App.Models.VideoList videos

  class Views.Video extends Marionette.ItemView
    template: '#view-video'

    ui:
      frame: '.frame'

    bindings:
      '.title': 'title'

    behaviors:
      Bindings: {}

    onRender: () ->
      @ui.frame.html @model.get 'html'
