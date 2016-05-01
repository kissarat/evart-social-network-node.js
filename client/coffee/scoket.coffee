pull = null

App.pull = ->
  if @socket and WebSocket.OPEN == @socket.readyState
    return
  @socket = new WebSocket(App.config.socket.address)
  register @socket,
    open: ->
      console.log 'Socket connected at ' + (new Date).toLocaleString()
    message: (e) ->
      try
        message = JSON.parse(e.data)
        return App.trigger(message.type, message)
      catch error
        return console.log('Cannot parse socket message')
      return
    close: ->
      setTimeout pull, App.config.socket.wait

pull = ->
  App.pull()

register App,
  login: pull
  read: (message) ->
    dialog = App.getDialogs().findWhere({dialog_id: message.target_id})
    if dialog
      dialog.set 'unread', 0
