fs = require 'fs'
path = require 'path'
mmm = require 'mmmagic'
hash_md5 = require 'md5-file'
ffprobe = require 'node-ffprobe'
meta = require 'musicmetadata';
code = require __dirname + '/../../client/code.json'
magic = new mmm.Magic mmm.MAGIC_MIME
god = require 'mongoose'

md5_dir = path.normalize __dirname + '/../../static/md5'

module.exports =
  POST: ($) ->
    owner_id = $.param 'owner_id'
    type = $.param 'type'
    filename = $.req.headers.filename
    if not filename or not /.+\..+/.test filename
      $.invalid 'filename'
    filename = filename
      .replace(/[\\:;\/]/g, '.')
      .replace(/\s+/g, ' ')
    temp = '/tmp/' + process.hrtime().join('')
    stream = fs.createWriteStream temp,
      flags: 'w'
      mode: 0o600
      autoClose: true
    $.req.pipe stream
    fs.stat temp, $.wrap (stat) ->
      magic.detectFile temp, $.wrap (mime) ->
        hash_md5 temp, $.wrap (md5) ->
          mime = mime.replace '; charset=binary', ''
          data =
            name: filename
            owner_id: owner_id
            mime: mime
            stat: stat
            time: Date.now()
            md5: md5
            type: if mime.indexOf('audio') == 0 then 'audio' else 'file'
          md5_filename = path.join(md5_dir, md5)
          fs.stat md5_filename, (err, stat) ->
            data.path = md5_filename
            if stat
              fs.unlink temp, () ->
                data.created = false
                _process_file $, data
            else
              fs.rename temp, md5_filename, $.wrap () ->
                data.created = true
                _process_file $, data
    return

  GET: ($) ->
    if $.has 'id'
      File.findOne($.param('id')).then (file) ->
        $.res.writeHead code.MOVED_PERMANENTLY,
          'content-type': file.mime
          location: '/md5/' + file.md5 + '/' + file.name
        $.res.end()
    else
      owner_id = if $.has 'owner_id' then $.param 'owner_id' else $.user._id
      conditions = owner: owner_id
      if $.has 'type'
        conditions.type = $.param('type')
      console.log conditions
      File.find conditions

  DELETE: ($) ->
    File.removeOne $.id


global.schema.File = new god.Schema
  time:
    type: Date
    required: true
    default: Date.now

  owner:
    type: god.Schema.Types.ObjectId
    ref: 'User'
    required: true

  md5:
    type: String
    required: true

  mime:
    type: String
    required: true

  filename:
    type: String
    required: true

  type:
    type: String
    default: 'file'
    required: true
#    enum: 'file audio'

  size:
    type: Number
    required: true

  author: String
  name: String
  format: String
  bit_rate: Number
  sample_rate: Number
  channels: Number
  duration: Number
  year: Number
  track: Number
  genre: String
  text: String


_process_file = ($, data) ->
  console.log data
  file = new File
    owner: data.owner_id
    md5: data.md5
    mime: data.mime
    filename: data.name
    type: data.type
    size: data.stat.size
  if 'audio' == data.type
    ffprobe data.path, $.wrap (probe) ->
        file.format = probe.format.format_name
        file.bit_rate = probe.format.bit_rate
        file.sample_rate = probe.streams[0].sample_rate
        file.channels = probe.streams[0].channels
        file.duration = probe.streams[0].duration
        meta fs.createReadStream(data.path), $.wrap (m) ->
          if m.artist and m.artist.length > 0
            file.author = m.artist.join ' & '
          if m.title
            file.name = m.title
          if m.year and Number.isFinite m.year
            file.year = parseFloat m.year
          if m.genre
            file.genre = m.genre
          if m.lyrics
            file.text = m.lyrics
          if m.track and Number.isFinite m.track
            file.track = parseFloat(m.track)
          _process_file2 $, file, data.created
  else
    _process_file2 $, file, data.created

_process_file2 = ($, file, created) ->
  file.save $.wrap () ->
    $.send (if created then code.CREATED else code.OK), file.toObject()
