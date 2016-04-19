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

    profile: () ->
      App.mainRegion.show new App.Views.Profile model: new App.Models.User App.user

    routes:
      'login': 'login'
      'signup': 'signup'
      'profile': 'profile'
      'settings': 'settings'
      'verify/:id': 'verify'


  class Controllers.Message extends Marionette.Controller
    index: (target_id) ->
      layout = new App.Layouts.Thresome()
      App.mainRegion.show layout
      Controllers.Message.Index target_id, 'target', layout
      return

    @Index: (id, target, layout) ->
      messageList = new App.Models.MessageList()
      messageList.params = {}
      messageList.params[target + '_id'] = id
      messageListView = new App.Views.Dialog collection: messageList
      draft =
        text: localStorage.getItem 'draft_' + id
      draft[target] = id
      draft = new App.Models.Message draft
      draftView = new App.Views.Editor model: draft
      messageList.fetch()
      layout.showChildView 'middle', messageListView
      layout.showChildView 'bottom', draftView

    routes:
      'dialog/:target_id': 'index'


  class Controllers.Photo extends Marionette.Controller
    index: () ->
      photoList = new App.Models.PhotoList()
      photoList.params = owner_id: App.user._id
      photoListView = new App.Views.PhotoList collection: photoList
      upload = new App.Views.Upload()
      upload.on 'uploaded', (photo) ->
        photoList.add photo
      photoList.fetch()
      layout = new App.Layouts.Thresome()
      App.mainRegion.show layout
      layout.showChildView 'top', upload
      layout.showChildView 'middle', photoListView
      return

    view: (id) ->
      $.getJSON '/api/photo?id=' + id, (photo) =>
        photo = new App.Models.Photo photo
        photoView = new App.Views.Photo model: photo
        layout = new App.Layouts.Thresome()
        App.mainRegion.show layout
        layout.showChildView 'top', photoView
        Controllers.Message.Index id, 'photo', layout

    routes:
      'photos': 'index'
      'photo/:id': 'view'


  class Controllers.Video extends Marionette.Controller
    index: () ->
      videoList = new App.Models.VideoList()
      videoList.params = owner_id: App.user._id
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
        Controllers.Message.Index id, 'video', layout

    routes:
      'videos': 'index'
      'video/:id': 'view'
