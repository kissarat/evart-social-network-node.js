faker = require 'faker'
fs = require 'fs'
http = require 'http'

samples_dir = __dirname + '/../sample/photo'
i = 0

module.exports =
  _anybody: ($) ->
    auth = @agent.auth
    files = fs.readdirSync(samples_dir)
    .shuffle()
    upload = () =>
      file = files.pop()
      if file
        file
        data = fs.readFileSync samples_dir + '/' + file
        options =
          method: 'POST'
          hostname: $.host
          path: '/api/photo'
          headers:
            'content-type': 'image/jpeg'
            'content-length': data.length
            cookie: 'auth=' + auth
        req = http.request options, (res) ->
          i++
          console.log i + '\t' + res.statusCode.toString().yellow + ' ' + file
          if 201 == res.statusCode
            upload()
          else
#            upload()
            res.on 'data', (chunk) ->
              console.error chunk.toString()
        req.end data
    upload()
