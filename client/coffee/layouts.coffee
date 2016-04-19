@App.module 'Layouts', (Layouts) ->
  class Layouts.Dialog extends Marionette.LayoutView
    template: '#view-dialog-layout'

    regions:
      dialog: '.dialog'
      editor: '.editor'

  class Layouts.Thresome extends Marionette.LayoutView
    template: '#view-thresome-layout'

    regions:
      top: '.top'
      middle: '.middle'
      bottom: '.bottom'

  App.thresome = (container, object) ->
    layout = new Layouts.Thresome()
    container.show layout
    for r, v of object
      if v.collection
        v.collection.fetch()
      layout.showChildView r, v
    layout

  class Layouts.EditorLayout extends Marionette.LayoutView
    template: '#view-editor-layout'

    regions:
      editor: '.editor'
      buttons: '.buttons'
      attachments: '.attachments'
      photos: 'div[data-list=photos]'
      videos: 'div[data-list=videos]'
      files: 'div[data-list=files]'
      selection: '.selection'

    events:
      'click [data-type=photo]': 'selectPhoto'
      'click [data-type=video]': 'selectVideo'
      'click [type=submit]': 'submit'

    selectPhoto: () ->
      component = App.selectPhoto null, @selection
      component.collection.on 'select', (photo) =>
        if not @photos.currentView
          @photoList = new App.Models.PhotoList()
          @photos.show new App.Views.PhotoList collection: @photoList
        @photoList.add photo

    selectVideo: () ->
      component = App.selectVideo null, @selection
      component.collection.on 'select', (video) =>
        if not @videos.currentView
          @videoList = new App.Models.VideoList()
          @videos.show new App.Views.VideoList collection: @videoList
        @videoList.add video

    submit: (e) ->
      e.preventDefault()
      if _.size(@photoList) > 0
        @model.set 'photos', @photoList.pluck '_id'
      if _.size(@videoList) > 0
        @model.set 'videos', @videoList.pluck '_id'
      @model.set 'text', @$('textarea').val()
      $.sendJSON 'POST', '/api/message', @model.toJSON(), () ->
        console.log arguments

  class Layouts.MessageLayout extends Marionette.LayoutView
    template: '#view-message-layout'

    regions:
      photos: '.photos'
      videos: '.videos'

    behaviors:
      Bindings: {}

    ui:
      info: '.info'
      avatar: '.avatar'
      time: '.time'
      ip: '.ip'
      top: '.top'
      middle: '.middle'

    bindings:
      '.text': 'text'
      '.ip': 'ip'

    onRender: () ->
      @$el.attr('id', @model.get '_id')
      source_id = App.id @model.get 'source'
      @ui.info.attr('data-id', source_id)
      if source_id
        @ui.avatar.attr 'src', '/api/user/avatar?id=' + source_id
      if _.size(@model.get 'photos') > 0
        photos = App.Views.PhotoList.create @model.get 'photos'
        @photos.show photos
        photos.on 'childview:select', (photo) ->
          App.navigate 'photo/' + photo.model.get '_id'
      if _.size(@model.get 'videos') > 0
        videos = App.Views.VideoList.create @model.get 'videos'
        videos.on 'childview:select', (video) ->
          App.navigate 'video/' + video.model.get '_id'
        @videos.show videos
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

  App.Views.Dialog.prototype.childView = Layouts.MessageLayout
