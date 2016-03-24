@App.module "Controllers", (Controllers) ->
  class Controllers.User extends Marionette.Controller
    login: ->
      console.log '11 login'

    routes:
      'login': 'login'

#  Controllers.addInitializer ->
#    Controllers.router = new Controllers.User.Router()
