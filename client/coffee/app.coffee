@DEV = !version?
if DEV
  version = statistics.start

config =
  trace:
    history: true

@App = new Marionette.Application()
App.addRegions
  mainRegion: '#main .window-content'

App.on 'start', ->
  $.sendJSON 'POST', '/api/agent', statistics, (xhr) ->
      $('#boot-loading').hide()
      $('#root').show()
      if xhr.status <= code.UNAUTHORIZED
        boot xhr
      else
        App.Views.show 'Error',
          status: 'Server Error'
          text: 'Service Temporarily Unavailable'

boot = (xhr) ->
  App.controllers = {}
  if config.trace.history
    statistics.history = {}
  for name of App.Controllers
    Controller = App.Controllers[name]
    if _is(Controller, Marionette.Controller)
      controller = new Controller()
      new App.Router
        controller: controller
        appRoutes: controller.routes
      App.controllers[name] = controller
  Backbone.history.start
    pushState: true
  if code.UNAUTHORIZED != xhr.status
    App.user = JSON.parse xhr.responseText
#  if '/' == location.pathname
#    App.navigate if code.UNAUTHORIZED == xhr.status then 'login' else 'profile'


App.mainRegion.on 'show', (view) ->
  document.title = if view.title then _.result(view.title) else 'Socex'

App.navigate = (url) ->
  return Backbone.history.navigate url, trigger: true

class App.Router extends Marionette.AppRouter
  execute: (cb, args, name) ->
    if config.trace.history
      statistics.history[_.now()] = [name].concat args
    return Marionette.AppRouter.prototype.execute.apply(@, arguments)

if !DEV && window.addEventListener && navigator.sendBeacon
  addEventListener 'beforeunload', ->
    navigator.sendBeacon '/api/statistics', JSON.stringify(statistics)

App.Behaviors = {}

Marionette.Behaviors.behaviorsLookup = -> App.Behaviors
