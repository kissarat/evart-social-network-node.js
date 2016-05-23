module.exports =
  query: ($) ->
    q = if $.has 'q' && $.param('q').trim() then q else false
    q = if q then JSON.parse(new Buffer($.param 'q', 'base64')) else {}
    $.collection($.param 'c').find(q).skip($.skip).limit($.limit).toArray $.answer

  collections: ($) ->
    $.send Object.keys $.db.collections

  entity: ($) ->
    s = {}
    for k in $.param('s').split('.')
      s[k] = 1
    $.data.findOne $.param('c'), $.id, s, $.answer

  DELETE: ($) ->
    $.collection($.param 'c').remove({_id: $.id})
