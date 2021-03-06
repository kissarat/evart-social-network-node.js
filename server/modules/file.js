'use strict';

const code = require('../../client/code');
const fs = require('fs');
const hash_md5 = require('md5-file');
const mmm = require('mmmagic');
const mongoose = require('mongoose');
const path = require('path');
const static_dir = path.normalize(__dirname + '/../../static');
const utils = require('../utils');

const magic = new mmm.Magic(mmm.MAGIC_MIME);
const md5_dir = static_dir + '/md5';
const ext_regex = /\.(\w+)$/;

const schema = {
    _id: utils.idType('File'),

    created: CreationDateType,
    time: CreationDateType,

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    md5: {
        type: String,
        match: /^[0-9a-f]{32}$/
    },

    mime: {
        type: String,
        'enum': Object.keys(constants.mimes)
    },

    url: {
        type: String
    },

    type: {
        type: String,
        'default': 'file',
        required: true
    },

    name: {
        type: String
    },

    ext: {
        type: String,
        match: /^\w{2,6}$/
    },

    album: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album'
    },

    size: {
        type: Number,
        min: 0
    },
    
    inode: {
        type: Number,
        min: 0
    }
};

global.schema.File = new mongoose.Schema(schema, utils.merge(config.mongoose.schema.options, {
    collection: 'file',
    createAt: 'created'
}));

global.schema.File.statics.fields = {
    select: {
        user: ['md5', 'type', 'name', 'ext', 'size']
    }
};

module.exports = {
    _meta: {
        schema: schema
    },

    _before: function ($) {
        if ($.isUpdate && $.has('owner_id')) {
            return $.canManage($.get('owner_id'));
        }
        return true;
    },

    POST: function ($) {
        const owner_id = $.get('owner_id', $.user._id);
        let name = $.req.headers.name;
        let ext;
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
        const id = $.isAdmin && $.has('id') ? $.get('id') : utils.id12('File');
        const id_filename = static_dir + '/id/' + id + '.' + ext;
        const stream = fs.createWriteStream(id_filename, {
            flags: 'w',
            mode: parseInt('644', 8),
            autoClose: true
        });
        return new Promise(function (resolve, reject) {
            $.req.on('end', function () {
                magic.detectFile(id_filename, $.wrap(function (mime) {
                    mime = mime.replace('; charset=binary', '');
                    const filetype = constants.filetypes[mime];
                    const type = constants.mimes[mime];
                    if (type && type.ext && type.ext.indexOf(ext) < 0) {
                        ext = type.ext[0];
                    }
                    hash_md5(id_filename, $.wrap(function (md5) {
                        const data = {
                            _id: id,
                            name: name,
                            owner: owner_id,
                            ext: ext,
                            mime: mime,
                            md5: md5,
                            type: filetype ? filetype : 'file'
                        };
                        if ($.has('album_id')) {
                            data.album = $.get('album_id');
                        }
                        const md5_filename = path.join(md5_dir, md5 + '.' + ext);
                        fs.stat(md5_filename, function (err, stat) {
                            let exists = true;
                            if (err) {
                                exists = 'ENOENT' !== err.code;
                                if (exists) {
                                    return reject(err);
                                }
                            }
                            function save() {
                                return function (err) {
                                    if (err) {
                                        reject(err);
                                    }
                                    else {
                                        new File(data).save().then(resolve, reject);
                                    }
                                };
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
        });
    },

    PATCH: function ($) {
        return {
            query: {
                _id: $.param('id'),
                owner: $.param('owner_id', $.user._id)
            },

            $set: {
                album: $.param('album_id')
            }
        };
    },

    GET: function ($) {
        if ($.has('id')) {
            const where = {_id: $.get('id')};
            if ($.req.headers.accept.indexOf('json') > 0) {
                return {
                    single: true,
                    query: where
                };
            }
            else {
                File.findOne(where, $.wrap(function (file) {
                    if (file) {
                        $.sendStatus(code.MOVED_TEMPORARILY, {
                            'content-type': file.mime,
                            location: '/md5/' + file.md5 + '/' + file.name + '.' + file.ext
                        });
                    }
                    else {
                        $.sendStatus(code.NOT_FOUND);
                    }
                }));
            }
        }
        else {
            const where = {};
            if ($.has('owner_id')) {
                where.owner = $.get('owner_id');
            }
            if ($.has('album_id')) {
                where.album = $.get('album_id');
            }
            if ($.has('type')) {
                where.type = $.get('type');
            }
            return {
                query: where
            };
        }
    },

    DELETE: function ($) {
        return File.removeOne({_id: $.get('id')});
    }
};
