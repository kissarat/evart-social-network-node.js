icons = document.querySelectorAll('#dock a')
_.each icons, (icon) ->
  register icon,
    click: (e) ->
      e.preventDefault()
      region = @getAttribute('data-open')
      href = @getAttribute('href')
      widget = App.widgets[href.slice(1)]
      if region and widget
        $('#' + region).show()
        region = App[region + 'Region']
        widget null, region
      else
        App.navigate href
    mouseover: () ->
      _.each document.querySelectorAll('#dock a.prev'), (prev) ->
        prev.classList.remove 'prev'
      if @getAttribute('href')
        @classList.add 'prev'
#    mouseout: () ->
#      @classList.remove 'prev'

$('#root').sortable
  handle: '.title'

TRANSLIT =
  "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "zh", "з": "z", "и": "i", "й": "j",
  "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f",
  "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu",
  "я": "ya", '_': '', "ї": "yi", "ґ": "g", "є": "ie"


ui_error = (message) ->
  if 'object' == typeof message
    message = JSON.stringify message
    console.warn 'Message is object'
  alert message

form_submit = (data) ->
#   form = document.querySelector 'form.view'
#  for k, v of data
#    if form[k]
#      form[k].value = v
#  $('[type=submit]', form).click()
  view = App.mainRegion.currentView
  for k, v of data
    view.model.set(k, v)
  view.events.submit.call view
  return

$(document).ajaxError (_1, ajax) ->
  if ajax.responseJSON && ajax.responseJSON.error
    if ajax.responseJSON.error.message
      ui_error ajax.responseJSON.error.message
    else
      ajax.responseJSON.error
