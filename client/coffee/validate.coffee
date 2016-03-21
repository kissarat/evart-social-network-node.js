chars_subs =
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'

@validate =
  fields:
    text: (d) ->
      d = d.trim()
      d = d.replace(/\s*\n+\s*/g, '<br/>');
      d = d.replace(/[ \t\r]/g, ' ');
      d = d.replace(/[<>"]/g, (s)-> chars_subs[s])
      return d

if module
  module.exports = @validate
