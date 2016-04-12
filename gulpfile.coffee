gulp = require 'gulp'
sass = require 'gulp-sass'
coffee = require 'gulp-coffee'
jsdom = (require 'jsdom').jsdom
fs = require 'fs'
_ = require 'underscore'
minifier = require 'minifier'
fse = require 'fs.extra'
S = require 'string'


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
  _.each (document.querySelectorAll '[data-src]'), (script) ->
    script.innerHTML = fs.readFileSync ('client' + script.getAttribute 'data-src')
    script.removeAttribute 'data-src'
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
  string = files.join "\n"
  string = string.replace /\.\.\/fonts\//g, '/images/'
  fs.writeFileSync 'client/all.css', string
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
  fse.mkdirp 'app/languages'
  string = document.documentElement.outerHTML
  string = '<!DOCTYPE html>\n' + string
  fs.writeFileSync 'app/index.html', string
  fs.readdirSync('client/languages').filter((name) -> /\.json$/.test name).forEach (name) ->
    language = name.split('.')[0]
    dictionary = JSON.parse fs.readFileSync 'client/languages/' + name
    fs.writeFileSync "app/languages/#{language}.json", JSON.stringify dictionary
  fse.copy 'client/favicon.ico', 'app/favicon.ico', replace: true
  fse.copyRecursive 'client/images', 'app/images', Function()
  fse.copyRecursive 'client/lib/components-font-awesome/fonts', 'app/images', Function()
  return


translate_coffee = (dir) ->
  gulp
  .src dir + '*.coffee'
  .pipe coffee()
  .pipe gulp.dest dir

gulp.task 'translate', ->
  gulp
  .src 'client/*.sass'
  .pipe sass()
  .pipe gulp.dest 'client/'

  translate_coffee 'client/coffee/'
  translate_coffee 'server/modules/'
  translate_coffee 'test/'
  translate_coffee 'test/modules/'

gulp.task 'default', ['translate', 'app']
