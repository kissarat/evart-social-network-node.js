casper = require('casper').create()
colorizer = require('colorizer').create('Colorizer')

casper.onError = (msg, trace) ->
  @echo msg

last = Date.now()
elapsed = (text) ->
  r = ((Date.now() - last) / 1000)
  last = Date.now()
  r + (text || '')

casper.start 'http://localhost', ->
  @echo elapsed(), 'INFO'
  @echo @getTitle()

casper.run()
