var fs = require('fs');
var path = require('path');
var mmm = require('mmmagic');
var hash_md5 = require('md5-file');
var ffprobe = require('node-ffprobe');
var meta = require('musicmetadata');
var code = require(__dirname + '../../client/code.json');
var magic = new mmm.Magic(mmm.MAGIC_MIME);
var mongoose = require('mongoose');
var static_dir = path.normalize(__dirname + '/../../static');
var utils = require('../utils.js');
mimes = fs.readFileSync('../../client/mime.csv');
mimes = mimes.split();

module.exports = {
    POST: function ($) {
        var owner_id = $.param('owner_id');
        var name = $.req.headers.name;
        var ext;
        if (name) {
            ext = /\.(\w+)$/.exec(ext);
            if (ext) {
                ext = ext[1];
                name = name.replace(ext, '');
            }
            else {
                $.invalid('ext');
            }
        }
        if (!name || !/.+\..+/.test(name)) {
            $.invalid('name');
        }
        name = name.replace(/[\\:;\/]/g, '.').replace(/\s+/g, ' ');
        var id = id12('File');
        var id_filename = static_dir + '/id/' + id + '.' + ext;
        stream = fs.createWriteStream(id_filename, {
            flags: 'w',
            mode: parseInt('400', 8),
            autoClose: true
        });
        $.req.pipe(stream);
        fs.stat(temp, $.wrap(function (stat) {
            magic.detectFile(temp, $.wrap(function (mime) {
                hash_md5(temp, $.wrap(function (md5) {
                    var mime = mime.replace('; charset=binary', '');
                    var type = 'file';
                    if ('audio/mpeg' == mime) {
                        type = 'audio';
                        ext: 
                    }
                    if (['video/webm', 'video/mp4'].indexOf(mime)) {
                        type = 'video';
                    }
                    data = {
                        name: filename,
                        owner: owner_id,
                        mime: mime,
                        stat: stat,
                        time: Date.now(),
                        md5: md5,
                        type: mime.indexOf('audio') === 0 ? 'audio' : 'file'
                    };
                    var md5_filename = path.join(md5_dir, md5);
                    fs.stat(md5_filename, function (err, stat) {
                        data.path = md5_filename;
                        if (stat) {
                            return fs.unlink(temp, function () {
                                data.created = false;
                                return _process_file($, data);
                            });
                        } else {
                            return fs.rename(temp, md5_filename, $.wrap(function () {
                                data.created = true;
                                return _process_file($, data);
                            }));
                        }
                    });
                }));
            }));
        }));
    },

    GET: function ($) {
        var conditions, owner_id;
        if ($.has('id')) {
            return File.findOne($.param('id')).then(function (file) {
                $.res.writeHead(code.MOVED_PERMANENTLY, {
                    'content-type': file.mime,
                    location: '/md5/' + file.md5 + '/' + file.filename
                });
                return $.res.end();
            });
        } else {
            owner_id = $.has('owner_id') ? $.param('owner_id') : $.user._id;
            conditions = {
                owner: owner_id
            };
            if ($.has('type')) {
                conditions.type = $.param('type');
            }
            console.log(conditions);
            return File.find(conditions);
        }
    },

    DELETE: function ($) {
        return File.removeOne($.id);
    }
};

global.schema.File = new mongoose.Schema({
    time: {
        type: Date,
        required: true,
        "default": Date.now
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    md5: {
        type: String
    },

    mime: {
        type: String
    },

    mime: {
        type: String
    },

    url: {
        type: String
    },

    type: {
        type: String,
        "default": 'file',
        required: true
    },

    size: {
        type: Number,
        required: true
    },

    name: {
        type: String
    }
});
