"use strict";

var fs = require('fs');
var path = require('path');
var mmm = require('mmmagic');
var hash_md5 = require('md5-file');
var ffprobe = require('node-ffprobe');
var meta = require('musicmetadata');
var code = require('../../client/code.json');
var magic = new mmm.Magic(mmm.MAGIC_MIME);
var mongoose = require('mongoose');
var static_dir = path.normalize(__dirname + '/../../static');
var md5_dir = static_dir + '/md5';
var utils = require('../utils.js');
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
        name = name.replace(/[\\:;\/]/g, '.').replace(/\s+/g, ' ');
        var id = utils.id12('File');
        var id_filename = static_dir + '/id/' + id + '.' + ext;
        var stream = fs.createWriteStream(id_filename, {
            flags: 'w',
            mode: parseInt('644', 8),
            autoClose: true
        });
        return new Promise(function (resolve, reject) {
            $.req.on('end', function () {
                fs.stat(id_filename, $.wrap(function (stat) {
                    magic.detectFile(id_filename, $.wrap(function (mime) {
                        hash_md5(id_filename, $.wrap(function (md5) {
                            mime = mime.replace('; charset=binary', '');
                            var type = find_handler_type(mime);
                            var mime_type = mimes[mime];
                            if (mime_type && mime_type.ext && mime_type.ext.indexOf(ext) < 0) {
                                ext = mime_type.ext[0];
                            }

                            var data = {
                                name: name,
                                owner: owner_id,
                                ext: ext,
                                mime: mime,
                                size: stat.size,
                                inode: stat.ino,
                                time: Date.now(),
                                md5: md5,
                                type: type ? type : 'file'
                            };
                            var md5_filename = path.join(md5_dir, md5 + '.' + ext);
                            data.path = md5_filename;
                            data.success = true;
                            function save(created) {
                                return function (err) {
                                    data.created = created;
                                    var file = new File(data);
                                    resolve(file.save());
                                }
                            }

                            // if (stat) {
                            //     fs.unlink(id_filename, save(false));
                            // } else {
                                fs.rename(id_filename, md5_filename, save(true));
                            // }
                        }));
                    }));
                }));
            });
            $.req.pipe(stream, {end: true});
        })
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
});
