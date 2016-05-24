@DEV = !version?
if DEV
  version = statistics.start

config =
  trace:
    history: true
  socket:
    address: 'ws://' + location.hostname + '/socket'
    wait: 800
  peer:
    iceServers: [
      {
        urls: "stun:stun.services.mozilla.com",
        username: "louis@mozilla.com",
        credential: "webrtcdemo"
      },
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun.services.mozilla.com',
        "stun:23.21.150.121"
      ]
    ]


features =
  peer:
    available: !!window.RTCPeerConnection
  notification:
    available: !!window.Notification
    enabled: false
  fullscreen:
    available: Element.prototype.requestFullscreen

debug =
  trace: () ->
    if DEV
      console.log.apply console, arguments
  error: () ->
    if DEV
      console.error.apply console, arguments
  push: (name, element) ->
    if DEV
      if !@[name]
        @[name] = []
      @[name].push element

window.addEventListener 'unload', () ->
  storedConfig =
    version: version
    features: features
    mode: if DEV then 'dev' else 'prod'
    config: config
  localStorage.setItem 'socex', JSON.stringify storedConfig


@App = new Marionette.Application()

App.config = config
App.features = features
App.debug = debug

windowControls = (document.querySelector '#view-window').innerHTML

window_handlers = () ->
#  @find('[title=close]').click () =>
#    $(@).hide()
#  @find('[title=maximize]').click () =>
#    $('.window').each (i, w) =>
#      if @.attr('id') == w.id
#        $(w).show()
#      else
#        $(w).toggle()

regions =
  floatingRegion: '#floating-window-container'
_.each document.querySelectorAll('#root > div'), (region) ->
  id = region.id
  region.classList.add 'window'
  region.innerHTML = windowControls
  regions[id + 'Region'] = "##{id} .window-content"
  window_handlers.call $(region)
App.addRegions regions

#for name, region of App.getRegions()
#  region.on 'show', () ->
#    view = @currentView
#    if _instanceof(view, App.Layouts.Thresome)
#      view.middle.on 'show', () ->
#        className = view.$el.attr('class')
#        region.currentView.$el.addClass className + '-window'

@dictionary = null
@T = (name) -> name

App.on 'start', ->
  $.sendJSON 'POST', '/api/agent', statistics, (xhr) ->
    $('#boot-loading').hide()
    $('#root').show()
    if xhr.status <= code.UNAUTHORIZED
      language = App.language
      if language and 'en' != language
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
  if code.UNAUTHORIZED != xhr.status
    try
      App.agent = JSON.parse xhr.responseText
      App.trigger 'login'
    catch ex
      console.warn 'User is not authorized'
  #  if '/' == location.pathname
  #    App.navigate if code.UNAUTHORIZED == xhr.status then 'login' else 'profile'
  need_login = '/login' != location.pathname and not App.user
  Backbone.history.start
    pushState: true
    silent: need_login
  if need_login
    App.navigate 'login'


App.mainRegion.on 'show', (view) ->
  document.title = if view.title then _.result(view.title) else 'Socex'

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
        script.innerHTML = template.replace />\s+</g, '><'
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

addEventListener 'unload', () ->
  if App.mainRegion.currentView.editor
    model = App.mainRegion.currentView.editor.currentView.model
    text = model.get('text')
    if text && text.trim()
      localStorage.setItem 'draft_' + model.get('target'), text

App.navigate = (url) ->
  return Backbone.history.navigate url, trigger: true

App.avatarUrl = (id) ->
  return '/api/user/avatar?id=' + id

App.id = (object) ->
  if not object
    console.warn 'Null id'
    return null
  if object._id
    return object._id
  if 'object' == typeof object then object.get('_id') else object

App.upload = (url, file) ->
  xhr = new XMLHttpRequest()
  xhr.open 'POST', url
  xhr.send file
  new Promise (resolve, reject) ->
    xhr.onload = (e) ->
      data = null
      try
        data = JSON.parse xhr.responseText
      catch ex
      resolve data, e
    xhr.onerror = reject

App.toggle = (array, element) ->
  i = array.indexOf(element)
  result = i < 0
  if result
    array.push element
  else
    array.splice i, 1
  result

Object.defineProperties App,
  language:
    set: (value) ->
      $.cookie 'lang', value
    get: () ->
      $.cookie('lang') || document.documentElement.getAttribute 'lang'

  user:
    get: () ->
      if @agent and @agent.user then @agent.user else null

$('#select-language')
.val(App.language)
.change (e) ->
  $.cookie 'lang', e.target.value,
    expires: 365
    path: '/'
  location.reload()

App.on 'login', () ->
  App.navigate 'profile'

App.logout = () ->
  $.get '/api/user/logout', () ->
    App.trigger 'logout'
  
App.on 'logout', () ->
  $('#dock-container').hide()
  App.navigate 'login'

App.showCounter = (name, value) ->
  icon = $('#dock [href="/' + name + '"]')
  if icon.length > 0
    counter = icon.find '.counter'
    if 0 == counter.length and value
      counter = $('<div class="counter"></div>')
    if value
      counter.html value
      icon.append counter
    else if counter.length > 0
      counter[0].remove()

App.isFullscreen = () ->
  !!document.fullScreenElement

App.measure = (bytes) ->
  sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if 0 == bytes
    '0 Byte'
  else
    i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    return (bytes / Math.pow(1024, i)).toPrecision(4) + ' ' + sizes[i]

App.random = (length) ->
  bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  str = bytes2base64(bytes)
  str = str.slice(0, -2)
  str = str.replace(/\+/g, 'z')
  str = str.replace(/\//g, 'Z')
  return str

window.reverse_time = (a, b) ->
  a = new Date(a.get('time')).getTime()
  b = new Date(b.get('time')).getTime()
  if a < b
    1
  else if a > b
    -1
  else
    0

window.sort_time = (a, b) ->
  a = new Date(a.get('time')).getTime()
  b = new Date(b.get('time')).getTime()
  if a > b
    1
  else if a < b
    -1
  else
    0
