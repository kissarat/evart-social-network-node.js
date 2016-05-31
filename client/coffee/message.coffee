App.module 'Message', (Message, App) ->
  class Message.Controller extends Marionette.Controller
    

  class Message.Router extends App.Router

  class Message.Model extends Backbone.Model
    isPost: ->
      not not @get 'owner'

  class Message.List extends App.PageableCollection
    @queryModelInitial:
      owner_id: null

    model: (attrs, options) ->
      new Message.Model attrs, options


  new Message.Router controller: new Message.Controller
