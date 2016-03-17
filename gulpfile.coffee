gulp = require 'gulp'
jsdom = (require 'jsdom').jsdom
fs = require 'fs'
_ = require 'underscore'
minifier = require 'minifier'
fse = require 'fs.extra'
coffee = require 'gulp-coffee'


gulp.task 'app', ->
#  gulp.src 'client/coffee/*.coffee'
#    .pipe coffee
#    .pipe gulp.dest 'client/coffee'
  document = jsdom fs.readFileSync 'client/index.html'
  files = ['(function(){']
  _.each (document.querySelectorAll 'script'), (script) ->
    if script.getAttribute 'src'
      files.push fs.readFileSync ('client' + script.getAttribute 'src')
  files.push '}).call(this);\n'
  files = files.join "\n"
  fse.mkdirpSync 'app'
  fs.writeFileSync 'app/script.js', files
  minifier.minify 'app/script.js'
  fs.unlinkSync 'app/script.js'
  files = []
  _.each (document.querySelectorAll '[rel=stylesheet]'), (style) ->
    src = style.getAttribute 'href'
    if src
      files.push fs.readFileSync ('client' + src)
    document.head.removeChild style
  files = files.join "\n"
  fs.writeFileSync 'client/all.css', files
  minifier.minify 'client/all.css'
  fs.unlinkSync 'client/all.css'
  style = document.createElement 'style'
  style.innerHTML = fs.readFileSync 'client/all.min.css'
  document.head.appendChild style
  fs.unlinkSync 'client/all.min.css'
  (document.getElementById 'script').innerHTML = '<script src="/script.min.js"></script>'
  string = document.documentElement.outerHTML.replace />\s*</g, '><'
  string = document.documentElement.outerHTML.replace /\s*\n+\s*/g, ' '
  fs.writeFileSync 'app/index.html', ('<!DOCTYPE html>\n' + string)
  fse.copy 'client/favicon.ico', 'app/favicon.ico', replace: true
  fse.copyRecursive 'client/images', 'app/images', Function()
