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
    dialog = App.getDialogs().findWhere dialog_id: message.source
    add = () -> dialog.get('messages').add message
    App.dock.set('dialogs')
#    if dialog
#      add()
#    else

notification_not_available = () ->
  features.notification.available = false
  console.warn 'Notification not available'

App.notify = (title, options) ->
  options.title = title
  options: options
  addEventListener: (event, cb) ->
    console.warn "LISTENER REGISTER"

if App.features.notification.available
  Notification.requestPermission (permission) ->
    if 'granted' == permission
      App.notify = (title, options) ->
        new Notification(title, options)
    else
      notification_not_available()
else
  notification_not_available()
