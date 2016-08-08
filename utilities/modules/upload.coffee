faker = require 'faker'
fs = require 'fs'
http = require 'http'
qs = require 'querystring'
_ = require 'underscore'

samples_dir = __dirname + '/../sample/music'
files = fs.readdirSync(samples_dir)
files = _.shuffle files
i = 0

module.exports =
  _anybody: ($) ->
    owner_id = @agent.user._id
    auth = @agent.auth
    sample = _.sample(files, _.random(5, 15))
    upload = () =>
      file = sample.pop()
      if file
        file
        data = fs.readFileSync samples_dir + '/' + file
        options =
          method: 'POST'
          hostname: @host
          path: '/api/file?' + qs.stringify
            owner_id: owner_id
            type: 'file'
          headers:
            'content-type': 'application/octet-stream'
            'content-length': data.length
            cookie: 'auth=' + auth
            filename: file
        req = http.request options, (res) ->
          i++
          console.log i + '\t' + res.statusCode.toString().yellow + ' ' + file
          if res.statusCode in [200, 201]
            upload()
          else
            res.on 'data', (chunk) ->
              console.error chunk.toString()
        req.end data
    upload()
