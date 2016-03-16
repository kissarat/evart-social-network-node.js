gulp = require 'gulp'
jsdom = (require 'jsdom').jsdom
fs = require 'fs'
_ = require 'underscore'
minifier = require 'minifier'
fse = require 'fs.extra'


gulp.task 'app', ->
  document = jsdom fs.readFileSync 'client/index.html'
  scripts = []
  _.each (document.querySelectorAll 'script'), (script) ->
    scripts.push fs.readFileSync ('client' + script.getAttribute 'src')
  scripts = scripts.join "\n\n\n"
  fse.mkdirpSync 'app'
  fs.writeFileSync 'app/script.js', scripts
  minifier.minify 'app/script.js'
  minifier.minify 'client/style.css'
  fs.unlinkSync 'app/script.js'
  document.head.removeChild document.querySelector '[rel=stylesheet]'
  style = document.createElement 'style'
  style.innerHTML = fs.readFileSync 'client/style.min.css'
  document.head.appendChild style
  fs.unlinkSync 'client/style.min.css'
  (document.getElementById 'script').innerHTML = '<script src="/script.min.js"></script>'
  string = document.documentElement.outerHTML.replace />\s*</g, '><'
  fs.writeFileSync 'app/index.html', ('<!DOCTYPE html>\n' + string)
  fse.copy 'client/favicon.ico', 'app/favicon.ico', replace: true
