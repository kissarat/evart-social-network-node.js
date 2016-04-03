var fs = require('fs');
var path = require('path');
var request = require('request');
var ObjectID = require('mongodb').ObjectID;
var _static = path.normalize(__dirname + '/../../static');

module.exports = {
    index: function (_) {
        _.db.collection('media').aggregate([
                {
                    $match: {
                        owner_id: _.req.url.query.owner_id ? ObjectID(_.req.url.query.owner_id) : _.user._id
                    }
                },
                {$sort: {time: 1}}
            ])
            .toArray(_.answer);
    },

    view: function(_) {
        _.db.collection('media').findOne({_id: ObjectID(_.req.url.query.id)}, _.answer);
    },

    PUT: function (_) {
        var data = {
            _id: Date.now(),
            owner_id: _.user._id,
            title: _.body.title,
            type: 'video'
        };

        if (_.req.headers.geo) {
            data.geo = JSON.parse(_.req.headers.geo);
        }

        _.db.collection('media').insertOne(data, _.wrap(function (result) {
            _.send({
                id: data._id,
                result: result
            });
        }));
    },

    upload: function (_) {
        var id = parseFloat(_.req.url.route[1]);
        var filename = _static + '/upload/video/' + id;
        fs.open(filename, 'w', _.wrap(function (fd) {
            _.req.on('data', function (data) {
                fs.write(fd, data, 0, data.byteLength, _.wrap(function (written, string) {
                    //if (written.length != data.byteLength) {
                    //    _.send(502, {
                    //        received: data.byteLength,
                    //        written: written
                    //    });
                    //}
                }))
            });

            _.req.on('end', function () {
                fs.closeSync(fd);
                var summary = {
                    id: id,
                    info: {uploaded: Date.now(), status: 'uploaded'}
                };
                _.db.collection('media').update({_id: id}, {$set: summary.info}, _.wrap(function (result) {
                    summary.result = result;
                    _.send(summary);
                }));
            });
        }));
    },

    capabilities: function (_) {
        var ffmpeg = require('fluent-ffmpeg');

        var list = ['formats', 'codecs', 'encoders', 'filters'];
        list.reverse();
        var result = {};

        function collect() {
            if (list.length <= 0) {
                _.send(result);
                return;
            }
            var capability = list.pop();
            var method = 'getAvailable' + capability[0].toUpperCase() + capability.slice(1);
            //console.log(method);
            method = ffmpeg[method];
            if (method) {
                method(function (err, capabilities_list) {
                    var info;
                    if (err) {
                        info = {error: err};
                    }
                    else {
                        info = capabilities_list;
                    }
                    result[capability] = info;
                    collect();
                })
            }
            else {
                console.error(capability + ' not found');
                collect();
            }
        }

        collect();
    },

    oembed: function (_) {
        var req_url = _.req.url.query.url;
        var oembed_url = null;
        if (req_url.indexOf('youtube') >= 0) {
            oembed_url = 'https://www.youtube.com/oembed?format=json&url=' + req_url;
        }
        else if (req_url.indexOf('vimeo') >= 0) {
            oembed_url = 'https://vimeo.com/api/oembed.json?url=' + req_url;
        }
        request(oembed_url, function (err, r, b) {
            if ('GET' == _.req.method) {
                _.res.end(b);
            }
            else {
                var data = JSON.parse(b);
                if (_.req.headers.geo) {
                    data.geo = JSON.parse(_.req.headers.geo);
                }
                data.owner_id = _.user._id;
                _.db.collection('media').insertOne(data, _.answer);
            }
        });
    }
};