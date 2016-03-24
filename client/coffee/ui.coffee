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

window_handlers $('.window')

CYRILLIC_TO_LATIN = {
  "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e", "ж": "zh", "з": "z", "и": "i", "й": "j",
  "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f",
  "х": "h", "ц": "c", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu",
  "я": "ya", '_': ''
}
