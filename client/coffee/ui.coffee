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

zIndex = (e) ->
  parseInt((if e.css then e.css('z-index') else e.style.zIndex)) || 0

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
#  w.resizable
#    container: '#root'
#    grid: 32
#  w.draggable
#    handle: '.controls'
#    cursor: 'move'
#    snap: [32, 32]
#    grid: [32, 32]
#    start: ->
#      if !w.hasClass '.active'
#        active = $('.window.active')
#        active.removeClass('active')
#        w.css('z-index', 1 + zIndex active)
#        w.addClass('active')
#    stop: ->
#      $('.window')
#      .toArray()
#      .sort (a, b) -> zIndex(a) - zIndex(b)
#      .forEach (w, i) ->
#        w.style.zIndex = i

window_handlers $('.window')

window_number = 1

$('#new_window').click ->
  new_window = $('.window').last()
  .clone()
  .appendTo('#root')
  new_window.find('.controls > .title').html(window_number += 1)
  window_handlers new_window

$('#arrange').click () ->
  $('.window')
  .toArray()
  .sort (a, b) -> zIndex(a) - zIndex(b)
  .forEach ((w) ->
    w.style.removeProperty('left')
    w.style.removeProperty('top')
    $('#root').append(w)
  )
