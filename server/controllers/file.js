"use strict";

var fs = require('fs');
var path = require('path');
var mmm = new require('mmmagic');
var md5 = new require('md5-file');

var _md5 = path.normalize(__dirname + '/../../static/md5');
var _file = path.normalize(__dirname + '/../../static/file');
var magic = new mmm.Magic(mmm.MAGIC_MIME);

module.exports = {
    PUT: function ($) {
        var user_id = $.user._id;
        var _user_dir = path.join(_file, user_id.toString());
        if (!fs.existsSync(_user_dir)) {
            fs.mkdirSync(_user_dir, 0o777);
        }
        var filename = $.req.headers.filename;
        if (!filename) {
            $.invalid('filename');
        }
        //filename = decodeURIComponent(filename);
        filename = filename.replace(/[\\:;\/]/g, '.');
        filename = filename.replace(/\s+/g, ' ');
        var full_filename = path.join(_user_dir, filename);
        if (fs.existsSync(full_filename)) {
            fs.unlinkSync(full_filename);
        }
        var stream = fs.createWriteStream(full_filename);
        $.req.pipe(stream);
        stream.on('close', function () {
            var stat = fs.statSync(full_filename);
            magic.detectFile(full_filename, $.wrap(mime =>
                md5(full_filename, $.wrap(sum => {
                    mime = mime.replace('; charset=binary', '');
                    var data = {
                        name: filename,
                        owner_id: user_id,
                        mime: mime,
                        size: stat.size,
                        md5: sum,
                        time: new Date(stat.mtime).getTime()
                    };
                    $.data.insertOne('file', data, result => {
                        var _md5_file = path.join(_md5, sum);
                        if (fs.existsSync(_md5_file)) {
                            fs.unlinkSync(full_filename);
                            fs.linkSync(_md5_file, full_filename);
                        }
                        else {
                            fs.linkSync(full_filename, _md5_file);
                        }
                        $.send(data)
                    });
                }))));
        });
    },

    GET: function ($) {
        var user_id = $.user._id;
        if ($.has('id')) {
            $.data.findOne('file', $('id'), file => {
                $.res.writeHead(302, {
                    'content-type': file.mime,
                    location: '/md5/' + file.md5 + '/' + file.name
                });
                $.res.end();
            });
        }
        else {
            $.data.find('file', {owner_id: user_id});
        }
    },

    DELETE: function ($) {
        $.data.findOne('file', $('id'), file => {
            var filename = path.join(_file, file.owner_id.toString(), file.name);
            fs.unlink(filename, (err, result) => {
                if (err && 'ENOENT' != err.code) {
                    return $.send(500, {error: err});
                }
                $.data.deleteOne('file', $('id'), r =>
                    $.data.insertOne('deleted', file)
                );
            });
        });
    }
};
