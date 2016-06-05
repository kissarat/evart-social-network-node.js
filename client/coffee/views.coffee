@App.module 'Views', (Views) ->
  class App.Behaviors.Bindings extends Marionette.Behavior
    onRender: ->
#      document.title = _.result(@view, 'title') || @view.constructor.name
      @view.$('a').click (e) ->
        e.preventDefault()
        App.navigate this.getAttribute 'href'
        return
      clazz = @view.template
      .replace('#thumbnail-', 'view thumbnail-')
      .replace('#layout-', 'view layout-')
      .replace('#form-', 'view form-')
      .replace('#view-', 'view ')
      @view.$el.addClass clazz
      @view.$('.unavailable').click () ->
        alert T('This function is not available yet')
      template = $(@view.template)
      cssClass = template.attr('data-class')
      $('body').removeAttr('class')
      if cssClass
        $('body').addClass(cssClass)
      el = @view.el
      if App.dictionary
        ['h1', 'h2', 'legend', 'span', 'label', 'button', 'option', 'a', '.label', '[title]',
          '[placeholder]'].forEach (name) ->
            _.each el.querySelectorAll(name), (element) ->
              text = element.childNodes.item 0
              if element.getAttribute('title')
                element.setAttribute 'title', T element.getAttribute('title')
              else if element.getAttribute('placeholder')
                element.setAttribute 'placeholder', T element.getAttribute('placeholder')
              else if 1 == element.childNodes.length and Node.TEXT_NODE == text.nodeType
                text.textContent = T text.textContent
      @view.stickit()

  class App.Behaviors.Pageable extends Marionette.Behavior
    onAttach: () ->
      view = @view
      el = view.el.findParent (current) ->
        current.classList.contains('scroll')
      el.addEventListener 'scroll', (e) =>
        delta = e.target.scrollHeight - e.target.scrollTop
        if delta < 500
          view.collection.pageableCollection.getNextPage()

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
      files = _.toArray @ui.file[0].files
      _upload = () =>
        file = files.shift()
        if file
          App.upload('/api/photo', file).then (photo, e) =>
            if photo
              @trigger 'uploaded', new App.Models.Photo photo
            else
              message =
                switch e.target.status
                  when code.REQUEST_TOO_LONG then 'is too large'
                  else
                    'unknown error'
              error_message(@el, file.name + ' ' + T message)
          _upload()
      _upload()

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
    childView: Views.PhotoThumbnail

    @create: (ids) ->
      new Views.PhotoList collection: new App.Models.PhotoList _.map ids, (id) -> _id: id

  class Views.LastMessage extends Marionette.ItemView
    template: '#view-last-message'

    behaviors:
      Bindings: {}

    bindings:
      '.text': 'text'

    ui:
      domain: '.domain'
      avatar: '.avatar'
      time: '.time'
      text: '.text'
      unread: '.unread-count'
      info: '.info'

    events:
      'click': 'open'

    open: () ->
      App.navigate 'dialog/' + @model.get('dialog_id')

    onRender: () ->
#      @ui.frame.html @model.get 'html'
      source = @model.get('source')
      @$el.attr('data-id', @model.get '_id')
      @ui.info.attr('data-id', source._id)
      @ui.avatar.attr 'src', '/api/user/avatar?id=' + source._id
      unread = @model.get 'unread'
      if unread > 0
        @ui.unread.html unread
        @$el.addClass 'unread'
      if @model.get('dialog_id') == source._id
        @ui.domain.html source.domain
      else
        @ui.domain.html @model.get('target').domain

  class Views.DialogList extends Marionette.CollectionView
    childView: Views.LastMessage

  #    onRender: () ->
  #      $('<div class="loading"></div>')
  #      .appendTo(@$el);

  class Views.UserItem extends Marionette.ItemView
    template: '#view-user-item'
    ui:
      avatar: 'img'
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
      @ui.name.text App.Models.User.getName @model
      @ui.avatar.attr 'src', '/api/user/avatar?id=' + @model.get('_id')
      @ui.country.text @model.get('country')
      @ui.city.text @model.get('city')

    open: () ->
      App.navigate '/view/' + @model.get('domain')

  class Views.UserList extends Marionette.CollectionView
    childView: Views.UserItem

  class Views.VerticalMenu extends Marionette.ItemView
    template: '#view-vertical-menu'
    tagName: 'ul'

    ui:
      messages: '[data-name=messages]'
      video: '[data-name=video]'

  #    onRender: () ->
  #      console.log @ui.video

  class Views.Alert extends Marionette.ItemView
    template: '#view-alert'

    ui:
      message: '.message'

    events:
      'click .close': 'close'

    close: () =>
      @model.collection.remove(@model)

    onRender: () ->
      @$el.addClass('alert alert-' + @model.get('type'))
      @ui.message.html @model.get('message')
      if App.config.alert.duration > 0
        setTimeout(@close, App.config.alert.duration)

  class Views.AlertList extends Marionette.CollectionView
    childView: Views.Alert

  App.dock = new App.Models.Dock()
  App.dock.on 'change', (changes) ->
    for k of @attributes
      App.showCounter k, @get(k)
    return
