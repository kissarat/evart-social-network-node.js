@DEV = !version?
if DEV
  version = statistics.start

config =
  search:
    delay: 250
  trace:
    history: true
  socket:
    address: 'ws://' + location.hostname + '/socket'
    wait: 800
  alert:
    duration: 12000
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

@App = new Marionette.Application()
window.App = @App

App.defaultConfig = defaultConfig
App.debug = debug

App.channels = {}

class App.ModalRegion extends Marionette.Region
  el: '#modal'

  onShow: () ->
    @$el.css('display', 'flex')

  onEmpty: () ->
    @$el.hide()


App.addRegions
  leftRegion: '#left'
  addLeftRegion: '#root > .add.left > .region'
  mainRegion: '#main'
  addRightRegion: '#root > .add.right > .region'
  rightRegion: '#right'
  alertRegion: '#alert'
  modalRegion: App.ModalRegion
  floatingRegion: '#floating-window-container'

#App.modalRegion.on 'view:attach', () ->
#  console.log(arguments);

App.dictionary = null
window.T = (name) -> name

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
          window.T = (name) -> App.dictionary[name] || name
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
  route = location.pathname.split('/')
  Backbone.history.start
    pushState: true
    root: '/'
  if not App.user
    if not route[1] in ['login', 'signup']
      App.login()
  else
    $('body').removeAttr('class')
#    App.navigate('/profile')

class App.Router extends Marionette.AppRouter
  execute: (cb, args, name) ->
    if config.trace.history
      statistics.history[_.now()] = [name].concat args
    return Marionette.AppRouter.prototype.execute.apply(@, arguments)

class App.PageableCollection extends Backbone.PageableCollection
  mode: 'infinite'

  initialize: () ->
    @queryModel = new Backbone.Model(@queryModelInitial)
    Object.keys(@queryModelInitial).forEach (k) =>
      @queryParams[k] = () =>
        value = @queryModel.get(k)
        if value
          value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
        else
          console.error k + ' is undefied'

  state:
    order: -1
    sortKey: '_id'
    totalRecords: 2000

  queryParams:
    pageSize: 'limit'
    sortKey: 'sort'
    currentPage: null
    totalPages: null
    totalRecords: null
    skip: () -> (@state.currentPage - 1) * @state.pageSize

  parseRecords: (records) ->
    if 0 == records.length
      @state.totalRecords = @fullCollection.length
      if @state.totalRecords > 0
        @state.totalPages = Math.floor(@state.totalRecords / @state.limit)
        @state.currentPage = @state.totalPages
      else
        @state.totalPages = 0
        @state.currentPage = 1
    records

  delaySearch: (cb) ->
    @start = Date.now()
    search = () =>
      if Date.now() - @start >= App.config.search.delay
        @fullCollection.reset()
        @getFirstPage(success: cb)
    setTimeout search, App.config.search.delay

  getPage: (number) ->
    if not @loading
      @trigger('start')
      @loading = true
      super number, complete: () =>
        @trigger('finish')
        @loading = false

if window.supported
  addEventListener 'load', () ->
    $('#select-language')
    .val(App.language)
    .change (e) ->
      $.cookie 'lang', e.target.value,
        expires: 365
        path: '/'
      location.reload()

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

App.login = () ->
  if App.user
    App.trigger 'login'
  else
    $.getJSON '/api/agent', (agent) ->
      App.agent = agent
      if App.user
        App.navigate 'profile'
        $('#dock-container').show()
        App.trigger 'login'

App.logout = () ->
  if App.user
    $.getJSON '/api/user/logout', (response) ->
      $('#dock-container').hide()
      App.trigger 'logout'
      App.navigate 'login'
  else
    App.trigger 'logout'
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

App.draggable = (source) ->
  source.addEventListener 'dragstart', (e) ->
    url = /"([^"]+)"/.exec source.style.backgroundImage
    if url
      url = location.origin + url[1]
      e.dataTransfer.setData('URL', url)
#      e.preventDefault()

#  source.addEventListener 'dragover', (e) ->
#    e.preventDefault()

App.droppable = (target) ->
#  target.addEventListener 'dragover', (e) ->
#    console.log '1'
#    e.preventDefault()

  target.addEventListener 'drop', (e) ->
    url = e.dataTransfer.getData('URL')
    id = /([0-9a-z]{24})\.jpg/.exec(url || '')
    if id
      url = target.getAttribute('data-change')
#      $.sendJSON 'POST', url, {}, () ->
#        target.style.backgroundImage = "url(/photo/#{id}.jpg)"

_.extend Backbone.Validation.callbacks,
  valid: (view, attr, selector) ->
    view.$el.report(attr, '', false)
  invalid: (view, attr, error, selector) ->
    view.$el.report(attr, error, false)

    
class App.Model extends Backbone.Model
  initialize: () ->
    if @nested
      for name, model of @nested
        value = @get(name)
        if 'object' == typeof value
          @set name, new model(value)

App.alert = (type, message) ->
  if not App.alertRegion.currentView
    App.alertRegion.show new App.Views.AlertList collection: new Backbone.Collection()
  App.alertRegion.currentView.collection.add new Backbone.Model {type: type, message: message}
