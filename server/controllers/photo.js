var path = require('path');
var fs = require('fs');
var _upload = path.normalize(__dirname + '/../../static/photo');

module.exports = {
    index: function (_) {
        var _user_upload = _upload + '/' + _.user._id;
        //var stat = fs.statSync(_user_upload);
        _.res.send({
            path: '/photo/' + _.user._id,
            photos: fs.existsSync(_user_upload) ? fs.readdirSync(_user_upload) : []
        });
    },

    POST: function (_) {
        var _user_upload = _upload + '/' + _.req.url.query.target_id;
        //var stat = fs.statSync(_user_upload);
        if (!fs.existsSync(_user_upload)) {
            fs.mkdirSync(_user_upload);
        }
        var filename = _user_upload + '/' + _.req.headers.name;
        fs.open(filename, 'w', _.wrap(function(fd) {
            _.req.on('data', function (data) {
                fs.write(fd, data, 0, data.byteLength, _.wrap(function (written, string) {
                }))
            });

            _.req.on('end', function () {
                _.res.send({
                    filename: filename
                });
            });
        }));
    }
};
