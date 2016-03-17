@App = new Marionette.Application
App.addRegions
  leftRegion: '#left'
  mainRegion: '#main'
  rightRegion: '#right'

App.on 'initialize:after', ->
  Backbone.history.start()

  