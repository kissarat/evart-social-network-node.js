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
