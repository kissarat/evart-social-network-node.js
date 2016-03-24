@DEV = !version?
if DEV
  version = statistics.start

config =
  trace:
    history: true

@App = new Marionette.Application()
App.addRegions
  mainRegion: '#main .container'

App.on 'start', ->
  $.post
    url: '/api/agent',
    complete: (xhr) ->
      $('#boot-loading').hide()
      $('#root').show()
      if xhr.status < 400
        boot()
      else
        App.Views.show 'Error',
          status: 'Server Error'
          text: 'Service Temporarily Unavailable'

boot = ->
  App.controllers = {}
  if config.trace.history
    statistics.history = {}
  for name of App.Controllers
    Controller = App.Controllers[name]
    if _is(Controller, Marionette.Controller)
      controller = new Controller()
      new App.Router
  #      new Marionette.AppRouter
        controller: controller
        appRoutes: controller.routes
      App.controllers[name.toLowerCase()] = controller
  Backbone.history.start
    pushState: true


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
    navigator.sendBeacon '/api/statistics?v=' + version, JSON.stringify(statistics)

App.Behaviors = {}

Marionette.Behaviors.behaviorsLookup = -> App.Behaviors

