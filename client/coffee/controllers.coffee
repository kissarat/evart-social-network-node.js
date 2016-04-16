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
    dialog: (target_id) ->
      dialog = new App.Models.MessageList()
      dialog.params =
        target_id: target_id
      dialogView = new App.Views.Dialog collection: dialog
      draft = new App.Models.Message
        target: target_id
        text: localStorage.getItem 'draft_' + target_id
      draftView = new App.Views.Editor model: draft
      dialog.fetch()
      layout = new App.Layouts.Dialog()
      App.mainRegion.show layout
      layout.showChildView 'dialog', dialogView
      layout.showChildView 'editor', draftView

    routes:
      'dialog/:target_id': 'dialog'
