jQuery.extend jQuery,
  sendJSON: (type, url, data, complete) ->
    this.ajax
      type: type
      url: url
      contentType: 'application/json'
      data: JSON.stringify data
      complete: complete

window.responses = {}

$(document).ajaxSuccess (event, xhr, settings) ->
  if 'GET' == settings.type and 'json' == settings.dataType
    responses[settings.url] = xhr.responseJSON