request = require 'request'
qs = require 'querystring'
fs = require 'fs'
require 'colour'

module = process.env.MODULE || process.argv[2]
module = './modules/' + module
if !fs.existsSync module + '.js'
  console.error 'Module does not exists'
  process.exit 1
module = require module

agent =
  prefix: 'http://localhost/api/'

  request: (options) ->
    walk = (o, route) ->
      name = route.shift()
      switch typeof o[name]
        when 'object' then walk(o[name], route)
        when 'function' then o[name]
        when 'undefined' then o._
    cb = walk(module, options.url.split('/')) || () -> console.log 'undefined default handler'
    options.url = agent.prefix + options.url

    if !options.method
      options.method = 'GET'

    if !options.headers
      options.headers = {}
    options.headers.cookie = qs.stringify agent.cookies, '; '
    if !options.headers.cookie
      delete options.headers.cookie
    if options.params
      options.body = JSON.stringify options.params
      console.log options.body.red
      options.headers['content-type'] = 'text/json'

    request options, (error, response, body) ->
      options.response = response
      if body
        try
          options.response.body = JSON.parse body
        catch ex
          console.warn 'Unknown format'

      if error
        options.error = error

      options.post = (name) ->
        if this.response.body then this.response.body[name] else null

      if response.headers['set-cookie']
        for cookie in response.headers['set-cookie']
          for k, v of qs.parse cookie, /;\s+/
            agent.cookies[k] = v
            break

      code = options.response.statusCode.toString()
      code = if code >= 400 then code.red else code.green
      method = if 'GET' != options.method then options.method.yellow else options.method
      console.log code + ' ' + method + ' ' + options.url
      if options.response.body
        console.log options.response.body
      console.log JSON.stringify(agent.cookies).yellow
      cb.call(agent, options)

  cookies: {},

  GET: (url, cb) ->
    agent.request({url: url}, cb)

  send: (method, url, data, cb) ->
    options =
      url: url
      method: method
      params: data
    agent.request(options, cb)

  POST: (url, data, cb) ->
    agent.send('POST', url, data, cb)

  PUT: (url, data, cb) ->
    agent.send('POST', url, data, cb)

  DELETE: (url, data, cb) ->
    agent.send('POST', url, data, cb)

module.agent = () ->
  module._init.call agent

agent.POST 'agent',
  start: Date.now()
  test: true
  agent:
    os: {}
