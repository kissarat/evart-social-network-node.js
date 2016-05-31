@App.module 'Layouts', (Layouts) ->
  class Layouts.Thresome extends Marionette.LayoutView
    template: '#view-thresome-layout'

    attributes:
      class: 'threesome'

    regions:
      top: '.top'
      middle: '.middle'
      bottom: '.bottom'

  App.thresome = (container, object) ->
    if not _instanceof container, Marionette.Region
      object = container
      container = App.mainRegion
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
      $.sendJSON 'POST', '/api/message', @model.toJSON()

  class Layouts.MessageLayout extends Marionette.LayoutView
    template: '#view-message-layout'

    regions:
      repost: '> .repost'
      photos: '> .photos'
      videos: '> .videos'
      childrenRegion: '> .children'

    behaviors:
      Bindings: {}

    ui:
      content: '> .content'
      info: '> .content .info'
      avatar: '> .content .avatar'
      time: '> .content .time'
      text: '> .content .text'
      ip: '> .content .ip'
      controls: '> .message-controls'
      likeSlider: '> .message-controls .like-slider-container'
      like: '> .message-controls .fa-thumbs-up'
      hate: '> .message-controls .fa-thumbs-down'
      comment: '> .message-controls .comment'

    events:
      'click > .message-controls .fa-thumbs-up': 'like'
      'click > .message-controls .fa-thumbs-down': 'hate'
      'click > .message-controls .fa-share-alt': 'share'
      'click > .message-controls .comment': 'renderComments'
      'click > .message-controls .like-slider-container': 'sliderClick'

    bindings:
      '> .content .text': 'text'
#      '> .content .ip': 'ip'

    setAvatar: (id) ->
      @ui.avatar.css 'background-image', 'url("' + (App.avatarUrl id) + '")'

    sliderClick: (e) ->
      s = @ui.likeSlider
      rect = s[0].getBoundingClientRect()
      x = e.clientX - rect.left
      s.toggleClass 'like', x > 24
      s.toggleClass 'hate', x < 12

    like: () ->
      @_like 'like'

    hate: () ->
      @_like 'hate'

    _like: (field) ->
      $.ajax
        type: if _.indexOf(@model.get(field), App.user._id) >= 0 then 'DELETE' else 'POST'
        url:  '/api/like?' + $.param
          entity: 'messages'
          field: field
          id: @model.get '_id'
        success: (data) =>
          @model.set 'like', data.like
          @model.set 'hate', data.hate
          @renderLikes()

    renderLikes: () ->
      @ui.like.html _.size @model.get 'like'
      @ui.hate.html _.size @model.get 'hate'
      return

    share: () ->
      $.post '/api/message?repost_id=' + @model.get '_id'

    renderComments: () ->
      @ui.comment.remove()
      childrenView = new App.Layouts.Thresome()
      @showChildView 'childrenRegion', childrenView
      App.Views.Dialog.build @model.get('_id'), @model.getChildren(), childrenView

    renderRepost: () ->
      repost = @model.get 'repost'
      if repost
        repost = new App.Models.Message repost
        repost.set 'isRepost', true
        repostView = new Layouts.MessageLayout model: repost
        @repost.show repostView

    renderPhotos: () ->
      if _.size(@model.get 'photos') > 0
        photos = App.Views.PhotoList.create @model.get 'photos'
        @photos.show photos
        photos.on 'childview:select', (photo) ->
          App.navigate 'photo/' + photo.model.get '_id'

    renderVideos: () ->
      if _.size(@model.get 'videos') > 0
        videos = App.Views.VideoList.create @model.get 'videos'
        videos.on 'childview:select', (video) ->
          App.navigate 'video/' + video.model.get '_id'
        @videos.show videos

#    onShow: () ->
#      last_model = _.max(@model.collection.models, (model) -> new Date(model.get('time')).getTime())
#      if last_model.get('_id') == @model.get('id')
#      if @el.nextElementSibling
#        @el.scrollIntoView(false)

    onRender: () ->
      @$el.attr('data-id', @model.get '_id')
      source_id = App.id @model.get 'source'
      @ui.info.attr('data-id', source_id)
      if source_id
        @setAvatar source_id
      if source_id == App.user._id
        @$el.addClass 'me'
        $('<div class="fa fa-times"></div>')
        .appendTo(@ui.controls)
        .click () =>
          $.ajax
            url: '/api/message?id=' + @model.get '_id'
            type: 'DELETE'
            success: () =>
              @el.remove()

      if @model.get 'unread'
        @$el.addClass 'unread'
      @ui.time.html moment.utc(@model.get 'time').fromNow()

      if @model.get 'isRepost'
        @ui.controls.remove()
      else
        @renderLikes()

      @renderPhotos()
      @renderVideos()
      @renderRepost()
      if _.size(@model.get 'children') > 0
        @renderComments()
        @ui.comment.remove()

      if not @model.isPost()
        @ui.comment.remove()

      return

  class Layouts.UserListLayout extends Marionette.LayoutView
    template: '#view-user-list-layout'

    regions:
      users: '.users'

    ui:
      search: '[type=search]'

    bindings:
      '[type=search]': 'search'

    behaviors:
      Bindings: {}

  class Layouts.ChatLayout extends Marionette.LayoutView
    template: '#view-user-list-layout'

    regions:
      members: '.members'
      selection: '.selection'

    ui:
      name: '[type=name]'

    bindings:
      '[type=name]': name

    behaviors:
      Bindings: {}


  class Layouts.Window extends Marionette.LayoutView
    template: '#view-window'

    ui:
      title: '.title'
      controls: '.window-controls'

    regions:
      controlsRegion: '.window-controls'
      contentRegion: '.window-content'

    @floats = {}

    @openFloat: (controls = false) ->
      w = new Layouts.Window()
#      App.floatingRegion.show w
      Layouts.Window.floats[w.cid] = w
      w.$el.addClass 'float-window'
      draggable = {}
      if controls
        draggable.handle = '.window-controls'
      else
        w.ui.controls.hide()
      w.$el.draggable draggable
      return w

  App.Views.Dialog.prototype.childView = Layouts.MessageLayout
