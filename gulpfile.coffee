gulp = require 'gulp'
sass = require 'gulp-sass'
coffee = require 'gulp-coffee'
jsdom = (require 'jsdom').jsdom
fs = require 'fs'
_ = require 'underscore'
minifier = require 'minifier'
fse = require 'fs.extra'


gulp.task 'app', ->
  version = Date.now()
  string = fs.readFileSync 'client/index.html'
  string = string.toString('utf8').replace /\s*\n+\s*/mg, ' '
  string = string.replace />\s*</mg, '><'
  document = jsdom string
  files = ['\n(function(version){']
  _.each (document.querySelectorAll 'script'), (script) ->
    if script.getAttribute 'src'
      files.push fs.readFileSync ('client' + script.getAttribute 'src')
  files.push "}).call(this, #{version});\n"
  files = files.join "\n"
  fse.mkdirpSync 'app'
  fs.writeFileSync 'app/script.js', files
  minifier.minify 'app/script.js'
  fs.unlinkSync 'app/script.js'
  files = fs.readFileSync 'app/script.min.js'
  fs.unlinkSync 'app/script.min.js'
  string = files.toString 'utf8'
  (document.getElementById 'script').innerHTML = "<script>\n//\t<![CDATA[\n#{string}\n//\t]]>\n</script>"
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
  files = fs.readFileSync 'client/all.min.css'
  files = files.toString('utf8').replace /\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, ''
  style.innerHTML = "\n#{files}\n"
  document.head.appendChild style
  fs.unlinkSync 'client/all.min.css'
  document.querySelector('[http-equiv="Last-Modified"]').setAttribute('content', new Date(version).toUTCString())
  iter = document.createNodeIterator(document.documentElement, 128)
  loop
    comment = iter.nextNode()
    if !comment
      break
    comment.parentNode.removeChild comment
  string = document.documentElement.outerHTML
  fs.writeFileSync 'app/index.html', ('<!DOCTYPE html>\n' + string)
  fse.copy 'client/favicon.ico', 'app/favicon.ico', replace: true
  fse.copyRecursive 'client/images', 'app/images', Function()

gulp.task 'translate', ->
  gulp
  .src 'client/*.sass'
  .pipe sass()
  .pipe gulp.dest 'client/'

  gulp
  .src 'client/coffee/*.coffee'
  .pipe coffee()
  .pipe gulp.dest 'client/coffee/'

gulp.task 'default', ['translate', 'app']
