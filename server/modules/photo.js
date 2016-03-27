var path = require('path');
var fs = require('fs');
var ObjectID = require('mongodb').ObjectID;
var _upload = path.normalize(__dirname + '/../../static/upload');
var _photo = path.normalize(__dirname + '/../../static/photo');

module.exports = {
    GET: function (_) {
        var q = {};
        if (_.req.url.query.owner_id) {
            q.owner_id = ObjectID(_.req.url.query.owner_id)
        }
        if (_.req.url.query.album_id) {
            q.album_id = ObjectID(_.req.url.query.album_id)
        }
        _.db.collection('photo').find(q).toArray(_.answer);
    },

    PUT: function (_) {
        var tmp = _upload + '/' + _.user._id + '_' + Date.now();
        fs.open(tmp, 'w', _.wrap(function(fd) {
            var parts = {};
            var last = Date.now();
            _.req.on('data', function (data) {
                fs.write(fd, data, 0, data.byteLength, _.wrap(function (written, string) {
                    var time = Date.now();
                    parts[time] = [time - last, written];
                    last = time;
                }))
            });

            function finish() {
                var data = {
                    owner_id: _.user._id
                };
                if (_.req.headers.album) {
                    data.album_id = ObjectID(_.req.headers.album);
                }
                _.db.collection('photo').insertOne(data, _.wrap(function(result) {
                    var filename = _photo + '/' + data._id + '.jpg';
                    fs.renameSync(tmp, filename);
                    _.send({
                        id: data._id,
                        filename: filename,
                        url: '/photo/' + data._id + '.jpg',
                        parts: parts
                    });
                }));
            }

            _.req.on('end', _.req.headers.delay ? setTimeout(finish, _.req.headers.delay) : finish);
        }));
    },

    DELETE: function(_) {
        _.db.collection('photo').deleteOne({_id: _.id}, _.wrap(function(result) {
            if (result.n > 0) {
                fs.unlinkSync(_photo + '/' + _.req.url.query.id + '.jpg');
            }
            _.send(result);
        }));
    }
};
