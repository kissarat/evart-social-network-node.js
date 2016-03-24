@App.module "Controllers", (Controllers) ->
  class Controllers.User extends Marionette.Controller
    login: ->
      console.log 'login'

  class Controllers.User.Router extends App.Router
    controller: new Controllers.User()

    appRouter:
      'login': 'login'

#  Controllers.addInitializer ->
#    Controllers.router = new Controllers.User.Router()
