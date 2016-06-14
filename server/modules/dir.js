var fs = require('fs');
var path = require('path');

module.exports = {
    GET: function ($, path) {
        fs.readdir(path, function (err, _files) {
            var files;
            if ($.has('ext')) {
                files = [];
                var ext = $.param('ext');
                var regex = new RegExp(`\.(${ext})$`, 'i');
                _files.forEach(function (file) {
                    if (regex.test(file)) {
                        files.push(file);
                    }
                })
            }
            else {
                files = _files;
            }
            $.send(files);
        });
    }
};
