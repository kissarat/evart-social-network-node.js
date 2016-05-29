@App.module "Controllers", (Controllers, App) ->
  class Controllers.User extends Marionette.Controller
    signup: ->
      App.mainRegion.show new App.Views.Signup model: new App.Models.User

    settings: (domain) ->
      if not domain
        domain = App.user.domain
      $.get '/api/user?domain=' + domain, (user) ->
        user = new App.Models.User user
        user.fetch()
        App.mainRegion.show new App.Views.Settings model: user

    verify: (id) ->
      App.mainRegion.show new App.Views.Verify model: new App.Models.Verify user_id: id

    profile: (domain) ->
      if not domain
        domain = App.user.domain
      $.get '/api/user?domain=' + domain, (user) ->
        user = new App.Models.User user
        profile = new App.Layouts.ProfileLayout model: user
        layout = new App.Layouts.Thresome()
        App.mainRegion.show profile
        profile.messagesRegion.show layout
        App.Views.Dialog.build user.id, 'owner', layout
      return

    users: () ->
      App.selectUser null, App.mainRegion

    index: (domain) ->
      params =
        domain: domain
      if 1 == location.pathname.indexOf('follow')
        params.list = 'follow'
      if 1 == location.pathname.indexOf('denies')
        params.list = 'deny'
      params.type = if 1 == location.pathname.indexOf('groups') then 'group' else 'user'

      App.selectUser params, App.mainRegion

    routes:
      'signup': 'signup'
      'profile': 'profile'
      'view/:domain': 'profile'
      'settings': 'settings'
      'edit/:domain': 'settings'
      'verify/:id': 'verify'
      'users': 'users'
      'follows/:domain': 'index'
      'denies/:domain': 'index'


  class Controllers.Message extends Marionette.Controller
    index: (target_id) ->
      layout = new App.Layouts.Thresome()
      App.mainRegion.show layout
      result = App.Views.Dialog.build target_id, 'target', layout
      dialogs = App.getDialogs();
      dialogs.on 'add', (dialog) ->
        if target_id == dialog.get('dialog_id')
          dialog.set 'messages', result.messageList
      conference = new App.Views.Conference()
      result.layout.top.show conference
      return

    dialogs: () ->
      layout = new App.Layouts.Thresome()
      dialogList = new App.Views.DialogList collection: App.getDialogs()
      App.mainRegion.show layout
      layout.middle.show dialogList

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
    userSearch = new Backbone.Model params or {}
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

  App.widgets =
    videos: App.selectVideo

  App.getDialogs = () ->
    if not App._dialogs
      dialogs = new App.Models.MessageList
      dialogs.url = '/api/message/dialogs'
      App.dock.set('dialogs', 0)
      dialogs.on 'add', (model) ->
        if model.get('unread') > 0
          App.dock.set 'dialogs', App.dock.get('dialogs') + 1
        model.on 'change:unread', () ->
          App.dock.set 'dialogs', App.dock.get('dialogs')
          + if 0 == model.get('unread') then -1 else 1
      dialogs.fetch()
      App._dialogs = dialogs
    return App._dialogs
