App.pull = () ->
  if @socket && WebSocket.OPEN == @socket.readyState
    return
  @socket = new WebSocket App.config.socket.address

  register @socket,
    open: () ->
      console.log 'Socket connected at ' + new Date().toLocaleString()

    message: (e) ->
      App.debug.push 'socket_pull', e.data
      try
        message = JSON.parse e.data
      catch ex
        return console.error 'INVALID_JSON', e.data
      if message.type
        App.trigger message.type, message
      else
        console.error 'UNKNOWN_MESSAGE', message

    close: () ->
      if App.user
        setTimeout pull, App.config.socket.wait

pull = () -> App.pull()

App.push = (message) ->
  if 'string' != typeof message
    message.source_id = App.user._id
    message = JSON.stringify message
  App.debug.push 'socket_push', message
  @socket.send message

register App,
  login: pull

  logout: () -> App.socket.close()

  message: (message) ->
    dialog = App.getDialogs().findWhere dialog_id: message.source
    add = () -> dialog.get('messages').add message
    App.dock.set('dialogs')
#    if dialog
#      add()
#    else

notification_not_available = () ->
  App.features.notification.enabled = false
  console.warn 'Notification not available'

App.notify = (title, options) ->
  options.title = title
  options: options
  addEventListener: (event, cb) ->
    console.warn "LISTENER REGISTER"

if App.features.notification.available and App.features.notification.enabled
  Notification.requestPermission (permission) ->
    if 'granted' == permission
      App.notify = (title, options) ->
        new Notification(title, options)
    else
      notification_not_available()
else
  notification_not_available()
