jQuery.sendJSON = (type, url, data, complete) ->
  @ajax
    type: type
    url: url
    contentType: 'application/json; charset=UTF-8'
    dataType: 'json'
    data: JSON.stringify data
    complete: complete

jQuery.fn.serialize = () ->
  @[0].serialize()

jQuery.fn.busy = (state) ->
  @toggleClass('busy', state)

jQuery.fn.report = (name, messsage, cssClass) ->
  helpBlock = @find("[name=#{name}]").parent().find(".help-block")
  if 'string' == typeof cssClass
    helpBlock.addClass(cssClass).show().html(messsage)
  else if false == cssClass
    helpBlock.attr('class', 'help-block').hide().empty()
  else
    helpBlock.attr('class', 'help-block').show().html(messsage)

HTMLFormElement.prototype.serialize = () ->
  result = {}
  _.each @elements, (input) ->
    result[input.getAttribute 'name'] = input.value
  return result

window.responses = {}

#$(document).ajaxSuccess (event, xhr, settings) ->
#  if 'GET' == settings.type and 'json' == settings.dataType
#    responses[settings.url] = xhr.responseJSON
