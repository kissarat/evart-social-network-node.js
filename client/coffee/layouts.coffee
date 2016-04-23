@App.module 'Layouts', (Layouts) ->
  class Layouts.Thresome extends Marionette.LayoutView
    template: '#view-thresome-layout'

    regions:
      top: '.top'
      middle: '.middle'
      bottom: '.bottom'

  App.thresome = (container, object) ->
    if not _instanceof container, Marionette.LayoutView
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
      $.sendJSON 'POST', '/api/message', @model.toJSON(), () ->
        console.log arguments

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
      info: '> .middle .info'
      avatar: '> .middle .avatar'
      time: '> .middle .time'
      text: '> .middle .text'
      ip: '> .middle .ip'
      top: '> .top'
      middle: '> .middle'
      like: '> .top .fa-thumbs-up'
      hate: '> .top .fa-thumbs-down'
      comment: '> .middle .comment'

    events:
      'click > .top .fa-thumbs-up': 'like'
      'click > .top .fa-thumbs-down': 'hate'
      'click > .top .fa-share-alt': 'share'
      'click > .middle .comment': 'renderComments'

    bindings:
      '> .middle .text': 'text'
#      '> .middle .ip': 'ip'

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

    onRender: () ->
      @$el.attr('data-id', @model.get '_id')
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

      if @model.get 'unread'
        @$el.addClass 'unread'
        setTimeout () =>
          $.get '/api/message/read?id=' + @model.get('_id'), (result) =>
            if result.nModified > 0
              @$el.removeClass 'unread'
        , 3000
      @ui.time.html moment.utc(@model.get 'time').fromNow()

      if @model.get 'isRepost'
        @ui.top.remove()
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

  App.Views.Dialog.prototype.childView = Layouts.MessageLayout

  