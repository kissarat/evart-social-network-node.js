module.exports =
  query: ($) ->
    q = if $.has 'q' then $.param 'q' else {}
    q = JSON.parse(new Buffer(q, 'base64'))
    $.collection($.param 'c').find(q).skip($.skip).limit($.limit).toArray $.answer

  collections: ($) ->
    $.send Object.keys $.db.collections

  entity: ($) ->
    s = {}
    for k in $.param('s').split('.')
      s[k] = 1
    $.data.findOne $.param('c'), $.id, s, $.answer
