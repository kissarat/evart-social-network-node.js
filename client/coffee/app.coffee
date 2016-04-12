@DEV = !version?
if DEV
  version = statistics.start

config =
  trace:
    history: true

@App = new Marionette.Application()
App.addRegions
  mainRegion: '#main .window-content'

window.dictionary = null
window.T = (name) -> name

App.on 'start', ->
  $.sendJSON 'POST', '/api/agent', statistics, (xhr) ->
      $('#boot-loading').hide()
      $('#root').show()
      if xhr.status <= code.UNAUTHORIZED
        language = $.cookie 'lang'
        if language
          document.documentElement.setAttribute 'lang', language
          $.getJSON "/languages/#{language}.json", (_dict) ->
            window.dictionary = _dict
            window.T = (name) -> dictionary[name] || name
            boot xhr
        else
          boot xhr
      else
        App.Views.show 'Error',
          status: 'Server Error'
          text: 'Service Temporarily Unavailable'

boot = (xhr) ->
  App.controllers = {}
  if config.trace.history
    statistics.history = {}
  templates = {}
  routes = {}
  $('[type="text/template"]').each (i, template) ->
    method = template.id.replace 'view-', ''
    className = (_get('class') || '').replace('.', ' ') + ' view'
    routes['template/' + method] = method
    templates[method] = () ->
      App.mainRegion.show new (Marionette.ItemView.extend
        attributes:
          class: className
        template: '#' + template.id)
  new App.Router
    controller: new (Marionette.Controller.extend templates)
    appRoutes: routes
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

addEventListener 'load', () ->
  if DEV
    deferreds = []
    $('[data-src]').each (i, script) ->
      deferreds.push $.get script.dataset.src, (template) ->
        script.innerHTML = template
        script.removeAttribute 'data-src'
    $.when(deferreds).then () ->
      console.log 'Views loaded'
      App.start()
  else if window.addEventListener && navigator.sendBeacon
    addEventListener 'beforeunload', ->
      navigator.sendBeacon '/api/statistics', JSON.stringify(statistics)
    App.start()

App.Behaviors = {}

Marionette.Behaviors.behaviorsLookup = -> App.Behaviors
