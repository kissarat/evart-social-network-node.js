@App.module "Controllers", (Controllers, App) ->
  class Controllers.User extends Marionette.Controller
    login: ->
      App.mainRegion.show new App.Views.Login model: new App.Models.Login

    signup: ->
      App.mainRegion.show new App.Views.Signup model: new App.Models.User

    settings: ->
      user = new App.Models.User _id: App.user._id
      user.fetch()
      App.mainRegion.show new App.Views.Settings model: user

    verify: (id) ->
      App.mainRegion.show new App.Views.Verify model: new App.Models.Verify user_id: id

    profile: (domain) ->
      if not domain
        domain = App.user.domain
      $.get '/api/user?domain=' + domain, (user) ->
        user = new App.Models.User user
        userView = new App.Views.Profile model: user
        layout = new App.Layouts.Thresome()
        App.mainRegion.show layout
        App.Views.Dialog.build user.id, 'owner', layout
        layout.showChildView 'top', userView
      return

    users: () ->
      App.selectUser null, App.mainRegion

    routes:
      'login': 'login'
      'signup': 'signup'
      'profile': 'profile'
      'view/:domain': 'profile'
      'settings': 'settings'
      'users': 'users'
      'verify/:id': 'verify'


  class Controllers.Message extends Marionette.Controller
    index: (target_id) ->
      layout = new App.Layouts.Thresome()
      App.mainRegion.show layout
      App.Views.Dialog.build target_id, 'target', layout
      return

    dialogs: () ->
      dialogs = new App.Models.MessageList
      dialogs.url = '/api/message/dialogs'
      sum = (a, b) -> a + b
      dialogs.bind 'add change', () ->
        App.showCounter('dialogs',
          dialogs.map((d) -> if d.get('unread') > 0 then 1 else 0).reduce(sum, 0))
      App.thresome
        middle: new App.Views.DialogList collection: dialogs

    feed: () ->
      App.mainRegion.show App.Views.Dialog.feed()

#    chat: () ->
#      chat = new App.Models.ChatLayout
#      chat.showChildView

    routes:
      'dialogs': 'dialogs'
      'dialog/:target_id': 'index'
      'feed': 'feed'
#      'chat': 'chat'


  class Controllers.Photo extends Marionette.Controller
    index: () ->
      r = App.selectPhoto null, App.mainRegion
      r.currentView.middle.currentView.collection.on 'select', (photo) ->
        if @contains photo
          App.navigate "photo/" + photo.get '_id'
        else
          @add photo

    view: (id) ->
      $.getJSON '/api/photo?id=' + id, (photo) =>
        photo = new App.Models.Photo photo
        photoView = new App.Views.Photo model: photo
        layout = new App.Layouts.Thresome()
        App.mainRegion.show layout
        layout.showChildView 'top', photoView
        App.Views.Dialog.build id, 'photo', layout
        layout

    routes:
      'photos': 'index'
      'photo/:id': 'view'

  App.selectPhoto = (params, region) ->
    if not params
      params =
        owner_id: App.user._id
    photoList = new App.Models.PhotoList()
    photoList.params = params
    photoListView = new App.Views.PhotoList collection: photoList
    upload = new App.Views.Upload()
    upload.on 'uploaded', (photo) ->
#      photoList.add photo
      photoList.trigger 'select', photo
    App.thresome region,
      top: upload
      middle: photoListView
    photoListView.on 'childview:select', (photo) ->
      @collection.trigger 'select', photo.model
    Object.defineProperties region,
      collection:
        get: () ->
          @currentView.middle.currentView.collection
    region

  App.selectVideo = (params, region) ->
    if not params
      params =
        owner_id: App.user._id
    videoList = new App.Models.VideoList()
    videoList.params = params
    videoListView = new App.Views.VideoList collection: videoList
    upload = new App.Views.LoadVideo()
    upload.on 'add', (video) ->
#      videoList.add video
      videoList.trigger 'select', video
    App.thresome region,
      top: upload
      middle: videoListView
    videoListView.on 'childview:select', (video) ->
      @collection.trigger 'select', video.model
    Object.defineProperties region,
      collection:
        get: () ->
          @currentView.middle.currentView.collection
    region

  App.selectUser = (params, region) ->
    userList = new App.Models.UserList()
    userSearch = new Backbone.Model()
    userList.params = userSearch
    userListView = new App.Views.UserList
      collection: userList
    layout = new App.Layouts.UserListLayout
      model: userSearch
    region.show layout
    layout.showChildView 'users', userListView
    userList.fetch()
    userSearch.on 'change', () ->
      userList.fetch()
    layout

  class Controllers.Video extends Marionette.Controller
    index: () ->
      videoList = new App.Models.VideoList()
      videoList.params =
        owner_id: App.user._id
      videoListView = new App.Views.VideoList collection: videoList
      upload = new App.Views.LoadVideo()
      upload.on 'add', (video) ->
        videoList.add video
      videoList.fetch()
      layout = new App.Layouts.Thresome()
      App.mainRegion.show layout
      layout.showChildView 'top', upload
      layout.showChildView 'middle', videoListView
      return

    view: (id) ->
      $.getJSON '/api/video?id=' + id, (video) =>
        video = new App.Models.Video video
        videoView = new App.Views.Video model: video
        layout = new App.Layouts.Thresome()
        App.mainRegion.show layout
        layout.showChildView 'top', videoView
        App.Views.Dialog.build id, 'video', layout

    routes:
      'videos': 'index'
      'video/:id': 'view'

  App.widgets =
    videos: App.selectVideo
