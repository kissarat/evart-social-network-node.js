@App.module "Controllers", (Controllers, App) ->
  class Controllers.User extends Marionette.Controller
    login: ->
      App.mainRegion.show new App.Views.Login model: new App.Models.Login

    signup: ->
      App.mainRegion.show new App.Views.Signup model: new App.Models.User

    settings: ->
      App.mainRegion.show new App.Views.Settings model: new App.Models.User

    verify: (id) ->
      App.mainRegion.show new App.Views.Verify model: new App.Models.Verify user_id: id

    dialog: (target_id) ->
      dialog = new App.Models.MessageList()
      dialog.params =
        target_id: target_id
      dialogView = new App.Views.Dialog collection: dialog
      draft = new App.Models.Message
        target: target_id
        text: localStorage.getItem 'draft_' + target_id
      draftView = new App.Views.Message model: draft
      dialog.fetch()
      layout = new App.Layouts.Dialog()
      layout.render()
      layout.showChildView 'dialog',  dialogView
      layout.showChildView 'editor', draftView
      App.mainRegion.show layout

    routes:
      'login': 'login'
      'signup': 'signup'
      'verify/:id': 'verify'
      'dialog/:target': 'dialog'


