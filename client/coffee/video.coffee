@App.module 'Video', (Video, App) ->

  class Video.Controller extends Marionette.Controller
    index: () ->
      list = new Video.List()
      layout = new Video.Layout()
      App.mainRegion.show layout

      listView = new Video.ListView collection: list.fullCollection
      layout.currentRegion.show new Video.View()
      layout.listRegion.show listView
      list.getFirstPage()

    view: (id) ->
      1

    unsupported: (type) ->
      App.mainRegion.show new Video.Unsupported()

  class Video.Router extends Marionette.AppRouter
    appRoutes:
      'video': 'index'
      'video/:id': 'view'
      'unsupported(/:type)': 'unsupported'

  App.channels.video = Backbone.Radio.channel('video')

  class Video.List extends App.PageableCollection
    url: '/api/video'

    queryModelInitial:
      q: ''

  class Video.Thumbnail extends Marionette.ItemView
    template: '#thumbnail-video'
    tagName: 'a'
    ui:
      image: 'img'
      title: 'figcaption'

    events:
      'click': 'open'

    bindings:
      'figcaption': 'title'

    behaviors:
      Bindings: {}

    open: (e) ->
      e.preventDefault()
      App.channels.video.request 'open', @model

    onRender: () ->
      @ui.image.attr 'src', @model.get 'thumbnail_url'
      @ui.image.attr 'alt', @model.get 'title'
      @$el.attr 'href', '/video/' + @model.get '_id'

  class Video.ListView extends Marionette.CollectionView
    childView: Video.Thumbnail

    behaviors:
      Pageable: {}

  class Video.View extends Marionette.ItemView
    template: '#view-video'

    initialize: () ->
      @model = new Backbone.Model()
      App.channels.video.reply 'open', (model) =>
        @model = model
        @ui.frame.html model.get('html')

    ui:
      frame: '.frame'

    bindings:
      '.title': 'title'

    behaviors:
      Bindings: {}

  class Video.Layout extends Marionette.LayoutView
    template: '#layout-videos'

    initialize: () ->
      @model = new Backbone.Model()
      @listRegion.on 'show', @setupModel
      window.VIDEO_LAYOUT = @

    behaviors:
      Bindings: {}

    bindings:
      '[type=search]': 'q'

    regions:
      currentRegion: '.current'
      listRegion: '.list'

    ui:
      title: '.title'
      current: '.current'
      list: '.list'
      resize: '.resize'
      search: 'input'

    events:
      'keyup @ui.search': 'search'
      'change @ui.search': 'search'

    getCollection: () ->
      @listRegion.currentView.collection.pageableCollection

    setupModel: () =>
      @model = @getCollection().queryModel
      @stickit()

    search: (e) ->
      if EmptyKeys.indexOf(e.keyCode) < 0
        @ui.list.busy(true)
        @getCollection().delaySearch () =>
          @ui.list.busy(false)

  class Video.Unsupported extends Marionette.ItemView
    template: '#view-unsupported'

    attributes:
      class: 'unsupported'

    ui:
      text: '.text'

    onRender: () ->
      type = App.route[1]
      if 'peer' == type
        text = "Unfortunately, your browser doesn't support video calling feature. You can use one of the following browsers"
      else
        text = "Unfortunately, your browser doesn't supported. You can use one of the following browsers"
      @ui.text.html T(text)

  new Video.Router
    controller: new Video.Controller()
