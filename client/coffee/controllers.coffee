@App.module "Controllers", (Controllers) ->
  class Controllers.User extends Marionette.Controller
    login: ->
      App.mainRegion.show new App.Views.Login model: new App.Models.Login

    routes:
      'login': 'login'

#  Controllers.addInitializer ->
#    Controllers.router = new Controllers.User.Router()
