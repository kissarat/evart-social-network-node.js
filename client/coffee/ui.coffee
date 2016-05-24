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
