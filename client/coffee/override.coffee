jQuery.sendJSON = (type, url, data, complete) ->
    this.ajax
      type: type
      url: url
      contentType: 'application/json'
      data: JSON.stringify data
      complete: complete

jQuery.fn.serialize = () ->
  this[0].serialize()

jQuery.fn.busy = (state) ->
  this.toggleClass('busy', state)

HTMLFormElement.prototype.serialize = () ->
  result = {}
  _.each @elements, (input) ->
    result[input.getAttribute 'name'] = input.value
  return result

window.responses = {}

$(document).ajaxSuccess (event, xhr, settings) ->
  if 'GET' == settings.type and 'json' == settings.dataType
    responses[settings.url] = xhr.responseJSON
