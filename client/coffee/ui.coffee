$('#dock').on 'mouseover', (e) ->
  target = e.target
  if target.getAttribute 'src'
# check if it is img
    li = target.parentNode.parentNode
    prevLi = li.previousElementSibling
    if prevLi
      prevLi.className = 'prev'
    target.addEventListener 'mouseout', (->
      if prevLi
        prevLi.removeAttribute 'class'
      return
    ), false
  return

$('#root').sortable
  handle: '.title'

window_handlers = (w) ->
  w.find('[title=close]').click () ->
    w.remove()
  w.find('[title=maximize]').click () ->
    current = w[0]
    $('.window').each (i, w) ->
      if current == w
        $(w).show()
      else
        $(w).toggle()

window_handlers $('.window')

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
