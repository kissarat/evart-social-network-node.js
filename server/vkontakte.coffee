http = require 'http'
qs = require 'querystring'
URL = require 'url'
Cookies = require 'cookies'
request = require 'request'

vk =
  id: 4310032
  key: 'oXLF6BnVfmvaqtOCygJj'

server = http.createServer (req, res) ->
  url = req.url.replace '/vk/', ''
  url = URL.parse url
  url.params = qs.parse url.query
  cookies = new Cookies req, res
  if /^access_token/.test url.path
    access_token_url = 'https://oauth.vk.com/access_token?' + qs.stringify
      client_id: vk.id
      client_secret: vk.key
      redirect_uri: 'http://localhost/verify'
      code: url.params.code
    console.log access_token_url
    request access_token_url, (error, response, data) ->
      object = JSON.parse data
      if !object.error
        console.log object
        options =
          path: '/'
          httpOnly: false
        object.expires_in = parseInt object.expires_in
        if object.expires_in > 0
          options.expires = new Date(Date.now() + 1000 * object.expires_in)
        cookies.set 'vk', object.access_token, options
        cookies.set 'vk_uid', object.user_id, options
      res.end data
  #if /^verify/.test url

server.listen 8080
