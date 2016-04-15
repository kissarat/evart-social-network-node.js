App.pull = () ->
  if @socket && WebSocket.OPEN == @socket.readyState
    return
  @socket = new WebSocket App.config.socket.address

  register @socket,
    open: () ->
      console.log 'Socket connected at ' + new Date().toLocaleString()

    message: (e) ->
      try
        message = JSON.parse e.data
        App.trigger message.type, message
      catch ex
        console.log 'Cannot parse socket message'

    close: () ->
      setTimeout pull, App.config.socket.wait

pull = () -> App.pull()

register App,
  login: pull

  message: (message) ->
    if App.dialog
      App.dialog.collection.add message
