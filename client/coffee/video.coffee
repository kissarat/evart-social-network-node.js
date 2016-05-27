@App.module "Video", (Video, App) ->
  class Video.Controller extends Marionette.Controller

    index: () ->
      list = new Video.List()
      layout = new Video.Layout()
      App.mainRegion.show layout
      listView = new Video.ListView collection: list.fullCollection
      layout.listRegion.show listView
      list.getFirstPage()
      window.g = list

    view: (id) ->
      1

  class Video.Router extends Marionette.AppRouter
    appRoutes:
      'video': 'index'
      'video/:id': 'view'

    changeModel: () ->
      @ui.current.toggle @model

  class Video.List extends App.PageableCollection
    url: '/api/video'

    parseRecords: (resp) ->
#      console.log resp
      resp

#    parseLinks: (resp) ->
#      console.log resp

#    fetch: () ->
#      super
#        data: owner_id: App.user._id

  class Video.Thumbnail extends Marionette.ItemView
    template: '#thumbnail-video'
    tagName: 'figure'
    ui:
      image: 'img'
      title: 'figcaption'

    bindings:
      'figcaption': 'title'

    triggers:
      'click': 'select'

    behaviors:
      Bindings: {}

    onRender: () ->
      @ui.image.attr 'src', @model.get 'thumbnail_url'
      @ui.image.attr 'alt', @model.get 'title'

  class Video.ListView extends Marionette.CollectionView
    childView: Video.Thumbnail

  class Video.View extends Marionette.ItemView
    template: '#view-video'

    ui:
      frame: '.frame'

    bindings:
      '.title': 'title'

    behaviors:
      Bindings: {}

    onRender: () ->
      @ui.frame.html @model.get 'html'

  class Video.Layout extends Marionette.LayoutView
    template: '#layout-videos'

    behaviors:
      Bindings: {}

    regions:
      listRegion: '.list'

    ui:
      title: '.title'
      current: '.current'
      list: '.list'

    modelEvents:
      'change': 'changeModel'

  new Video.Router
    controller: new Video.Controller()
