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

jQuery.fn.report = (name, message, cssClass) ->
  helpBlock = @find("[name=#{name}]").parent().find(".help-block")
  if 'string' == typeof cssClass
    helpBlock.addClass(cssClass).show().html(message)
  else if false == cssClass
    helpBlock.attr('class', 'help-block').hide().empty()
  else
    helpBlock.attr('class', 'help-block').show().html(message)

HTMLFormElement.prototype.serialize = () ->
  result = {}
  _.each @elements, (input) ->
    result[input.getAttribute 'name'] = input.value
  return result

window.responses = {}

Backbone.Model.prototype.toString = () -> @get('_id')
Backbone.Model.prototype.wrapModel = () -> (key, cb) ->
  value = @get(key)
  if value and 'object' == typeof value and not _instanceof(value, Backbone.Model)
    @set key, cb(value)

#$(document).ajaxSuccess (event, xhr, settings) ->
#  if 'GET' == settings.type and 'json' == settings.dataType
#    responses[settings.url] = xhr.responseJSON
