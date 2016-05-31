App.module 'Message', (Message, App) ->
  class Message.Controller extends Marionette.Controller
    wall: (id) ->
      pageable = new Message.List
      pageable.queryModel.set('type', 'wall')
      pageable.queryModel.set('owner_id', id)
      App.mainRegion.show new Message.ListView collection: pageable.fullCollection
      pageable.getFirstPage()

  class Message.Router extends App.Router
    appRoutes:
      'wall/:id': 'wall'

  class Message.Model extends Backbone.Model
    isPost: ->
      not not @get 'owner'

  class Message.List extends App.PageableCollection
    url: '/api/message'

    queryModelInitial:
      owner_id: null

    model: (attrs, options) ->
      new Message.Model attrs, options

  class Message.View extends Marionette.LayoutView
    template: '#layout-message'

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

    setAvatar: (id) ->
      @ui.avatar[0].setBackground App.avatarUrl id

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

  class Message.ListView extends Marionette.CollectionView
    childView: Message.View

    behaviors:
      Pageable: {}

  new Message.Router controller: new Message.Controller
