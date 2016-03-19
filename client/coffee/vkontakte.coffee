vk =
  id: 4310032
  permissions:
    ads: 'Доступ к расширенным методам работы с <a href="/pages?oid=-1&amp;p=Ads_API">рекламным API</a>.'
    audio: "Доступ к аудиозаписям."
    docs: "Доступ к документам."
    friends: "Доступ к друзьям."
    groups: "Доступ к группам пользователя."
    #messages: "<b>(для Standalone-приложений)</b> Доступ к расширенным методам работы с сообщениями."
    nohttps: 'Возможность осуществлять <a href="/pages?oid=-1&amp;p=%D0%92%D0%B7%D0%B0%D0%B8%D0%BC%D0%BE%D0%B4%D0%B5%D0%B9%D1%81%D1%82%D0%B2%D0%B8%D0%B5_%D1%81_API_%D0%B1%D0%B5%D0%B7_HTTPS">запросы к API без HTTPS</a>.<br>↵ <b>Внимание, данная возможность находится на этапе тестирования и может быть изменена.</b>'
    notes: "Доступ заметкам пользователя."
    notifications: "Доступ к оповещениям об ответах пользователю."
    notify: "Пользователь разрешил отправлять ему уведомления."
    #offers: "Доступ к предложениям (устаревшие методы)."
    offline: 'Доступ к <a href="/pages?oid=-1&amp;p=API">API</a> в любое время со стороннего сервера.'
    pages: "Доступ к wiki-страницам."
    photos: "Доступ к фотографиям."
    #questions: "Доступ к вопросам (устаревшие методы)."
    stats: "Доступ к статистике групп и приложений пользователя, администратором которых он является."
    status: "Доступ к статусу пользователя."
    video: "Доступ к видеозаписям."
    #wall: "Доступ к обычным и расширенным методам работы со стеной.<br><b>Внимание, данное право доступа недоступно для сайтов (игнорируется при попытке авторизации).</b>"

params = (string) ->
  result = {}
  string.split('&').forEach (param) ->
    param = param.split '='
    result[param[0]] = param[1]
  result

if /^\/verify/.test location.pathname
  query = params location.search.slice 1
  if query.error
    alert query.error_description
  else
    $.get '/vk/access_token?code=' + query.code, () ->
      console.log 'ok'
#    $.cookie 'vk', query.access_token, expires: query.expires_in
#    $.cookie 'vk_uid', query.user_id, expires: query.expires_in
else if !$.cookie 'vk' && confirm('Authorize vkontakte?')
  location.href = 'https://oauth.vk.com/authorize?' + $.param
      client_id: vk.id
      scope: (Object.keys vk.permissions).join ','
      redirect_uri: location.origin + '/verify'
