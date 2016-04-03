casper = require('casper').create()
colorizer = require('colorizer').create('Colorizer')
system = require 'system'
scenario = require './scenarios/' + system.args[4]
#global.faker = require 'faker'

casper.on 'remote.message', (msg) ->
  @echo msg

casper.on 'error', (msg, e) ->
  @echo msg
  @echo JSON.stringify e

casper.on 'complete.error', (msg) ->
  @echo msg

casper.on 'load.failed', (msg) ->
  @echo msg

casper.form_submit = (data) ->
  data = JSON.stringify(data)
  @echo data
  evaluate = (d) ->
    form_submit JSON.parse d
  @evaluate evaluate, data

casper.get_path = () ->
  @evaluate () ->
    Backbone.history.fragment

last = Date.now()
global.elapsed = (text) ->
  r = ((Date.now() - last) / 1000)
  last = Date.now()
  r + (text || '')

scenario.apply casper, system.args.slice 5

casper.run()
