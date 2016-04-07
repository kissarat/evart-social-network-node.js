@App.module "Controllers", (Controllers) ->
  class Controllers.User extends Marionette.Controller
    login: ->
      App.mainRegion.show new App.Views.Login model: new App.Models.Login

    signup: ->
      App.mainRegion.show new App.Views.Signup model: new App.Models.User

    settings: ->
      App.mainRegion.show new App.Views.Settings model: new App.Models.User

    verify: (id) ->
      App.mainRegion.show new App.Views.Verify model: new App.Models.Verify user_id: id

    routes:
      'login': 'login'
      'signup': 'signup'
      'verify/:id': 'verify'
