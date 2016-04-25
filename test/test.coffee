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

Array.prototype.shuffle = () -> this.sort () -> 0.5 - Math.random()

agent =
#  host: '52.27.219.103'
  host: 'client'
  cookies: {}

  request: (options, cb) ->
    walk = (o, route) ->
      name = route.shift()
      switch typeof o[name]
        when 'object' then walk(o[name], route)
        when 'function' then o[name]
        when 'undefined' then o._
    has_callback = 'function' == typeof cb
    if !has_callback
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
#      console.log options.body.red
      options.headers['content-type'] = 'text/json'

#    console.log options
    request options, (error, response, body) ->
      if error
        console.log error
        return
      options.response = response
      if body
        try
          options.response.body = JSON.parse body
        catch ex
          console.warn 'Unknown format'
          console.log body

      if error
        options.error = error

      options.post = (name) ->
        if this.response.body then this.response.body[name] else null

      if response.headers['set-cookie']
        for cookie in response.headers['set-cookie']
          cookie = /^(\w+)=([^;]+)/.exec cookie
#          if cookie
#            for k, v of cookie
#              if k.toLowerCase() not in ['path', 'expire']
#                agent.cookies[k] = v
#                break
          if cookie
            console.log cookie.slice(1).join('=')
            agent.cookies[cookie[1]] = cookie[2]
          else
            console.error 'Invalid Set-Cookie header'

      if has_callback
#        console.log 'callback'
      else
        code = options.response.statusCode.toString()
        code = if code >= 400 then code.red else code.green
        method = if 'GET' != options.method then options.method.yellow else options.method
        url = options.url
        if options.qs
          url += '?' + qs.stringify options.qs
        console.log code + ' ' + method + ' ' + url
        if options.response.body
          console.log (JSON.stringify options.response.body).magenta
#      console.log JSON.stringify(agent.cookies).yellow
      cb.call(agent, options)

  query: (q) ->
    if q.query
      q.query = new Buffer(JSON.stringify q.query).toString('base64')
    options =
      url: 'test/random'
      qs: q
    cb = if q.callback then q.callback else null
    delete q.callback
    @request options, cb

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

agent.prefix = "http://#{agent.host}/api/"

if 'function' == typeof module._anybody
  agent.query
    entity: 'Agent'
    query: user: $exists: true
    number: 1
    populate: 'user'
    callback: (options) ->
      agents = options.response.body
      if agents.length > 0
        agent.agent = agents[0]
        agent.user = agents[0].user
        agent.cookies['auth'] = agent.agent.auth
#        console.log agent
        module._anybody.call agent, options
      else
        console.error 'No user exists'

else
  module.agent = () ->
    module._init.call agent

  agent.POST 'agent',
    start: Date.now()
    test: true
    agent:
      os: {}
