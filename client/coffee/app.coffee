@DEV = !version?
if DEV
  version = statistics.start

@App = new Marionette.Application()
App.addRegions
  mainRegion: '#main'

App.on 'start', ->
  $('#boot-loading').hide()
  $('#root').show()
  Backbone.history.start
    pushState: true
#  Backbone.history.navigate 'login', trigger: true

App.mainRegion.on 'show', (view) ->
  document.title = if view.title then _.result(view.title) else 'Socex'

App.navigate = (url) ->
  Backbone.history.navigate url, trigger: true

class App.Router extends Marionette.AppRouter

if !DEV && window.addEventListener && navigator.sendBeacon
  addEventListener 'beforeunload', ->
    navigator.sendBeacon '/api/statistics?v=' + version, JSON.stringify(statistics)
