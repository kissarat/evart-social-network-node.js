"use strict";

var code = require('../../client/code.json');
var ffprobe = require('node-ffprobe');
var fs = require('fs');
var hash_md5 = require('md5-file');
var mmm = require('mmmagic');
var mongoose = require('mongoose');
var path = require('path');
var static_dir = path.normalize(__dirname + '/../../static');
var utils = require('../utils.js');

var magic = new mmm.Magic(mmm.MAGIC_MIME);
var md5_dir = static_dir + '/md5';
var mimes = {};
fs.readFileSync(__dirname + '/../../client/mime.csv').toString('utf8').split('\n').map(function (mime) {
    mime = mime.split(',');
    if (mime.length == 3) {
        mimes[mime[0]] = {
            ext: mime[2].split(' '),
            size: parseInt(mime[1])
        };
    }
});

var ext_regex = /\.(\w+)$/;

var handlers = [
    {mime: ['image/jpeg'], type: 'photo'},
    {mime: ['audio/mpeg', 'audio/ogg', 'audio/ogg'], type: 'audio'},
    {mime: ['video/mp4', 'video/webm'], type: 'video'},
    {mime: ['text/html', 'text/plain'], type: 'text'},
    {mime: ['application/pdf'], type: 'pdf'},
];

function find_handler_type(mime) {
    for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i];
        if (handler.mime.indexOf(mime) >= 0) {
            return handler.type;
        }
    }
    return false;
}

module.exports = {
    POST: function ($) {
        var owner_id = $.param('owner_id');
        var name = $.req.headers.name;
        var ext;
        if (name) {
            ext = ext_regex.exec(name);
            if (ext) {
                ext = ext[1];
                name = name.replace(ext_regex, '');
            }
            else {
                $.invalid('ext');
            }
        }
        else {
            $.invalid('name');
        }
        name = name.replace(/[\\:;\/]/g, '.').replace(/\s+/g, ' ').trim();
        var id = utils.id12('File');
        var id_filename = static_dir + '/id/' + id + '.' + ext;
        var stream = fs.createWriteStream(id_filename, {
            flags: 'w',
            mode: parseInt('644', 8),
            autoClose: true
        });
        return new Promise(function (resolve, reject) {
            $.req.on('end', function () {
                magic.detectFile(id_filename, $.wrap(function (mime) {
                    mime = mime.replace('; charset=binary', '');
                    var type = find_handler_type(mime);
                    var mime_type = mimes[mime];
                    if (mime_type && mime_type.ext && mime_type.ext.indexOf(ext) < 0) {
                        ext = mime_type.ext[0];
                    }
                    hash_md5(id_filename, $.wrap(function (md5) {
                        var data = {
                            name: name,
                            owner: owner_id,
                            ext: ext,
                            mime: mime,
                            md5: md5,
                            time: Date.now(),
                            type: type ? type : 'file'
                        };
                        var md5_filename = path.join(md5_dir, md5 + '.' + ext);
                        fs.stat(md5_filename, function (err, stat) {
                            var exists = true;
                            if (err) {
                                exists ='ENOENT' !== err.code;
                                if (exists) {
                                    return reject(err);
                                }
                            }
                            function save(created) {
                                return function (err) {
                                    if (err) {
                                        reject(err);
                                    }
                                    else {
                                        data.created = created;
                                        var file = new File(data);
                                        file.save().then(resolve, reject);
                                    }
                                }
                            }

                            if (exists) {
                                data.size = stat.size;
                                data.inode = stat.ino;
                                fs.unlink(id_filename, save(false));
                            } else {
                                fs.rename(id_filename, md5_filename, save(true));
                            }
                        });
                    }));
                }));
            });
            $.req.pipe(stream, {end: true});
        })
    },

    GET: function ($) {
        if ($.has('id')) {
            var q = File.findOne($.id);
            if ($.req.headers.accept.indexOf('json') > 0) {
                return q;
            }
            else {
                return File.findOne($.param('id')).then(function (file) {
                    $.res.writeHead(code.MOVED_PERMANENTLY, {
                        'content-type': file.mime,
                        location: '/md5/' + file.md5 + '/' + file.name + '.' + file.ext
                    });
                    return $.res.end();
                });
            }
        } else {
            var owner_id = $.has('owner_id') ? $.param('owner_id') : $.user._id;
            var conditions = {
                owner: owner_id
            };
            if ($.has('type')) {
                conditions.type = $.param('type');
            }
            return File.find(conditions);
        }
    },

    DELETE: function ($) {
        return File.removeOne($.id);
    }
};

global.schema.File = new mongoose.Schema({
    _id: utils.idType('File'),

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

    url: {
        type: String
    },

    type: {
        type: String,
        "default": 'file',
        required: true
    },

    name: {
        type: String
    },

    ext: {
        type: String
    },

    size: Number,
    inode: Number
}, {
    versionKey: false
});
